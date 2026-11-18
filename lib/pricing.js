import prisma from './prisma.js';

/**
 * Helper to compute tier unit price and matching tier info
 */
export function getProductTierPrice(product, quantity, isApprovedWholesaler = false) {
  let tiers = [];
  if (product.pricingTiers) {
    try {
      tiers = typeof product.pricingTiers === 'string'
        ? JSON.parse(product.pricingTiers)
        : product.pricingTiers;
    } catch (e) {
      console.warn('Failed to parse pricing tiers:', e);
    }
  }

  // If product has configured pricing tiers
  if (Array.isArray(tiers) && tiers.length > 0) {
    // Sort tiers by minQty ascending
    const sortedTiers = [...tiers].sort((a, b) => (Number(a.minQty) || 0) - (Number(b.minQty) || 0));

    // Find the tier bracket: minQty <= quantity <= maxQty (null or empty maxQty means Infinity)
    let matchedTier = sortedTiers.find((t) => {
      const min = Number(t.minQty) || 1;
      const max = t.maxQty != null && t.maxQty !== '' ? Number(t.maxQty) : Infinity;
      return quantity >= min && quantity <= max;
    });

    // If quantity exceeds top bracket, pick the highest tier
    if (!matchedTier) {
      matchedTier = sortedTiers[sortedTiers.length - 1];
    }

    if (matchedTier) {
      let unitPrice;
      if (isApprovedWholesaler) {
        if (matchedTier.wholesalePrice != null && Number(matchedTier.wholesalePrice) > 0) {
          unitPrice = Number(matchedTier.wholesalePrice);
        } else if (product.wholesalePrice) {
          unitPrice = Math.round(product.wholesalePrice * (Number(matchedTier.price) / product.price));
        } else {
          unitPrice = Math.round(Number(matchedTier.price) * 0.7);
        }
      } else {
        unitPrice = Number(matchedTier.price) || product.price;
      }

      return {
        unitPrice: Math.round(unitPrice),
        matchedTier,
        allTiers: sortedTiers,
        hasTiers: true,
      };
    }
  }

  // Fallback to standard price or wholesale price with bulk volume discount
  let baseUnitPrice = product.price;
  if (isApprovedWholesaler) {
    baseUnitPrice = product.wholesalePrice || Math.round(product.price * 0.6);
  }

  let volumeDiscountRate = 0;
  if (quantity >= 250) {
    volumeDiscountRate = 0.08;
  } else if (quantity >= 100) {
    volumeDiscountRate = 0.05;
  } else if (quantity >= 50) {
    volumeDiscountRate = 0.03;
  }

  const effectiveUnitPrice = Math.round(baseUnitPrice * (1 - volumeDiscountRate));
  return {
    unitPrice: effectiveUnitPrice,
    matchedTier: null,
    allTiers: [],
    hasTiers: false,
  };
}

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
  let totalRetailTierSavings = 0;
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

    // Support sizeBreakdown: { S: 2, M: 3, L: 5, XL: 2 }
    let quantity = parseInt(item.quantity, 10);
    let sizeBreakdown = item.sizeBreakdown || null;

    if (sizeBreakdown && typeof sizeBreakdown === 'object') {
      const sumFromBreakdown = Object.values(sizeBreakdown).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
      if (sumFromBreakdown > 0) {
        quantity = sumFromBreakdown;
      }
    }

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

    // Calculate unit price using dynamic tier calculation engine
    const { unitPrice, matchedTier, allTiers } = getProductTierPrice(product, quantity, isApprovedWholesaler);

    // Track retail tier savings or wholesale savings
    if (isApprovedWholesaler) {
      totalWholesaleSavings += Math.max(0, (product.price - unitPrice) * quantity);
    } else {
      totalRetailTierSavings += Math.max(0, (product.price - unitPrice) * quantity);
    }

    const itemTotal = unitPrice * quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      imageUrl: item.imageUrl || product.imageUrl,
      retailPrice: product.price,
      unitPrice,
      quantity,
      sizeBreakdown,
      selectedColor: item.selectedColor || null,
      selectedSize: item.selectedSize || null,
      customization: item.customization || null, // logo, placement, customText, instructions, snapshotUrl
      matchedTier,
      itemTotal,
      wholesaleApplied: isApprovedWholesaler,
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
    totalRetailTierSavings,
    taxableAmount,
    tax,
    shippingCharge,
    codCharge,
    totalAmount,
    isApprovedWholesaler,
  };
}
