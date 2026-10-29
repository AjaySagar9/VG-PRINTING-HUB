const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vg_printing_hub_jwt_super_secret_key_2026_xyz';
const COOKIE_NAME = 'vg_auth_token';

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Helpers
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function serializeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    approvalStatus: user.approvalStatus,
    businessName: user.businessName || null,
    businessType: user.businessType || null,
    businessAddress: user.businessAddress || null,
    gstin: user.gstin || null,
    createdAt: user.createdAt,
    isWholesaleApproved: user.role === 'WHOLESALER' && user.approvalStatus === 'APPROVED',
  };
}

function normalizeMobile(mobile) {
  if (!mobile) return '';
  const cleaned = String(mobile).replace(/[\s-]/g, '');
  if (cleaned.startsWith('+91')) return cleaned.slice(3);
  if (cleaned.startsWith('0')) return cleaned.slice(1);
  return cleaned;
}

// Authentication middleware
async function authenticateUser(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      req.user = null;
      return next();
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

app.use(authenticateUser);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running successfully on Render & Local!' });
});

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      accountType,
      name,
      contactName,
      businessName,
      businessType,
      businessAddress,
      gstin,
      email,
      mobile,
      password,
      confirmPassword,
    } = req.body;

    const isWholesale = accountType === 'wholesale';
    const role = isWholesale ? 'WHOLESALER' : 'RETAILER';
    const displayName = (isWholesale ? (contactName || name) : name)?.trim();

    if (!displayName || displayName.length < 2) {
      return res.status(400).json({ error: 'Name is required (min 2 characters)' });
    }

    if (isWholesale) {
      if (!businessName || !businessType || !businessAddress) {
        return res.status(400).json({ error: 'Business name, type, and address are required for wholesale registration' });
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const cleanMobile = normalizeMobile(mobile);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check duplicates
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const existingMobile = await prisma.user.findUnique({ where: { mobile: cleanMobile } });
    if (existingMobile) {
      return res.status(409).json({ error: 'An account with this mobile number already exists' });
    }

    const approvalStatus = isWholesale ? 'PENDING' : 'APPROVED';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: displayName,
        email: normalizedEmail,
        mobile: cleanMobile,
        passwordHash,
        role,
        approvalStatus,
        businessName: isWholesale ? businessName.trim() : null,
        businessType: isWholesale ? businessType.trim() : null,
        businessAddress: isWholesale ? businessAddress.trim() : null,
        gstin: isWholesale && gstin ? gstin.trim().toUpperCase() : null,
      }
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      approvalStatus: newUser.approvalStatus,
    });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: isWholesale
        ? 'Wholesale account registered! Status: Pending admin approval.'
        : 'Retail account created successfully!',
      user: serializeUser(newUser),
    });
  } catch (error) {
    console.error('Express register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier (email/mobile) and password are required' });
    }

    const lowerId = identifier.trim().toLowerCase();
    const cleanMobile = normalizeMobile(identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerId },
          { mobile: cleanMobile }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. No account found.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Express login error:', error);
    res.status(500).json({ error: 'Login server error' });
  }
});

// 3. LOGOUT
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// 4. ME / SESSION RESTORATION
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({ user: null, authenticated: false });
  }
  return res.json({
    user: serializeUser(req.user),
    authenticated: true,
  });
});

// 5. FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or mobile is required' });
    }
    const lowerId = identifier.trim().toLowerCase();
    const cleanMobile = normalizeMobile(identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: lowerId }, { mobile: cleanMobile }]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hr

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    res.json({
      message: `Password reset token generated for ${user.email}`,
      resetToken,
      email: user.email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Forgot password error' });
  }
});

// 6. RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Valid token and min 6 char password required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token.trim(),
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token is invalid or expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Reset password error' });
  }
});

// 7. PRODUCTS (Enforcing wholesale prices on backend)
app.get('/api/products', async (req, res) => {
  try {
    const isApprovedWholesaler = req.user && req.user.role === 'WHOLESALER' && req.user.approvalStatus === 'APPROVED';

    let products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (!products || products.length === 0) {
      products = [
        { id: '1', name: 'Custom Corporate T-Shirt', price: 499, wholesalePrice: 280, description: 'High quality cotton' },
        { id: '2', name: 'Personalized Mug', price: 299, wholesalePrice: 135, description: 'Ceramic 300ml' },
        { id: '3', name: 'Engraved Metal Pen', price: 199, wholesalePrice: 85, description: 'Smooth ink' },
        { id: '4', name: 'Magnetic Badge', price: 99, wholesalePrice: 45, description: 'Custom printed' },
      ];
    }

    const sanitized = products.map(prod => {
      const { wholesalePrice, ...retail } = prod;
      if (isApprovedWholesaler) {
        return {
          ...prod,
          wholesalePrice: wholesalePrice || Math.round(prod.price * 0.6),
          canAccessWholesale: true,
        };
      }
      return {
        ...retail,
        canAccessWholesale: false,
      };
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 8. ADMIN WHOLESALER APPROVAL
app.get('/api/admin/wholesalers', async (req, res) => {
  try {
    if (req.user && req.user.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const wholesalers = await prisma.user.findMany({
      where: { role: 'WHOLESALER' },
      orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }]
    });

    const stats = {
      totalWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER' } }),
      pendingWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'PENDING' } }),
      approvedWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'APPROVED' } }),
      rejectedWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'REJECTED' } }),
    };

    res.json({ wholesalers: wholesalers.map(serializeUser), stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wholesalers' });
  }
});

app.patch('/api/admin/wholesalers', async (req, res) => {
  try {
    const { userId, approvalStatus } = req.body;
    if (!userId || !['APPROVED', 'PENDING', 'REJECTED'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid user ID or status' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus }
    });

    res.json({ message: 'Status updated', user: serializeUser(updated) });
  } catch (error) {
    res.status(500).json({ error: 'Update status failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
