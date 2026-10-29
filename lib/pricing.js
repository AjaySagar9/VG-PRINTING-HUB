import prisma from './prisma';

/**
 * Server-side order calculation engine
 * Never trusts prices or discounts submitted by client.
 */
export async function calculateOrderPricing({ items, couponCode, user, paymentMethod = 'RAZORPAY' }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty. Please add products to proceed.');
  }

  const isApprovedWholesaler = Boolean(
    user &&
    user.role === 'WHOLESALER' &&
    user.approvalStatus === 'APPROVED'
  );

  let subtotal = 0;
  let totalWholesaleSavings = 0;
  const verifiedItems = [];

  for (const item of items) {
    if (!item.productId) {
      throw new Error('Invalid product item in cart.');
    }

    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    if (!product) {
      throw new Error(`Product not found for item: ${item.name || item.productId}`);
    }

    const quantity = parseInt(item.quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    // Minimum Order Quantity (MOQ) enforcement
    const requiredMoq = isApprovedWholesaler ? (product.wholesaleMoq || 20) : (product.moq || 1);
    if (quantity < requiredMoq) {
      throw new Error(
        `Minimum order quantity for ${product.name} is ${requiredMoq} unit(s). Current: ${quantity}`
      );
    }

    // Determine unit price based on verified backend role
    let baseUnitPrice = product.price;
    let wholesaleApplied = false;

    if (isApprovedWholesaler) {
      baseUnitPrice = product.wholesalePrice || Math.round(product.price * 0.6);
      wholesaleApplied = true;
      totalWholesaleSavings += (product.price - baseUnitPrice) * quantity;
    }

    // Tiered bulk volume discount based on batch size
    let volumeDiscountRate = 0;
    if (quantity >= 250) {
      volumeDiscountRate = 0.08; // 8% extra volume discount
    } else if (quantity >= 100) {
      volumeDiscountRate = 0.05; // 5% extra volume discount
    } else if (quantity >= 50) {
      volumeDiscountRate = 0.03; // 3% extra volume discount
    }

    const effectiveUnitPrice = Math.round(baseUnitPrice * (1 - volumeDiscountRate));
    const itemTotal = effectiveUnitPrice * quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      retailPrice: product.price,
      unitPrice: effectiveUnitPrice,
      quantity,
      selectedColor: item.selectedColor || null,
      selectedSize: item.selectedSize || null,
      customization: item.customization || null, // logo, placement, customText, previewSnapshot
      itemTotal,
      wholesaleApplied,
    });
  }

  // Coupon evaluation
  let couponDiscount = 0;
  let appliedCoupon = null;

  if (couponCode && typeof couponCode === 'string') {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode }
    });

    if (coupon && coupon.isActive) {
      if (subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
            couponDiscount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'FLAT') {
          couponDiscount = Math.min(coupon.discountValue, subtotal);
        }
        appliedCoupon = {
          code: coupon.code,
          discountAmount: couponDiscount,
          type: coupon.discountType,
          value: coupon.discountValue,
        };
      }
    }
  }

  const taxableAmount = Math.max(0, subtotal - couponDiscount);

  // Standard 18% GST for corporate merchandise & printing
  const tax = Math.round(taxableAmount * 0.18);

  // Shipping calculation: Free above ₹999, else ₹99
  const shippingCharge = taxableAmount >= 999 ? 0 : 99;

  // COD charge if chosen
  let codCharge = 0;
  if (paymentMethod === 'COD') {
    if (taxableAmount > 5000) {
      throw new Error('Cash on Delivery (COD) is available only for orders up to ₹5,000. Please select Online Payment.');
    }
    codCharge = 50;
  }

  const totalAmount = Math.round(taxableAmount + tax + shippingCharge + codCharge);

  return {
    verifiedItems,
    subtotal,
    couponDiscount,
    appliedCoupon,
    totalWholesaleSavings,
    taxableAmount,
    tax,
    shippingCharge,
    codCharge,
    totalAmount,
    isApprovedWholesaler,
  };
}
