import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { calculateOrderPricing } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { items, couponCode, paymentMethod } = body;

    const calculation = await calculateOrderPricing({
      items,
      couponCode,
      user,
      paymentMethod,
    });

    return NextResponse.json(calculation);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to calculate cart pricing' },
      { status: 400 }
    );
  }
}
