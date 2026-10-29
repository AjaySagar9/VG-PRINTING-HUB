import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateOrderPricing } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const {
      items,
      customerDetails,
      couponCode,
      paymentMethod = 'RAZORPAY',
    } = body;

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.mobile || !customerDetails.address) {
      return NextResponse.json(
        { error: 'Please provide complete delivery details: name, email, mobile, and shipping address' },
        { status: 400 }
      );
    }

    // 1. Calculate Authoritative Server Pricing
    const pricing = await calculateOrderPricing({
      items,
      couponCode,
      user,
      paymentMethod,
    });

    const orderNumber = `VG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 2. Razorpay Order Creation
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_vgprinting2026';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_dummy_test_key_2026_secure';

    let razorpayOrderId = null;

    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(pricing.totalAmount * 100), // in paise
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
        }
      });

      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn('Razorpay SDK order generation failed, generating simulated test order ID:', rzpErr.message);
      razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    }

    // 3. Create Pending Order in Database
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
        shippingCharge: pricing.shippingCharge,
        totalAmount: pricing.totalAmount,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        razorpayOrderId,
        status: 'Placed',
        customerNotes: customerDetails.notes?.trim() || '',
      }
    });

    return NextResponse.json({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      razorpayOrderId,
      amount: pricing.totalAmount,
      amountPaise: Math.round(pricing.totalAmount * 100),
      currency: 'INR',
      keyId,
      customerDetails: {
        name: newOrder.customerName,
        email: newOrder.customerEmail,
        mobile: newOrder.customerMobile,
      }
    });

  } catch (error) {
    console.error('Create checkout order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate order checkout' },
      { status: 400 }
    );
  }
}
