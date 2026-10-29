import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateOrderPricing } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { items, customerDetails, couponCode } = body;

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.mobile || !customerDetails.address) {
      return NextResponse.json(
        { error: 'Please provide complete delivery details: name, email, mobile, and shipping address' },
        { status: 400 }
      );
    }

    // Calculate server pricing with COD rules
    const pricing = await calculateOrderPricing({
      items,
      couponCode,
      user,
      paymentMethod: 'COD',
    });

    const orderNumber = `VG-COD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: user ? user.id : null,
        customerName: customerDetails.name.trim(),
        customerEmail: customerDetails.email.trim().toLowerCase(),
        customerMobile: customerDetails.mobile.trim(),
        shippingAddress: JSON.stringify({
          address: customerDetails.address.trim(),
          city: customerDetails.city?.trim() || '',
          state: customerDetails.state?.trim() || '',
          pincode: customerDetails.pincode?.trim() || '',
          gstin: customerDetails.gstin?.trim() || '',
        }),
        items: JSON.stringify(pricing.verifiedItems),
        subtotal: pricing.subtotal,
        discount: pricing.couponDiscount,
        tax: pricing.tax,
        shippingCharge: pricing.shippingCharge + pricing.codCharge,
        totalAmount: pricing.totalAmount,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        status: 'Placed',
        customerNotes: customerDetails.notes?.trim() || '',
      }
    });

    console.log(`[COD ORDER PLACED] Order ${newOrder.orderNumber} placed by ${newOrder.customerName} for ₹${newOrder.totalAmount}`);

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      message: 'Cash on Delivery order placed successfully!',
    });

  } catch (error) {
    console.error('COD checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to place COD order' },
      { status: 400 }
    );
  }
}
