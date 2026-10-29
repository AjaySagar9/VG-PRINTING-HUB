import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Permission check: allow order owner or admin, or public with order ID
    let items = [];
    let shippingAddress = {};
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch {
      items = [];
    }
    try {
      shippingAddress = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
    } catch {
      shippingAddress = {};
    }

    return NextResponse.json({
      order: {
        ...order,
        items,
        shippingAddress,
      }
    });

  } catch (error) {
    console.error('Fetch single order error:', error);
    return NextResponse.json(
      { error: 'Failed to load order details' },
      { status: 500 }
    );
  }
}
