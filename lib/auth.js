import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'vg_printing_hub_jwt_super_secret_key_2026_xyz';
export const COOKIE_NAME = 'vg_auth_token';

/**
 * Hash a plain password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password with hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT token
 */
export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from request cookies or Authorization header
 * Fetches fresh user from DB to enforce current role and approvalStatus
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        businessName: true,
        businessType: true,
        businessAddress: true,
        gstin: true,
        createdAt: true,
      }
    });

    return user || null;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Standard cookie configuration
 */
export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

/**
 * Safe user response serializer (strips sensitive fields)
 */
export function serializeUser(user) {
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

/**
 * Input format validators
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

export function validateMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return false;
  // Indian 10-digit mobile number check, allowing optional +91 or leading 0
  const cleaned = mobile.replace(/[\s-]/g, '');
  return /^(\+91|0)?[6-9]\d{9}$/.test(cleaned);
}

export function normalizeMobile(mobile) {
  if (!mobile) return '';
  const cleaned = mobile.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+91')) return cleaned.slice(3);
  if (cleaned.startsWith('0')) return cleaned.slice(1);
  return cleaned;
}

export function validateGSTIN(gstin) {
  if (!gstin) return true; // Optional field
  const cleaned = gstin.trim().toUpperCase();
  // Standard Indian 15-character GSTIN format
  const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return re.test(cleaned);
}
