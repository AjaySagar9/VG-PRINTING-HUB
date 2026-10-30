import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channel, action, code } = body; // channel: 'email' | 'mobile', action: 'send' | 'verify'

    if (!['email', 'mobile'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel specified. Must be email or mobile.' },
        { status: 400 }
      );
    }

    // 1. Action: SEND OTP
    if (action === 'send') {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const updateData = channel === 'email'
        ? { emailVerifyCode: generatedCode }
        : { mobileVerifyCode: generatedCode };

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      const recipient = channel === 'email' ? user.email : `+91 ${user.mobile}`;

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${recipient}.`,
        // Return code for testing/demo
        testCode: generatedCode,
      });
    }

    // 2. Action: VERIFY OTP
    if (action === 'verify') {
      if (!code || typeof code !== 'string' || code.trim().length !== 6) {
        return NextResponse.json(
          { error: 'Please enter a valid 6-digit verification code' },
          { status: 400 }
        );
      }

      const cleanCode = code.trim();
      const expectedCode = channel === 'email' ? user.emailVerifyCode : user.mobileVerifyCode;

      if (!expectedCode || expectedCode !== cleanCode) {
        return NextResponse.json(
          { error: 'Incorrect or expired verification code. Please request a new code.' },
          { status: 400 }
        );
      }

      const updateData = channel === 'email'
        ? { isEmailVerified: true, emailVerifyCode: null }
        : { isMobileVerified: true, mobileVerifyCode: null };

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `${channel === 'email' ? 'Email address' : 'Mobile number'} has been successfully verified!`,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}

