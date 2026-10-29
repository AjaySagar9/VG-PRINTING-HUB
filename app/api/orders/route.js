import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // If user is authenticated, query by their userId or user email
    let where = {};
    if (user) {
      where = {
        OR: [
          { userId: user.id },
          { customerEmail: user.email }
        ]
      };
    } else if (email) {
      where = { customerEmail: email.trim().toLowerCase() };
    } else {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const parsedOrders = orders.map((o) => {
      let items = [];
      let shippingAddress = {};
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch (e) {
        items = [];
      }
      try {
        shippingAddress = typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress;
      } catch (e) {
        shippingAddress = {};
      }
      return {
        ...o,
        items,
        shippingAddress,
      };
    });

    return NextResponse.json({ orders: parsedOrders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
