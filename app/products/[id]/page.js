'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import ProductCustomizer from '@/components/ProductCustomizer';

// Helper for friendly color labels
const COLOR_NAMES = {
  '#ffffff': 'White',
  '#1a1a1a': 'Black',
  '#0f172a': 'Slate / Charcoal',
  '#1e3a8a': 'Navy Blue',
  '#1e40af': 'Royal Blue',
  '#991b1b': 'Crimson Red',
  '#dc2626': 'Classic Red',
  '#7f1d1d': 'Maroon',
  '#374151': 'Heather Grey',
  '#047857': 'Forest Green',
  '#15803d': 'Emerald Green',
  '#f3f4f6': 'Off White / Ash',
};

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [viewerInfo, setViewerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected options
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  
  // Size-wise quantity matrix state: { 'S': 2, 'M': 3, ... }
  const [sizeQuantities, setSizeQuantities] = useState({});
  // Fallback single quantity for products without sizes
  const [singleQuantity, setSingleQuantity] = useState(1);

  // Customization state
  const [customization, setCustomization] = useState(null);

  // Toast notification
  const [cartToast, setCartToast] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId, user]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${productId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      const p = data.product;
      setProduct(p);
      setViewerInfo(data.viewer);

      const isWholesale = Boolean(data.viewer?.isApprovedWholesaler);
      const minQty = isWholesale ? (p.wholesaleMoq || 20) : (p.moq || 1);

      // Colors
      const initialColor = p.colors && p.colors.length > 0 ? p.colors[0] : '#ffffff';
      setSelectedColor(initialColor);

      // Color-specific image or default
      const colorImg = p.parsedColorImages?.[initialColor] || p.imageUrl || (p.images && p.images[0]) || '/navlogo.png';
      setSelectedImage(colorImg);

      // Sizes setup
      if (p.sizes && p.sizes.length > 0) {
        const initialSizeMap = {};
        p.sizes.forEach((s, idx) => {
          // Put minQty on first size by default
          initialSizeMap[s] = idx === 0 ? minQty : 0;
        });
        setSizeQuantities(initialSizeMap);
        setSelectedSize(p.sizes[0]);
      } else {
        setSingleQuantity(minQty);
      }

    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const isApprovedWholesaler = Boolean(viewerInfo?.isApprovedWholesaler);
  const minRequiredQty = isApprovedWholesaler
    ? (product?.wholesaleMoq || 20)
    : (product?.moq || 1);

  const hasSizes = Boolean(product?.sizes && product.sizes.length > 0);

  // Calculate total quantity
  const totalQuantity = hasSizes
    ? Object.values(sizeQuantities).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0)
    : singleQuantity;

  // Quantity tier evaluation
  const tiers = product?.parsedPricingTiers || [];
  let calculatedUnitPrice = isApprovedWholesaler
    ? (product?.wholesalePrice || Math.round((product?.price || 0) * 0.6))
    : (product?.price || 0);

  let activeTier = null;
  if (tiers.length > 0) {
    const sortedTiers = [...tiers].sort((a, b) => (Number(a.minQty) || 0) - (Number(b.minQty) || 0));
    activeTier = sortedTiers.find((t) => {
      const min = Number(t.minQty) || 1;
      const max = t.maxQty != null ? Number(t.maxQty) : Infinity;
      return totalQuantity >= min && totalQuantity <= max;
    });

    if (!activeTier && sortedTiers.length > 0) {
      activeTier = sortedTiers[sortedTiers.length - 1];
    }

    if (activeTier) {
      if (isApprovedWholesaler) {
        calculatedUnitPrice = activeTier.wholesalePrice != null && Number(activeTier.wholesalePrice) > 0
          ? Number(activeTier.wholesalePrice)
          : (product?.wholesalePrice || Math.round(Number(activeTier.price) * 0.7));
      } else {
        calculatedUnitPrice = Number(activeTier.price) || product?.price;
      }
    }
  }

  // Financial calculations
  const subtotal = calculatedUnitPrice * totalQuantity;
  const originalSubtotal = (product?.price || 0) * totalQuantity;
  const totalSavings = Math.max(0, originalSubtotal - subtotal);
  const estimatedTax = Math.round(subtotal * 0.18);
  const estimatedTotal = subtotal + estimatedTax;

  // Handle color change
  const handleColorChange = (color) => {
    if (product.disabledColors?.includes(color)) return;
    setSelectedColor(color);

    // Dynamic image switching
    if (product.parsedColorImages && product.parsedColorImages[color]) {
      setSelectedImage(product.parsedColorImages[color]);
    }
  };

  // Handle size-wise quantity changes
  const handleSizeQtyChange = (size, value) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    setSizeQuantities((prev) => ({
      ...prev,
      [size]: parsed,
    }));
  };

  const handleSizeQtyStep = (size, delta) => {
    setSizeQuantities((prev) => {
      const current = prev[size] || 0;
      const nextVal = Math.max(0, current + delta);
      return {
        ...prev,
        [size]: nextVal,
      };
    });
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;

    if (totalQuantity < minRequiredQty) {
      alert(`Minimum order quantity for this item is ${minRequiredQty} unit(s). Currently selected: ${totalQuantity}.`);
      return;
    }

    // Build size description
    let sizeDescription = '';
    let sizeBreakdownToSave = null;
    if (hasSizes) {
      const selectedEntries = Object.entries(sizeQuantities).filter(([_, qty]) => qty > 0);
      if (selectedEntries.length === 0) {
        alert('Please specify quantities for at least one size.');
        return;
      }
      sizeDescription = selectedEntries.map(([s, q]) => `${s}: ${q}`).join(', ');
      sizeBreakdownToSave = sizeQuantities;
    } else {
      sizeDescription = selectedSize || 'Standard';
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      wholesalePrice: product.wholesalePrice || null,
      unitPrice: calculatedUnitPrice,
      imageUrl: selectedImage,
      selectedColor,
      selectedSize: sizeDescription,
      sizeBreakdown: sizeBreakdownToSave,
      quantity: totalQuantity,
      moq: product.moq || 1,
      wholesaleMoq: product.wholesaleMoq || 20,
      customization: customization?.hasCustomization ? customization : null,
      appliedTier: activeTier || null,
    };

    addItem(cartItem);
    setCartToast(true);
    setTimeout(() => setCartToast(false), 4500);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading product details &amp; pricing...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>The requested product does not exist.</p>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.imageUrl || '/navlogo.png'];

  const currentColorImage = product.parsedColorImages?.[selectedColor] || selectedImage;

  return (
    <div style={styles.page}>
      <div className="container">
        
        {/* Breadcrumbs */}
        <div style={styles.breadcrumbs}>
          <Link href="/">Home</Link> &gt; <Link href="/products">Products</Link> &gt;{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{product.name}</span>
        </div>

        {/* Main Grid: Gallery & Order Configuration */}
        <div style={styles.mainGrid}>
          
          {/* Gallery Column */}
          <div style={styles.galleryColumn}>
            <div style={styles.mainImageWrapper}>
              <img
                src={selectedImage}
                alt={product.name}
                style={styles.mainImage}
              />
              {product.badge && (
                <span style={styles.badgeTop}>{product.badge}</span>
              )}
              {selectedColor && (
                <span style={styles.colorPillTop}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: selectedColor,
                      border: '1px solid #fff',
                      display: 'inline-block',
                      marginRight: '6px',
                    }}
                  />
                  {COLOR_NAMES[selectedColor] || selectedColor}
                </span>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {allImages.length > 1 && (
              <div style={styles.thumbnailRow}>
                {allImages.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    style={{
                      ...styles.thumbBtn,
                      border: selectedImage === img ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    }}
                  >
                    <img src={img} alt={`Angle ${idx + 1}`} style={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Ordering */}
          <div style={styles.detailsColumn}>
            <div style={styles.categoryTag}>
              {product.category?.name || 'Custom Merchandise'}
            </div>
            
            <h1 style={styles.productTitle}>{product.name}</h1>

            {/* Rating & In Stock */}
            <div style={styles.ratingRow}>
              <span style={styles.ratingStars}>★★★★★</span>
              <span style={styles.ratingValue}>{product.rating || 4.8}</span>
              <span style={styles.ratingCount}>({product.ratingCount || 50} verified reviews)</span>
              <span style={styles.stockStatus}>● In Stock ({product.stock || 500} available)</span>
            </div>

            {/* 1. Dynamic Tier Pricing Table (PrintMine style) */}
            {tiers.length > 0 && (
              <div style={styles.tierTableCard}>
                <div style={styles.tierHeaderRow}>
                  <span style={styles.tierHeaderTitle}>⚡ Quantity-Based Volume Pricing</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {isApprovedWholesaler ? 'Wholesale Partner Tiers' : 'Volume Discount Tiers'}
                  </span>
                </div>
                
                <div style={styles.tierGrid}>
                  {tiers.map((t, idx) => {
                    const min = Number(t.minQty);
                    const max = t.maxQty != null ? Number(t.maxQty) : null;
                    const slabLabel = max ? `${min} - ${max} pcs` : `${min}+ pcs`;
                    const priceForSlab = isApprovedWholesaler && t.wholesalePrice ? t.wholesalePrice : t.price;
                    const isActive = totalQuantity >= min && (max == null || totalQuantity <= max);

                    return (
                      <div
                        key={idx}
                        style={{
                          ...styles.tierBox,
                          ...(isActive ? styles.tierBoxActive : {}),
                        }}
                      >
                        {isActive && <span style={styles.activeTierPill}>Active Tier</span>}
                        <div style={styles.tierSlab}>{slabLabel}</div>
                        <div style={styles.tierPrice}>₹{priceForSlab} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/ pc</span></div>
                        {product.price > priceForSlab && (
                          <div style={styles.tierSavings}>
                            Save {Math.round(((product.price - priceForSlab) / product.price) * 100)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Box */}
            <div style={styles.priceBox}>
              {isApprovedWholesaler ? (
                <div>
                  <div style={styles.wholesaleBadgeActive}>
                    ✓ Approved Wholesale Partner Pricing Active
                  </div>
                  <div style={styles.priceFlex}>
                    <span style={styles.wholesalePriceText}>₹{calculatedUnitPrice}</span>
                    <span style={styles.retailStrikethrough}>Retail: ₹{product.price}</span>
                    {totalSavings > 0 && (
                      <span style={styles.savingsPill}>
                        Save ₹{totalSavings} total
                      </span>
                    )}
                  </div>
                  <p style={styles.moqNote}>
                    Wholesale B2B Minimum Order: <strong>{minRequiredQty} units</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <div style={styles.priceFlex}>
                    <span style={styles.retailPriceText}>₹{calculatedUnitPrice}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ piece</span>
                    {totalSavings > 0 && (
                      <span style={styles.savingsPill}>
                        Saved ₹{totalSavings} (Volume Discount)
                      </span>
                    )}
                  </div>

                  {user?.role === 'WHOLESALER' && !isApprovedWholesaler && (
                    <div style={styles.wholesalePendingNotice}>
                      ⏳ Wholesale partner rates locked (Your business verification is pending).
                    </div>
                  )}

                  {!user && (
                    <div style={styles.wholesaleTeaser}>
                      <Link href="/signup" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>
                        Register for Wholesale B2B Partner Pricing &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={styles.descriptionText}>{product.description}</p>

            {/* 2. Color Selection with Dynamic Images */}
            {product.colors && product.colors.length > 0 && (
              <div style={styles.variantGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={styles.variantLabel}>
                    Select Color:{' '}
                    <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>
                      {COLOR_NAMES[selectedColor] || selectedColor}
                    </span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Swatches dynamically update preview photo
                  </span>
                </div>

                <div style={styles.colorSwatches}>
                  {product.colors.map((color) => {
                    const isDisabled = product.disabledColors?.includes(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        type="button"
                        key={color}
                        disabled={isDisabled}
                        onClick={() => handleColorChange(color)}
                        style={{
                          ...styles.colorDot,
                          backgroundColor: color,
                          boxShadow: isSelected ? '0 0 0 3px var(--accent-color)' : 'none',
                          opacity: isDisabled ? 0.35 : 1,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          position: 'relative',
                        }}
                        title={isDisabled ? `${COLOR_NAMES[color] || color} (Out of Stock)` : COLOR_NAMES[color] || color}
                      >
                        {isDisabled && (
                          <span style={styles.outOfStockSlash}>✕</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {product.disabledColors?.includes(selectedColor) && (
                  <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    ⚠️ This color is currently out of stock. Please select another shade.
                  </p>
                )}
              </div>
            )}

            {/* 3. Size-Wise Quantity Matrix (PrintMine.in style) */}
            {hasSizes ? (
              <div style={styles.variantGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={styles.variantLabel}>Size-Wise Quantity Selection</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    MOQ: <strong>{minRequiredQty} units</strong>
                  </span>
                </div>

                <div style={styles.sizeMatrixGrid}>
                  {product.sizes.map((size) => (
                    <div key={size} style={styles.sizeMatrixCard}>
                      <div style={styles.sizeMatrixHeader}>{size}</div>
                      <div style={styles.sizeMatrixControls}>
                        <button
                          type="button"
                          onClick={() => handleSizeQtyStep(size, -1)}
                          style={styles.matrixBtn}
                          disabled={(sizeQuantities[size] || 0) <= 0}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={sizeQuantities[size] || 0}
                          onChange={(e) => handleSizeQtyChange(size, e.target.value)}
                          style={styles.matrixInput}
                        />
                        <button
                          type="button"
                          onClick={() => handleSizeQtyStep(size, 1)}
                          style={styles.matrixBtn}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Quantity & MOQ Notice */}
                <div style={styles.matrixSummaryRow}>
                  <div>
                    <span>Total Quantity: </span>
                    <strong style={{ fontSize: '1.1rem', color: totalQuantity >= minRequiredQty ? '#059669' : '#dc2626' }}>
                      {totalQuantity} unit{totalQuantity === 1 ? '' : 's'}
                    </strong>
                    {totalQuantity < minRequiredQty && (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', marginLeft: '8px' }}>
                        (Requires at least {minRequiredQty} units — add {minRequiredQty - totalQuantity} more)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const reset = {};
                      product.sizes.forEach((s) => (reset[s] = 0));
                      setSizeQuantities(reset);
                    }}
                    style={styles.clearSizesBtn}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            ) : (
              /* Non-sized products (e.g. Mugs, Pens, Badges) standard quantity picker */
              <div style={styles.variantGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.variantLabel}>Order Quantity</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    MOQ: {minRequiredQty} unit(s)
                  </span>
                </div>

                <div style={styles.quantityPicker}>
                  <button
                    type="button"
                    onClick={() => setSingleQuantity(Math.max(minRequiredQty, singleQuantity - 1))}
                    style={styles.qtyBtn}
                    disabled={singleQuantity <= minRequiredQty}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={minRequiredQty}
                    value={singleQuantity}
                    onChange={(e) => setSingleQuantity(Math.max(minRequiredQty, parseInt(e.target.value, 10) || minRequiredQty))}
                    style={styles.qtyInput}
                  />
                  <button
                    type="button"
                    onClick={() => setSingleQuantity(singleQuantity + 1)}
                    style={styles.qtyBtn}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 4. Live Calculation & Price Summary Box */}
            <div style={styles.liveCalculationCard}>
              <div style={styles.calcRow}>
                <span>Selected Units:</span>
                <strong>{totalQuantity} pieces</strong>
              </div>
              <div style={styles.calcRow}>
                <span>Applied Tier Price:</span>
                <span>₹{calculatedUnitPrice} / piece</span>
              </div>
              <div style={styles.calcRow}>
                <span>Subtotal:</span>
                <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
              </div>
              {totalSavings > 0 && (
                <div style={{ ...styles.calcRow, color: '#059669' }}>
                  <span>Volume / Wholesale Savings:</span>
                  <strong>-₹{totalSavings.toLocaleString('en-IN')}</strong>
                </div>
              )}
              <div style={styles.calcRow}>
                <span>Estimated GST (18%):</span>
                <span>₹{estimatedTax.toLocaleString('en-IN')}</span>
              </div>
              <div style={styles.calcDivider} />
              <div style={styles.calcTotalRow}>
                <span>Estimated Total:</span>
                <span style={styles.calcTotalAmount}>₹{estimatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={totalQuantity < minRequiredQty}
                className="btn btn-accent"
                style={{
                  ...styles.addToCartBtn,
                  opacity: totalQuantity < minRequiredQty ? 0.6 : 1,
                  cursor: totalQuantity < minRequiredQty ? 'not-allowed' : 'pointer',
                }}
              >
                🛒 Add to Cart ({totalQuantity} units • ₹{subtotal.toLocaleString('en-IN')})
              </button>
            </div>
          </div>
        </div>

        {/* 5. Customization Studio Section */}
        {product.customizable && (
          <ProductCustomizer
            product={product}
            selectedColor={selectedColor}
            currentColorImage={currentColorImage}
            onCustomizationChange={(custom) => setCustomization(custom)}
            onDesignConfirmed={(confirmedDesign) => {
              setCustomization(confirmedDesign);
              handleAddToCart();
            }}
          />
        )}
      </div>

      {/* Toast Notification */}
      {cartToast && (
        <div style={styles.toast}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✓</span>
            <div>
              <strong>Added to Cart!</strong>
              <div style={{ fontSize: '0.8rem' }}>
                {product.name} ({totalQuantity} units @ ₹{calculatedUnitPrice}/pc)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => router.push('/cart')}
              className="btn btn-accent"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              Go to Cart &rarr;
            </button>
            <button
              onClick={() => setCartToast(false)}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 14px', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '2.5rem 0 5rem',
    backgroundColor: 'var(--bg-primary)',
  },
  breadcrumbs: {
    fontSize: '0.875rem',
    color: 'var(--text-tertiary)',
    marginBottom: '2rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3.5rem',
  },
  galleryColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  mainImageWrapper: {
    position: 'relative',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    aspectRatio: '1/1',
    boxShadow: 'var(--shadow-sm)',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badgeTop: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  colorPillTop: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
  },
  thumbnailRow: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
  },
  thumbBtn: {
    width: '76px',
    height: '76px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    padding: 0,
    cursor: 'pointer',
    backgroundColor: 'white',
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  detailsColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  categoryTag: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.35rem',
  },
  productTitle: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    lineHeight: 1.25,
    marginBottom: '0.5rem',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    flexWrap: 'wrap',
  },
  ratingStars: {
    color: '#f59e0b',
  },
  ratingValue: {
    fontWeight: '700',
  },
  ratingCount: {
    color: 'var(--text-tertiary)',
  },
  stockStatus: {
    color: '#059669',
    fontWeight: '600',
    marginLeft: '0.5rem',
  },
  tierTableCard: {
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    marginBottom: '1.25rem',
  },
  tierHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  tierHeaderTitle: {
    fontWeight: '700',
    fontSize: '0.875rem',
    color: '#9a3412',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: '0.5rem',
  },
  tierBox: {
    backgroundColor: 'white',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    padding: '0.6rem 0.4rem',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  tierBoxActive: {
    borderColor: 'var(--accent-color)',
    boxShadow: '0 0 0 2px var(--accent-color)',
    backgroundColor: '#fffaf5',
  },
  activeTierPill: {
    position: 'absolute',
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    fontSize: '0.6rem',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
  },
  tierSlab: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  tierPrice: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '2px',
  },
  tierSavings: {
    fontSize: '0.65rem',
    color: '#059669',
    fontWeight: '700',
    marginTop: '2px',
  },
  priceBox: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '1rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.25rem',
  },
  priceFlex: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
  },
  retailPriceText: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  wholesalePriceText: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#059669',
  },
  retailStrikethrough: {
    fontSize: '1rem',
    color: 'var(--text-tertiary)',
    textDecoration: 'line-through',
  },
  savingsPill: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '9999px',
  },
  wholesaleBadgeActive: {
    color: '#059669',
    fontSize: '0.75rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
  },
  moqNote: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  wholesalePendingNotice: {
    fontSize: '0.8rem',
    color: '#b45309',
    marginTop: '0.5rem',
  },
  wholesaleTeaser: {
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  descriptionText: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
  },
  variantGroup: {
    marginBottom: '1.25rem',
  },
  variantLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  colorSwatches: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #ccc',
    cursor: 'pointer',
    transition: 'transform var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockSlash: {
    color: '#dc2626',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  sizeMatrixGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))',
    gap: '0.5rem',
  },
  sizeMatrixCard: {
    backgroundColor: 'white',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0.5rem 0.35rem',
    textAlign: 'center',
  },
  sizeMatrixHeader: {
    fontWeight: '700',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
  },
  sizeMatrixControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixBtn: {
    width: '24px',
    height: '28px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.85rem',
    borderRadius: '3px',
  },
  matrixInput: {
    width: '34px',
    height: '28px',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '0.85rem',
    fontWeight: '600',
    padding: 0,
  },
  matrixSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.6rem',
    fontSize: '0.875rem',
  },
  clearSizesBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  quantityPicker: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  qtyBtn: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: '600',
  },
  qtyInput: {
    width: '60px',
    height: '40px',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '1rem',
    fontWeight: '600',
  },
  liveCalculationCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1rem',
    marginBottom: '1.25rem',
    fontSize: '0.85rem',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.35rem',
    color: 'var(--text-secondary)',
  },
  calcDivider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '0.5rem 0',
  },
  calcTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    alignItems: 'baseline',
  },
  calcTotalAmount: {
    fontSize: '1.25rem',
    color: 'var(--accent-color)',
  },
  actionRow: {
    marginTop: '0.5rem',
  },
  addToCartBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1.05rem',
    fontWeight: '700',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0f172a',
    color: 'white',
    padding: '1rem 1.25rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
};
