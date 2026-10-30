import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import {
  getCurrentUser,
  verifyPassword,
  COOKIE_NAME,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Please enter your password to confirm account deletion' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'The password you entered is incorrect. Account deletion cancelled.' },
        { status: 400 }
      );
    }

    // Privacy-compliant soft deletion:
    // Mark as deleted, increment session version, and randomize unique identifiers so customer can re-register in the future if desired,
    // while preserving historical financial records of past orders for tax & regulatory compliance.
    const anonymizedSuffix = Date.now().toString(36);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        sessionVersion: { increment: 10 },
        email: `deleted_${user.id}_${anonymizedSuffix}@anonymized.vgprintinghub.com`,
        mobile: `del_${user.id.slice(-6)}_${anonymizedSuffix}`,
        avatarUrl: null,
      },
    });

    // Clear auth cookie
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Your account and personal profile have been deleted. Past order invoices are archived for accounting records.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to process account deletion request' },
      { status: 500 }
    );
  }
}

