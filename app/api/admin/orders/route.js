import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    // Verify admin
    if (!user || user.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
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
      } catch {
        items = [];
      }
      try {
        shippingAddress = typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress;
      } catch {
        shippingAddress = {};
      }
      return {
        ...o,
        items,
        shippingAddress,
      };
    });

    const stats = {
      totalOrders: await prisma.order.count(),
      placed: await prisma.order.count({ where: { status: 'Placed' } }),
      designApproval: await prisma.order.count({ where: { status: 'Design Approval' } }),
      inProduction: await prisma.order.count({ where: { status: 'In Production' } }),
      dispatched: await prisma.order.count({ where: { status: 'Dispatched' } }),
      delivered: await prisma.order.count({ where: { status: 'Delivered' } }),
    };

    return NextResponse.json({
      orders: parsedOrders,
      stats,
    });

  } catch (error) {
    console.error('Admin fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin orders' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      orderId,
      status,
      trackingCourier,
      trackingNumber,
      trackingUrl,
      designApproved,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (trackingCourier !== undefined) updateData.trackingCourier = trackingCourier?.trim();
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber?.trim();
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl?.trim();
    if (designApproved !== undefined) updateData.designApproved = Boolean(designApproved);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    console.log(`[ADMIN] Order #${updated.orderNumber} updated: status=${updated.status}, tracking=${updated.trackingNumber}`);

    return NextResponse.json({
      success: true,
      message: `Order #${updated.orderNumber} updated successfully`,
      order: updated,
    });

  } catch (error) {
    console.error('Admin update order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
