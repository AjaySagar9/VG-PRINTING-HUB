import { NextResponse } from 'next/server';
import { getCurrentUser, serializeUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: serializeUser(user),
      authenticated: true,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { user: null, authenticated: false, error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
