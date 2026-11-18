'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    updateQuantity,
    updateSizeBreakdown,
    removeItem,
    clearCart,
    quote,
    loadingQuote,
    quoteError,
    couponCode,
    couponData,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Custom design inspection modal
  const [activeDesignModal, setActiveDesignModal] = useState(null);

  // Size breakdown edit modal
  const [editingSizeItem, setEditingSizeItem] = useState(null);
  const [tempBreakdown, setTempBreakdown] = useState({});

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!inputCoupon.trim()) return;

    setApplyingCoupon(true);
    try {
      await applyCoupon(inputCoupon.trim());
      setInputCoupon('');
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const openSizeEditModal = (item) => {
    setEditingSizeItem(item);
    setTempBreakdown(item.sizeBreakdown ? { ...item.sizeBreakdown } : {});
  };

  const handleSaveSizeBreakdown = () => {
    if (!editingSizeItem) return;
    const moq = user?.role === 'WHOLESALER' && user?.approvalStatus === 'APPROVED'
      ? (editingSizeItem.wholesaleMoq || 20)
      : (editingSizeItem.moq || 1);

    const totalQty = Object.values(tempBreakdown).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
    if (totalQty < moq) {
      alert(`Minimum required order quantity is ${moq} units. Currently selected: ${totalQty}.`);
      return;
    }

    updateSizeBreakdown(editingSizeItem.id, tempBreakdown);
    setEditingSizeItem(null);
  };

  if (items.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyCard}>
          <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</span>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.75rem' }}>
            Looks like you haven&apos;t added any custom merchandise or corporate printing products yet.
          </p>
          <Link href="/products" className="btn btn-accent" style={{ padding: '12px 28px' }}>
            Browse Print Catalog &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <header style={styles.header}>
          <h1 style={styles.title}>Shopping Cart &amp; Order Review</h1>
          <button onClick={clearCart} style={styles.clearBtn}>
            Clear Cart
          </button>
        </header>

        {quoteError && (
          <div style={styles.errorAlert} role="alert">
            <span>⚠️</span>
            <span>{quoteError}</span>
          </div>
        )}

        <div style={styles.layout}>
          
          {/* Left Column: Cart Items List */}
          <div style={styles.itemsList}>
            {items.map((item) => {
              const moq = user?.role === 'WHOLESALER' && user?.approvalStatus === 'APPROVED'
                ? (item.wholesaleMoq || 20)
                : (item.moq || 1);

              const hasBreakdown = item.sizeBreakdown && Object.keys(item.sizeBreakdown).length > 0;
              const unitPriceToDisplay = item.unitPrice || item.price;

              return (
                <div key={item.id} style={styles.cartItemCard}>
                  {/* Thumbnail */}
                  <div style={styles.itemImageWrapper}>
                    <img
                      src={item.customization?.previewSnapshot || item.imageUrl || '/navlogo.png'}
                      alt={item.name}
                      style={styles.itemImage}
                    />
                    {item.customization && (
                      <span style={styles.customBadge}>Customized</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={styles.itemInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link href={`/products/${item.productId}`} style={styles.itemTitleLink}>
                        <h3 style={styles.itemName}>{item.name}</h3>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={styles.removeItemBtn}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Variant tags */}
                    <div style={styles.variantTags}>
                      {item.selectedColor && (
                        <span style={styles.tag}>
                          Color: 
                          <span
                            style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: item.selectedColor,
                              marginLeft: '6px',
                              verticalAlign: 'middle',
                              border: '1px solid #ccc',
                            }}
                          />
                        </span>
                      )}

                      {item.customization?.placement && (
                        <span style={styles.tag}>Zone: {item.customization.placement}</span>
                      )}

                      {item.appliedTier && (
                        <span style={{ ...styles.tag, backgroundColor: '#fff7ed', color: '#c2410c', fontWeight: '600' }}>
                          Tier: {item.appliedTier.minQty}{item.appliedTier.maxQty ? `-${item.appliedTier.maxQty}` : '+'} pcs
                        </span>
                      )}
                    </div>

                    {/* Size breakdown chips or standard size */}
                    {hasBreakdown ? (
                      <div style={styles.sizeBreakdownBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                            SIZE BREAKDOWN ({item.quantity} total pcs):
                          </span>
                          <button
                            type="button"
                            onClick={() => openSizeEditModal(item)}
                            style={styles.editSizesBtn}
                          >
                            ✏️ Edit Sizes
                          </button>
                        </div>
                        <div style={styles.breakdownChips}>
                          {Object.entries(item.sizeBreakdown)
                            .filter(([_, q]) => q > 0)
                            .map(([sz, q]) => (
                              <span key={sz} style={styles.breakdownChip}>
                                <strong>{sz}:</strong> {q}
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : item.selectedSize ? (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                        Size / Model: <strong>{item.selectedSize}</strong>
                      </div>
                    ) : null}

                    {/* Custom design inspection link */}
                    {item.customization && (
                      <div style={{ marginTop: '0.6rem' }}>
                        <button
                          type="button"
                          onClick={() => setActiveDesignModal(item)}
                          style={styles.viewDesignBtn}
                        >
                          👁️ View Custom Artwork &amp; Placement
                        </button>
                      </div>
                    )}

                    {/* Quantity & Unit Price */}
                    <div style={styles.quantityRow}>
                      {!hasBreakdown && (
                        <div style={styles.qtyPicker}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(moq, item.quantity - 1))}
                            style={styles.qtyBtn}
                            disabled={item.quantity <= moq}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={moq}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Math.max(moq, parseInt(e.target.value, 10) || moq))}
                            style={styles.qtyInput}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={styles.qtyBtn}
                          >
                            +
                          </button>
                        </div>
                      )}

                      <div style={styles.unitPriceText}>
                        <span>₹{unitPriceToDisplay} / unit</span>
                        {item.price > unitPriceToDisplay && (
                          <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#94a3b8', marginLeft: '6px' }}>
                            ₹{item.price}
                          </span>
                        )}
                        <span style={{ fontWeight: '700', marginLeft: '12px', color: 'var(--text-primary)' }}>
                          Total: ₹{(unitPriceToDisplay * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {item.quantity < moq && (
                      <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                        ⚠️ Minimum required quantity is {moq} units
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div style={styles.summaryColumn}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              {/* Coupon Box */}
              <div style={styles.couponSection}>
                {couponData ? (
                  <div style={styles.appliedCouponBox}>
                    <div>
                      <span style={{ fontWeight: '700', color: '#059669' }}>✓ {couponData.code} Applied</span>
                      <div style={{ fontSize: '0.75rem', color: '#065f46' }}>
                        {couponData.discountType === 'PERCENTAGE'
                          ? `${couponData.discountValue}% discount applied`
                          : `₹${couponData.discountValue} flat off`}
                      </div>
                    </div>
                    <button type="button" onClick={removeCoupon} style={styles.removeCouponBtn}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} style={styles.couponForm}>
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. WELCOME10)"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      style={styles.couponInput}
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon || !inputCoupon.trim()}
                      className="btn btn-outline"
                      style={styles.couponApplyBtn}
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    ⚠️ {couponError}
                  </p>
                )}
              </div>

              {/* Calculation Breakdown Rows */}
              <div style={styles.breakdownRows}>
                <div style={styles.row}>
                  <span style={styles.rowLabel}>Subtotal</span>
                  <span style={styles.rowValue}>
                    ₹{quote ? quote.subtotal.toLocaleString('en-IN') : items.reduce((sum, i) => sum + ((i.unitPrice || i.price) * i.quantity), 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {quote?.totalWholesaleSavings > 0 && (
                  <div style={styles.row}>
                    <span style={{ ...styles.rowLabel, color: '#059669', fontWeight: '600' }}>
                      Wholesale B2B Savings
                    </span>
                    <span style={{ ...styles.rowValue, color: '#059669', fontWeight: '600' }}>
                      -₹{quote.totalWholesaleSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {quote?.totalRetailTierSavings > 0 && (
                  <div style={styles.row}>
                    <span style={{ ...styles.rowLabel, color: '#059669', fontWeight: '600' }}>
                      Volume Tier Savings
                    </span>
                    <span style={{ ...styles.rowValue, color: '#059669', fontWeight: '600' }}>
                      -₹{quote.totalRetailTierSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {quote?.couponDiscount > 0 && (
                  <div style={styles.row}>
                    <span style={{ ...styles.rowLabel, color: '#059669', fontWeight: '600' }}>
                      Coupon Discount ({quote.appliedCoupon?.code})
                    </span>
                    <span style={{ ...styles.rowValue, color: '#059669', fontWeight: '600' }}>
                      -₹{quote.couponDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div style={styles.row}>
                  <span style={styles.rowLabel}>GST Tax (18% Standard)</span>
                  <span style={styles.rowValue}>
                    {loadingQuote ? '...' : `₹${(quote?.tax || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div style={styles.row}>
                  <span style={styles.rowLabel}>Estimated Shipping</span>
                  <span style={styles.rowValue}>
                    {quote?.shippingCharge === 0 ? (
                      <span style={{ color: '#059669', fontWeight: '600' }}>FREE</span>
                    ) : (
                      `₹${quote?.shippingCharge || 99}`
                    )}
                  </span>
                </div>

                <div style={{ ...styles.row, borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={styles.totalLabel}>Total Amount</span>
                  <span style={styles.totalValue}>
                    {loadingQuote ? '...' : `₹${(quote?.totalAmount || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="btn btn-accent"
                style={styles.checkoutBtn}
                disabled={loadingQuote || Boolean(quoteError)}
              >
                Proceed to Secure Checkout &rarr;
              </button>

              {/* Trust Badges */}
              <div style={styles.trustBadges}>
                <div style={styles.trustItem}>🔒 256-bit SSL Secure Checkout</div>
                <div style={styles.trustItem}>⚡ Razorpay Online &amp; COD Support</div>
                <div style={styles.trustItem}>📋 GST Invoicing with Input Credit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESIGN PREVIEW MODAL */}
      {activeDesignModal && (
        <div style={styles.modalOverlay} onClick={() => setActiveDesignModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Customized Artwork &amp; Placement</h3>
              <button
                type="button"
                onClick={() => setActiveDesignModal(null)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <img
                src={activeDesignModal.customization?.previewSnapshot || activeDesignModal.imageUrl}
                alt="Customized Artwork"
                style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div style={styles.designSpecs}>
              <div><strong>Product:</strong> {activeDesignModal.name}</div>
              <div><strong>Placement Zone:</strong> {activeDesignModal.customization?.placement}</div>
              {activeDesignModal.customization?.logoFileName && (
                <div>
                  <strong>Artwork File:</strong> {activeDesignModal.customization.logoFileName}{' '}
                  {activeDesignModal.customization?.logoUrl && (
                    <a
                      href={activeDesignModal.customization.logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-color)', marginLeft: '6px' }}
                    >
                      (Download / View)
                    </a>
                  )}
                </div>
              )}
              {activeDesignModal.customization?.customText && (
                <div><strong>Custom Imprint Text:</strong> &ldquo;{activeDesignModal.customization.customText}&rdquo; ({activeDesignModal.customization.textFont || 'Standard'})</div>
              )}
              {activeDesignModal.customization?.instructions && (
                <div><strong>Special Instructions:</strong> <em>{activeDesignModal.customization.instructions}</em></div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href={`/products/${activeDesignModal.productId}`}
                className="btn btn-outline"
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
              >
                ✏️ Re-customize on Product Page
              </Link>
              <button
                type="button"
                onClick={() => setActiveDesignModal(null)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIZE BREAKDOWN EDIT MODAL */}
      {editingSizeItem && (
        <div style={styles.modalOverlay} onClick={() => setEditingSizeItem(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Edit Size Quantities</h3>
              <button
                type="button"
                onClick={() => setEditingSizeItem(null)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Adjust quantity per size for <strong>{editingSizeItem.name}</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem' }}>
              {Object.keys(tempBreakdown).map((size) => (
                <div key={size} style={{ textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>{size}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setTempBreakdown(p => ({ ...p, [size]: Math.max(0, (p[size] || 0) - 1) }))}
                      style={{ width: '24px', height: '28px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={tempBreakdown[size] || 0}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setTempBreakdown(p => ({ ...p, [size]: val }));
                      }}
                      style={{ width: '36px', height: '28px', textAlign: 'center', border: '1px solid var(--border-color)', borderLeft: 'none', borderRight: 'none', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setTempBreakdown(p => ({ ...p, [size]: (p[size] || 0) + 1 }))}
                      style={{ width: '24px', height: '28px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px' }}>
              <span>New Total Quantity:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent-color)' }}>
                {Object.values(tempBreakdown).reduce((s, v) => s + (parseInt(v, 10) || 0), 0)} units
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setEditingSizeItem(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSizeBreakdown}
                className="btn btn-accent"
                style={{ flex: 1.5 }}
              >
                Save Quantities
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '3rem 0 5rem',
    backgroundColor: 'var(--bg-primary)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
  },
  clearBtn: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: '0.85rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '2.5rem',
    alignItems: 'start',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    flex: '1.8',
  },
  cartItemCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },
  itemImageWrapper: {
    position: 'relative',
    width: '110px',
    height: '110px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  customBadge: {
    position: 'absolute',
    bottom: '4px',
    left: '4px',
    right: '4px',
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: '700',
    textAlign: 'center',
    padding: '2px',
    borderRadius: '3px',
    backdropFilter: 'blur(2px)',
  },
  itemInfo: {
    flex: 1,
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
  },
  itemTitleLink: {
    color: 'inherit',
    textDecoration: 'none',
  },
  itemName: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
  },
  variantTags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.4rem',
  },
  tag: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  sizeBreakdownBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    marginTop: '0.35rem',
  },
  editSizesBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--accent-color)',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  breakdownChips: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  breakdownChip: {
    backgroundColor: 'white',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.75rem',
  },
  viewDesignBtn: {
    fontSize: '0.8rem',
    color: 'var(--accent-color)',
    fontWeight: '600',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginTop: '0.85rem',
    flexWrap: 'wrap',
  },
  qtyPicker: {
    display: 'flex',
    alignItems: 'center',
  },
  qtyBtn: {
    width: '30px',
    height: '30px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: '600',
  },
  qtyInput: {
    width: '42px',
    height: '30px',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  unitPriceText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  removeItemBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    opacity: 0.7,
  },
  summaryColumn: {
    flex: '1',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  summaryTitle: {
    fontSize: '1.25rem',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  couponSection: {
    marginBottom: '1.25rem',
  },
  couponForm: {
    display: 'flex',
    gap: '0.5rem',
  },
  couponInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    fontSize: '0.85rem',
  },
  couponApplyBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  appliedCouponBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
  },
  removeCouponBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  breakdownRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
  },
  rowLabel: {
    color: 'var(--text-secondary)',
  },
  rowValue: {
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  totalLabel: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  totalValue: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: 'var(--accent-color)',
  },
  checkoutBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1.05rem',
    fontWeight: '700',
  },
  trustBadges: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1rem',
  },
  trustItem: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  emptyContainer: {
    padding: '6rem 1rem',
    display: 'flex',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '3.5rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    maxWidth: '520px',
    width: '100%',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    backdropFilter: 'blur(3px)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '520px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  designSpecs: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
};
