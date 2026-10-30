import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Authorization check
    const isOwner = order.userId === user.id || (order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase());
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to modify this order.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reason } = body; // action: 'cancel' | 'return'

    // 1. CANCEL ORDER
    if (action === 'cancel') {
      if (order.status === 'Cancelled') {
        return NextResponse.json({ error: 'This order is already cancelled' }, { status: 400 });
      }

      // Business policy: Cancellation only allowed during 'Placed' or 'Design Approval'
      const cancellableStatuses = ['Placed', 'Design Approval'];
      if (!cancellableStatuses.includes(order.status) && !isAdmin) {
        return NextResponse.json(
          {
            error: `Order cannot be cancelled in '${order.status}' stage. Custom printing has already commenced. Please contact customer service at support@vgprintinghub.com for assistance.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: 'Cancelled',
          cancelReason: reason ? reason.trim() : 'Cancelled by customer',
          cancelledAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Order cancelled successfully. Any online payment will be refunded within 3-5 business days.',
        order: updated,
      });
    }

    // 2. RETURN / REPLACEMENT REQUEST
    if (action === 'return') {
      if (order.status !== 'Delivered') {
        return NextResponse.json(
          { error: 'Return or replacement requests can only be initiated for delivered orders.' },
          { status: 400 }
        );
      }

      if (order.returnStatus === 'REQUESTED') {
        return NextResponse.json(
          { error: 'A return or replacement request is already in review for this order.' },
          { status: 400 }
        );
      }

      if (order.returnStatus === 'APPROVED') {
        return NextResponse.json(
          { error: 'Return has already been approved for this order.' },
          { status: 400 }
        );
      }

      if (!reason || reason.trim().length < 5) {
        return NextResponse.json(
          { error: 'Please provide a reason or defect description for the return/replacement request (min 5 characters).' },
          { status: 400 }
        );
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          returnStatus: 'REQUESTED',
          returnReason: reason.trim(),
          returnedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Return / replacement request submitted! Our quality assessment team will inspect your print batch details and update you within 24 hours.',
        order: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid order action requested' }, { status: 400 });
  } catch (error) {
    console.error('Order action error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your order request' },
      { status: 500 }
    );
  }
}

