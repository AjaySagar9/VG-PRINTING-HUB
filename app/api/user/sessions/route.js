import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import {
  getCurrentUser,
  signToken,
  COOKIE_NAME,
  getAuthCookieOptions,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headerList = await headers();
    const userAgent = headerList.get('user-agent') || 'Current Browser / Device';
    const forwardedFor = headerList.get('x-forwarded-for') || '127.0.0.1';
    const clientIp = forwardedFor.split(',')[0].trim();

    // Parse simple user agent hints
    let browser = 'Modern Web Browser';
    if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
    else if (userAgent.includes('Chrome/')) browser = 'Google Chrome';
    else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (userAgent.includes('Safari/')) browser = 'Apple Safari';

    let os = 'Desktop Device';
    if (userAgent.includes('Windows')) os = 'Windows OS';
    else if (userAgent.includes('Macintosh')) os = 'macOS';
    else if (userAgent.includes('Android')) os = 'Android Mobile';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS Device';
    else if (userAgent.includes('Linux')) os = 'Linux';

    return NextResponse.json({
      currentSession: {
        browser,
        os,
        clientIp,
        isCurrent: true,
        lastActive: new Date().toISOString(),
      },
      sessionVersion: user.sessionVersion || 1,
    });
  } catch (error) {
    console.error('Session inspection error:', error);
    return NextResponse.json({ error: 'Failed to inspect sessions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'logout_others') {
      // Increment session version to invalidate all older tokens issued to other devices
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          sessionVersion: { increment: 1 },
        },
      });

      // Issue fresh token for the current session with the new sessionVersion
      const token = signToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus,
        sessionVersion: updatedUser.sessionVersion,
      });

      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, getAuthCookieOptions());

      return NextResponse.json({
        success: true,
        message: 'Successfully signed out from all other browsers and devices. Your current device remains securely logged in.',
        sessionVersion: updatedUser.sessionVersion,
      });
    }

    return NextResponse.json({ error: 'Invalid session action' }, { status: 400 });
  } catch (error) {
    console.error('Session management error:', error);
    return NextResponse.json(
      { error: 'An error occurred while managing sessions' },
      { status: 500 }
    );
  }
}

