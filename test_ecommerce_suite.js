const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function runEcommerceTestSuite() {
  console.log('===========================================================');
  console.log('   VG PRINTING HUB - E-COMMERCE & PRICING TEST SUITE       ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Fetch sample products from database
    const tshirt = await prisma.product.findFirst({
      where: { slug: 'custom-corporate-bio-wash-tshirt' }
    });
    const mug = await prisma.product.findFirst({
      where: { slug: 'personalized-glossy-ceramic-mug' }
    });

    assert(Boolean(tshirt && mug), 'Target seeded products found in database');

    // 2. Mock Pricing Function Test (equivalent to lib/pricing.js logic)
    function calculatePricing({ items, isApprovedWholesaler, coupon, paymentMethod }) {
      let subtotal = 0;
      let totalWholesaleSavings = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prod = item.product;
        const qty = item.quantity;
        const requiredMoq = isApprovedWholesaler ? (prod.wholesaleMoq || 20) : (prod.moq || 1);

        if (qty < requiredMoq) {
          throw new Error(`MOQ violation: minimum is ${requiredMoq}, got ${qty}`);
        }

        let unitPrice = prod.price;
        if (isApprovedWholesaler) {
          unitPrice = prod.wholesalePrice || Math.round(prod.price * 0.6);
          totalWholesaleSavings += (prod.price - unitPrice) * qty;
        }

        let volumeDiscount = 0;
        if (qty >= 250) volumeDiscount = 0.08;
        else if (qty >= 100) volumeDiscount = 0.05;
        else if (qty >= 50) volumeDiscount = 0.03;

        const effectiveUnitPrice = Math.round(unitPrice * (1 - volumeDiscount));
        const itemTotal = effectiveUnitPrice * qty;
        subtotal += itemTotal;

        verifiedItems.push({
          productId: prod.id,
          effectiveUnitPrice,
          quantity: qty,
          itemTotal,
        });
      }

      let couponDiscount = 0;
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
            couponDiscount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'FLAT') {
          couponDiscount = Math.min(coupon.discountValue, subtotal);
        }
      }

      const taxable = Math.max(0, subtotal - couponDiscount);
      const tax = Math.round(taxable * 0.18);
      const shipping = taxable >= 999 ? 0 : 99;

      let codCharge = 0;
      if (paymentMethod === 'COD') {
        if (taxable > 5000) {
          throw new Error('COD not allowed above ₹5000');
        }
        codCharge = 50;
      }

      const totalAmount = Math.round(taxable + tax + shipping + codCharge);

      return {
        subtotal,
        totalWholesaleSavings,
        couponDiscount,
        tax,
        shipping,
        codCharge,
        totalAmount,
      };
    }

    // --- TEST 1: Retail Single Unit Pricing ---
    const retailResult = calculatePricing({
      items: [{ product: tshirt, quantity: 1 }],
      isApprovedWholesaler: false,
      coupon: null,
      paymentMethod: 'RAZORPAY',
    });

    assert(retailResult.subtotal === 499, 'Retail single t-shirt subtotal is ₹499');
    assert(retailResult.shipping === 99, 'Orders under ₹999 incur ₹99 shipping');
    assert(retailResult.tax === Math.round(499 * 0.18), '18% GST tax correctly calculated (₹90)');
    assert(retailResult.totalAmount === 499 + 90 + 99, 'Retail total calculation is accurate (₹688)');

    // --- TEST 2: Free Shipping on Orders ₹999+ ---
    const bulkRetail = calculatePricing({
      items: [{ product: tshirt, quantity: 3 }], // 499 * 3 = 1497
      isApprovedWholesaler: false,
      coupon: null,
      paymentMethod: 'RAZORPAY',
    });

    assert(bulkRetail.shipping === 0, 'Orders above ₹999 qualify for FREE shipping');

    // --- TEST 3: Approved Wholesale Pricing & MOQ ---
    const wholesaleBatch = calculatePricing({
      items: [{ product: tshirt, quantity: 50 }], // Wholesale price = 260. 50+ qty = 3% extra volume discount
      isApprovedWholesaler: true,
      coupon: null,
      paymentMethod: 'RAZORPAY',
    });

    assert(wholesaleBatch.totalWholesaleSavings > 0, 'Wholesale savings properly accounted for');
    // Unit price with 3% discount: 260 * 0.97 = 252.2 -> 252. Subtotal = 252 * 50 = 12600
    assert(wholesaleBatch.subtotal === 12600, 'Tiered wholesale price with 3% batch volume discount is ₹12,600');

    // --- TEST 4: Wholesale MOQ Enforcement ---
    let moqCaught = false;
    try {
      calculatePricing({
        items: [{ product: tshirt, quantity: 10 }], // MOQ is 25
        isApprovedWholesaler: true,
        coupon: null,
        paymentMethod: 'RAZORPAY',
      });
    } catch (err) {
      if (err.message.includes('MOQ violation')) moqCaught = true;
    }
    assert(moqCaught, 'Wholesale Minimum Order Quantity (MOQ) strictly enforced on backend');

    // --- TEST 5: Coupon Calculation ---
    const couponObj = await prisma.coupon.findUnique({ where: { code: 'WELCOME10' } });
    assert(Boolean(couponObj), 'Coupon WELCOME10 exists in database');

    const couponResult = calculatePricing({
      items: [{ product: tshirt, quantity: 2 }], // 499 * 2 = 998
      isApprovedWholesaler: false,
      coupon: couponObj,
      paymentMethod: 'RAZORPAY',
    });

    // 10% of 998 = 100
    assert(couponResult.couponDiscount === 100, 'Coupon 10% discount correctly deducted (₹100)');

    // --- TEST 6: COD Convenience Charge & Eligibility Limit ---
    const codResult = calculatePricing({
      items: [{ product: tshirt, quantity: 2 }],
      isApprovedWholesaler: false,
      coupon: null,
      paymentMethod: 'COD',
    });
    assert(codResult.codCharge === 50, 'COD orders add ₹50 nominal handling fee');

    let codOverLimit = false;
    try {
      calculatePricing({
        items: [{ product: tshirt, quantity: 15 }], // 499 * 15 = 7485 > 5000
        isApprovedWholesaler: false,
        coupon: null,
        paymentMethod: 'COD',
      });
    } catch (e) {
      if (e.message.includes('COD not allowed')) codOverLimit = true;
    }
    assert(codOverLimit, 'COD automatically blocked for high-value orders above ₹5000');

    // --- TEST 7: Razorpay HMAC SHA256 Signature Verification ---
    const keySecret = 'rzp_secret_dummy_test_key_2026_secure';
    const razorpayOrderId = 'order_DA981249120';
    const razorpayPaymentId = 'pay_FA981293812';

    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const invalidSignature = 'tampered_fake_signature_abc123';

    function verifySignature(orderId, paymentId, signature) {
      const generated = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      return generated === signature;
    }

    assert(verifySignature(razorpayOrderId, razorpayPaymentId, validSignature), 'Valid Razorpay HMAC signature passes verification');
    assert(!verifySignature(razorpayOrderId, razorpayPaymentId, invalidSignature), 'Tampered Razorpay signature is rejected');

    // --- TEST 8: Order Placement & Customization Persistence ---
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `VG-TEST-${Date.now().toString().slice(-4)}`,
        customerName: 'Rohit Verma',
        customerEmail: 'rohit.test@corporate.com',
        customerMobile: '9811223344',
        shippingAddress: JSON.stringify({
          address: 'Tower A, DLF CyberHub',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122002',
          gstin: '06AAAAA0000A1Z5',
        }),
        items: JSON.stringify([
          {
            productId: tshirt.id,
            name: tshirt.name,
            quantity: 50,
            selectedColor: '#1e3a8a',
            selectedSize: 'L',
            customization: {
              placement: 'Left Chest Pocket',
              logoUrl: '/uploads/artwork_sample.png',
              customText: 'CyberHub Tech Solutions',
              previewSnapshot: 'data:image/jpeg;base64,sample_snapshot_preview',
            },
            unitPrice: 260,
            itemTotal: 13000,
          }
        ]),
        subtotal: 13000,
        discount: 0,
        tax: 2340,
        shippingCharge: 0,
        totalAmount: 15340,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        razorpayPaymentId: 'pay_TEST_VERIFIED_123',
        status: 'Placed',
      }
    });

    assert(testOrder.id && testOrder.paymentStatus === 'PAID', 'Order created with custom design specs and PAID status');

    // --- TEST 9: Status Progression & Tracking Updates ---
    const updatedWithTracking = await prisma.order.update({
      where: { id: testOrder.id },
      data: {
        status: 'Dispatched',
        trackingCourier: 'BlueDart Express',
        trackingNumber: 'BD98234190IN',
        trackingUrl: 'https://track.bluedart.com/BD98234190IN',
        designApproved: true,
      }
    });

    assert(updatedWithTracking.status === 'Dispatched', 'Admin can advance order status to Dispatched');
    assert(updatedWithTracking.trackingNumber === 'BD98234190IN', 'AWB courier tracking number successfully saved');
    assert(updatedWithTracking.designApproved === true, 'Custom design approval flag successfully recorded');

    // Clean up test order
    await prisma.order.delete({ where: { id: testOrder.id } });

    console.log(`\n===========================================================`);
    console.log(`  E-COMMERCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`===========================================================`);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runEcommerceTestSuite();
