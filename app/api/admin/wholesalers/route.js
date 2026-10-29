import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, serializeUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    // Check if user is authenticated admin (or if no users exist yet)
    // To ensure admin features are usable, we verify admin role:
    if (!user || user.role !== 'ADMIN') {
      // Check if any admin exists in the system
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin privileges required.' },
          { status: 403 }
        );
      }
      // If no admin user exists in DB yet, allow viewing dashboard with setup hint
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'

    const where = {
      role: 'WHOLESALER',
    };

    if (statusFilter && statusFilter !== 'ALL') {
      where.approvalStatus = statusFilter;
    }

    const wholesalers = await prisma.user.findMany({
      where,
      orderBy: [
        { approvalStatus: 'asc' }, // PENDING appears near top
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        businessName: true,
        businessType: true,
        businessAddress: true,
        gstin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const stats = {
      totalWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER' } }),
      pendingWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'PENDING' } }),
      approvedWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'APPROVED' } }),
      rejectedWholesalers: await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'REJECTED' } }),
      totalRetailers: await prisma.user.count({ where: { role: 'RETAILER' } }),
    };

    return NextResponse.json({
      wholesalers,
      stats,
    });

  } catch (error) {
    console.error('Error in /api/admin/wholesalers GET:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wholesalers list' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();

    // Verify admin privileges
    if (!user || user.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        return NextResponse.json(
          { error: 'Unauthorized: Only administrators can modify approval status.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { userId, approvalStatus } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!['APPROVED', 'PENDING', 'REJECTED'].includes(approvalStatus)) {
      return NextResponse.json(
        { error: 'Invalid approval status. Must be APPROVED, PENDING, or REJECTED.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Wholesale user not found' }, { status: 404 });
    }

    if (targetUser.role !== 'WHOLESALER') {
      return NextResponse.json({ error: 'User is not a wholesale account' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus }
    });

    return NextResponse.json({
      message: `Wholesale status for ${updatedUser.businessName || updatedUser.name} updated to ${approvalStatus}`,
      user: serializeUser(updatedUser),
    });

  } catch (error) {
    console.error('Error updating wholesale approval status:', error);
    return NextResponse.json(
      { error: 'Failed to update approval status' },
      { status: 500 }
    );
  }
}
