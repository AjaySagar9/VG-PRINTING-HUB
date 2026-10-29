import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import {
  verifyPassword,
  signToken,
  COOKIE_NAME,
  getAuthCookieOptions,
  serializeUser,
  normalizeMobile
} from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        { error: 'Please enter your email address or mobile number' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Please enter your password' },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();
    const lowerIdentifier = trimmedIdentifier.toLowerCase();
    const cleanMobile = normalizeMobile(trimmedIdentifier);

    // Search user by email OR mobile number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerIdentifier },
          { mobile: cleanMobile },
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials. No account found with this email or mobile.' },
        { status: 401 }
      );
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials. The password you entered is incorrect.' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, getAuthCookieOptions());

    const safeUser = serializeUser(user);

    // Provide specific helpful messages based on role & status
    let message = 'Login successful!';
    if (user.role === 'WHOLESALER') {
      if (user.approvalStatus === 'PENDING') {
        message = 'Welcome! Note: Your wholesale account is currently pending admin approval.';
      } else if (user.approvalStatus === 'APPROVED') {
        message = 'Welcome back! Your wholesale partner access is active with exclusive pricing.';
      } else if (user.approvalStatus === 'REJECTED') {
        message = 'Your wholesale account application was not approved. Please contact support.';
      }
    }

    return NextResponse.json({
      message,
      user: safeUser,
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
