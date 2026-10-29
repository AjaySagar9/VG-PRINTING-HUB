import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { normalizeMobile } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        { error: 'Please enter your registered email address or mobile number' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    const lower = trimmed.toLowerCase();
    const cleanMobile = normalizeMobile(trimmed);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lower },
          { mobile: cleanMobile },
        ]
      }
    });

    if (!user) {
      // In production security, we might return generic message, but for clarity:
      return NextResponse.json(
        { error: 'No account found matching this email or mobile number.' },
        { status: 404 }
      );
    }

    // Generate random reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      }
    });

    return NextResponse.json({
      message: `Password reset request received for ${user.email}. Enter your new password using the generated token.`,
      resetToken,
      email: user.email,
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request. Please try again.' },
      { status: 500 }
    );
  }
}
