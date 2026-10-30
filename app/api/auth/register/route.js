import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import {
  hashPassword,
  signToken,
  COOKIE_NAME,
  getAuthCookieOptions,
  serializeUser,
  validateEmail,
  validateMobile,
  normalizeMobile,
  validateGSTIN
} from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      accountType, // 'retail' or 'wholesale'
      name,
      contactName, // wholesale form alias
      businessName,
      businessType,
      businessAddress,
      gstin,
      email,
      mobile,
      password,
      confirmPassword,
    } = body;

    // Normalize account type
    const isWholesale = accountType === 'wholesale';
    const role = isWholesale ? 'WHOLESALER' : 'RETAILER';
    const displayName = (isWholesale ? (contactName || name) : name)?.trim();

    // 1. Validation: Name
    if (!displayName || displayName.length < 2) {
      return NextResponse.json(
        { error: isWholesale ? 'Contact person name is required (min 2 characters)' : 'Full name is required (min 2 characters)' },
        { status: 400 }
      );
    }

    // 2. Validation: Wholesale specific required fields
    if (isWholesale) {
      if (!businessName || businessName.trim().length < 2) {
        return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
      }
      if (!businessType || businessType.trim().length < 2) {
        return NextResponse.json({ error: 'Business type is required' }, { status: 400 });
      }
      if (!businessAddress || businessAddress.trim().length < 5) {
        return NextResponse.json({ error: 'Complete business address is required' }, { status: 400 });
      }
      if (gstin && !validateGSTIN(gstin)) {
        return NextResponse.json(
          { error: 'Invalid GSTIN format. Example: 22AAAAA0000A1Z5' },
          { status: 400 }
        );
      }
    }

    // 3. Validation: Email
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Validation: Mobile
    if (!mobile || !validateMobile(mobile)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }
    const cleanMobile = normalizeMobile(mobile);

    // 5. Validation: Password & Confirmation
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password and Confirm Password do not match' },
        { status: 400 }
      );
    }

    // 6. Check for duplicate accounts (Email & Mobile)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    const existingByMobile = await prisma.user.findUnique({
      where: { mobile: cleanMobile }
    });
    if (existingByMobile) {
      return NextResponse.json(
        { error: 'An account with this mobile number already exists. Please log in.' },
        { status: 409 }
      );
    }

    // 7. Wholesale accounts start as PENDING admin approval, Retailers start as APPROVED
    const approvalStatus = isWholesale ? 'PENDING' : 'APPROVED';

    // 8. Hash password securely
    const passwordHash = await hashPassword(password);

    // 9. Save new user in database
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

    // 10. Generate JWT session token
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      approvalStatus: newUser.approvalStatus,
      sessionVersion: 1,
    });

    // 11. Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, getAuthCookieOptions());

    return NextResponse.json({
      message: isWholesale
        ? 'Wholesale account registered successfully! Your account is currently pending admin verification.'
        : 'Retail account created successfully!',
      user: serializeUser(newUser),
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
