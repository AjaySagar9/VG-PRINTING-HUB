'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import ProductCustomizer from '@/components/ProductCustomizer';

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
  const [quantity, setQuantity] = useState(1);

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

      setSelectedImage(p.imageUrl || (p.images && p.images[0]) || '/navlogo.png');
      setSelectedColor(p.colors && p.colors.length > 0 ? p.colors[0] : '#ffffff');
      setSelectedSize(p.sizes && p.sizes.length > 0 ? p.sizes[0] : '');

      const isWholesale = Boolean(data.viewer?.isApprovedWholesaler);
      const minQty = isWholesale ? (p.wholesaleMoq || 20) : (p.moq || 1);
      setQuantity(minQty);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const isApprovedWholesaler = Boolean(viewerInfo?.isApprovedWholesaler);
  const minRequiredQty = isApprovedWholesaler
    ? (product?.wholesaleMoq || 20)
    : (product?.moq || 1);

  const handleAddToCart = () => {
    if (!product) return;

    if (quantity < minRequiredQty) {
      alert(`Minimum order quantity for this item is ${minRequiredQty} unit(s).`);
      return;
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      wholesalePrice: product.wholesalePrice || null,
      imageUrl: selectedImage,
      selectedColor,
      selectedSize,
      quantity,
      moq: product.moq || 1,
      wholesaleMoq: product.wholesaleMoq || 20,
      customization: customization?.hasCustomization ? customization : null,
    };

    addItem(cartItem);
    setCartToast(true);
    setTimeout(() => setCartToast(false), 4500);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading product details...</p>
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

  const displayPrice = isApprovedWholesaler && product.wholesalePrice
    ? product.wholesalePrice
    : product.price;

  return (
    <div style={styles.page}>
      <div className="container">
        
        {/* Breadcrumbs */}
        <div style={styles.breadcrumbs}>
          <Link href="/">Home</Link> &gt; <Link href="/products">Products</Link> &gt;{' '}
          <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
        </div>

        {/* Main Grid: Gallery & Details */}
        <div style={styles.mainGrid}>
          
          {/* Gallery */}
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
            </div>

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

            {/* Ratings & Stock */}
            <div style={styles.ratingRow}>
              <span style={styles.ratingStars}>★★★★★</span>
              <span style={styles.ratingValue}>{product.rating || 4.8}</span>
              <span style={styles.ratingCount}>({product.ratingCount || 50} verified reviews)</span>
              <span style={styles.stockStatus}>● In Stock</span>
            </div>

            {/* Price Box */}
            <div style={styles.priceBox}>
              {isApprovedWholesaler && product.wholesalePrice ? (
                <div>
                  <div style={styles.wholesaleBadgeActive}>
                    ✓ Approved Wholesale Pricing Active
                  </div>
                  <div style={styles.priceFlex}>
                    <span style={styles.wholesalePriceText}>₹{product.wholesalePrice}</span>
                    <span style={styles.retailStrikethrough}>Retail: ₹{product.price}</span>
                    <span style={styles.savingsPill}>
                      Save {Math.round(((product.price - product.wholesalePrice) / product.price) * 100)}%
                    </span>
                  </div>
                  <p style={styles.moqNote}>
                    Wholesale B2B Minimum: <strong>{product.wholesaleMoq || 20} units</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <div style={styles.priceFlex}>
                    <span style={styles.retailPriceText}>₹{product.price}</span>
                    {product.discountPercent > 0 && (
                      <span style={styles.savingsPill}>-{product.discountPercent}% OFF</span>
                    )}
                  </div>

                  {user?.role === 'WHOLESALER' && !isApprovedWholesaler && (
                    <div style={styles.wholesalePendingNotice}>
                      ⏳ Wholesale rates locked (Your business account is pending admin verification).
                    </div>
                  )}

                  {!user && (
                    <div style={styles.wholesaleTeaser}>
                      <Link href="/signup" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>
                        Register for Wholesale Partner Pricing &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={styles.descriptionText}>{product.description}</p>

            {/* Variant 1: Available Colors */}
            {product.colors && product.colors.length > 0 && (
              <div style={styles.variantGroup}>
                <label style={styles.variantLabel}>
                  Select Color: <span style={{ fontWeight: 'normal' }}>{selectedColor}</span>
                </label>
                <div style={styles.colorSwatches}>
                  {product.colors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        ...styles.colorDot,
                        backgroundColor: color,
                        boxShadow: selectedColor === color ? '0 0 0 3px var(--accent-color)' : 'none',
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Variant 2: Available Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div style={styles.variantGroup}>
                <label style={styles.variantLabel}>Select Size / Model</label>
                <div style={styles.sizeChips}>
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        ...styles.sizeChip,
                        ...(selectedSize === size ? styles.sizeChipActive : styles.sizeChipInactive)
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
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
                  onClick={() => setQuantity(Math.max(minRequiredQty, quantity - 1))}
                  style={styles.qtyBtn}
                  disabled={quantity <= minRequiredQty}
                >
                  -
                </button>
                <input
                  type="number"
                  min={minRequiredQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(minRequiredQty, parseInt(e.target.value) || minRequiredQty))}
                  style={styles.qtyInput}
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  style={styles.qtyBtn}
                >
                  +
                </button>
                <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Estimated item total: <strong>₹{displayPrice * quantity}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn btn-accent"
                style={styles.addToCartBtn}
              >
                🛒 Add to Cart ({quantity} units)
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOMIZATION STUDIO SECTION */}
        {product.customizable && (
          <ProductCustomizer
            product={product}
            selectedColor={selectedColor}
            onCustomizationChange={(custom) => setCustomization(custom)}
            onDesignConfirmed={(confirmedDesign) => {
              setCustomization(confirmedDesign);
              handleAddToCart();
            }}
          />
        )}
      </div>

      {/* TOAST NOTIFICATION ON ADD TO CART */}
      {cartToast && (
        <div style={styles.toast}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✓</span>
            <div>
              <strong>Added to Cart!</strong>
              <div style={{ fontSize: '0.8rem' }}>{product.name} ({quantity} units)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Link href="/cart" className="btn btn-accent" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              View Cart &amp; Checkout &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '2.5rem 0 5rem',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  breadcrumbs: {
    fontSize: '0.875rem',
    color: 'var(--text-tertiary)',
    marginBottom: '1.5rem',
    display: 'flex',
    gap: '0.5rem',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '3rem',
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  galleryColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  mainImageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1/1',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
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
  thumbnailRow: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
  },
  thumbBtn: {
    width: '72px',
    height: '72px',
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
    marginBottom: '1.25rem',
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
  priceBox: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
  },
  priceFlex: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
  },
  retailPriceText: {
    fontSize: '2.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  wholesalePriceText: {
    fontSize: '2.25rem',
    fontWeight: '800',
    color: '#059669',
  },
  retailStrikethrough: {
    fontSize: '1.1rem',
    color: 'var(--text-tertiary)',
    textDecoration: 'line-through',
  },
  savingsPill: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  wholesaleBadgeActive: {
    color: '#059669',
    fontSize: '0.8rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
  },
  moqNote: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.35rem',
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
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
  },
  variantGroup: {
    marginBottom: '1.25rem',
  },
  variantLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  colorSwatches: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #ccc',
    cursor: 'pointer',
    transition: 'transform var(--transition-fast)',
  },
  sizeChips: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  sizeChip: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  sizeChipActive: {
    backgroundColor: 'var(--text-primary)',
    color: 'white',
    border: '1px solid var(--text-primary)',
  },
  sizeChipInactive: {
    backgroundColor: 'white',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  quantityPicker: {
    display: 'flex',
    alignItems: 'center',
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
  actionRow: {
    marginTop: '1.5rem',
  },
  addToCartBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem',
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
    animation: 'fadeIn 0.3s ease',
  }
};
