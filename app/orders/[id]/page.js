'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function OrderDetailPage({ params }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const searchParams = useSearchParams();
  const isJustPlaced = searchParams.get('success') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Design preview modal
  const [viewArtworkUrl, setViewArtworkUrl] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading order details and tracking status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Unable to locate this order.</p>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          &larr; Return to Store
        </Link>
      </div>
    );
  }

  const steps = ['Placed', 'Design Approval', 'In Production', 'Dispatched', 'Delivered'];
  const currentStepIndex = steps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div style={styles.page}>
      <div className="container">
        
        {/* Navigation / Back link */}
        <div style={styles.topNav}>
          <Link href="/account" style={styles.backLink}>&larr; Back to Order History</Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
          >
            🖨️ Print Invoice
          </button>
        </div>

        {/* Celebratory Banner on Fresh Order */}
        {isJustPlaced && (
          <div style={styles.successBanner} role="status">
            <span style={{ fontSize: '2rem' }}>🎉</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>
                Order Confirmed Successfully!
              </h2>
              <p style={{ fontSize: '0.9rem', opacity: 0.95 }}>
                Thank you, <strong>{order.customerName}</strong>. Your order #{order.orderNumber || order.id.slice(-8)} has been received and logged into our printing pipeline.
                A confirmation has been dispatched to <strong>{order.customerEmail}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Order Header Summary */}
        <div style={styles.headerCard}>
          <div style={styles.headerFlex}>
            <div>
              <span style={styles.orderLabel}>CUSTOM PRINT ORDER</span>
              <h1 style={styles.orderTitle}>Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}</h1>
              <div style={styles.orderMeta}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div style={styles.headerRight}>
              <div style={styles.totalBadge}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Paid / Payable</span>
                <span style={styles.totalAmount}>₹{order.totalAmount}</span>
              </div>
              <div style={styles.paymentPill}>
                {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment (Razorpay)'}
                <span style={{
                  marginLeft: '8px',
                  fontWeight: '700',
                  color: order.paymentStatus === 'PAID' ? '#059669' : '#d97706',
                }}>
                  [{order.paymentStatus}]
                </span>
              </div>
            </div>
          </div>

          {/* 5-Stage Visual Tracking Pipeline */}
          <div style={styles.pipelineContainer}>
            <div style={styles.pipelineTitle}>Current Fulfillment Status</div>
            
            {isCancelled ? (
              <div style={styles.cancelledBanner}>
                ⚠️ This order was cancelled. Please contact support if you need assistance.
              </div>
            ) : (
              <div style={styles.progressTrack}>
                {steps.map((st, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={st} style={styles.stepItem}>
                      <div style={{
                        ...styles.stepCircle,
                        backgroundColor: isCompleted ? '#ff4e00' : '#e2e8f0',
                        color: isCompleted ? 'white' : '#64748b',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(255, 78, 0, 0.2)' : 'none',
                      }}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span style={{
                        ...styles.stepLabel,
                        fontWeight: isCurrent ? '700' : '500',
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}>
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Shipment Tracking Card (if tracking info present) */}
        {order.trackingNumber && (
          <div style={styles.trackingCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🚚</span>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#1e40af', marginBottom: '2px' }}>
                  Shipment Dispatched via {order.trackingCourier || 'Standard Logistics Partner'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>
                  Waybill / AWB Number: <strong>{order.trackingNumber}</strong>
                </div>
              </div>
            </div>

            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Track Live on Courier Portal &rarr;
              </a>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>Tracking updates every 12 hours</span>
            )}
          </div>
        )}

        {/* Main Content: Items and Shipping Details */}
        <div style={styles.contentGrid}>
          
          {/* Left: Ordered Items with Custom Imprints */}
          <div style={styles.itemsColumn}>
            <h2 style={styles.sectionHeading}>Custom Ordered Merchandise ({order.items?.length || 0} items)</h2>

            <div style={styles.itemsList}>
              {order.items && order.items.map((it, idx) => (
                <div key={idx} style={styles.itemCard}>
                  <img
                    src={it.customization?.previewSnapshot || it.imageUrl || '/navlogo.png'}
                    alt={it.name}
                    style={styles.itemImg}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.itemHeading}>{it.name}</h3>

                    <div style={styles.metaRow}>
                      {it.selectedSize && <span style={styles.chip}>Size: {it.selectedSize}</span>}
                      {it.selectedColor && (
                        <span style={styles.chip}>
                          Color: 
                          <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: it.selectedColor,
                            marginLeft: '4px',
                            verticalAlign: 'middle',
                            border: '1px solid #ccc'
                          }} />
                        </span>
                      )}
                      {it.customization?.placement && (
                        <span style={styles.chip}>Zone: {it.customization.placement}</span>
                      )}
                    </div>

                    {it.customization && (
                      <div style={styles.customBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            🎨 Custom Print Specifications
                          </span>
                          {it.customization.previewSnapshot && (
                            <button
                              type="button"
                              onClick={() => setViewArtworkUrl(it.customization.previewSnapshot)}
                              style={styles.artworkPreviewBtn}
                            >
                              🔍 View Imprint Design
                            </button>
                          )}
                        </div>
                        {it.customization.logoFileName && (
                          <div style={{ marginTop: '4px' }}>Artwork: {it.customization.logoFileName}</div>
                        )}
                        {it.customization.customText && (
                          <div>Text: &ldquo;{it.customization.customText}&rdquo; ({it.customization.textFont || 'Standard'})</div>
                        )}
                      </div>
                    )}

                    <div style={styles.itemPriceRow}>
                      <span>₹{it.unitPrice} &times; {it.quantity} units</span>
                      <span style={styles.itemTotalAmount}>₹{it.unitPrice * it.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Shipping Address & Invoice Breakdown */}
          <div style={styles.infoColumn}>
            
            {/* Delivery Address Card */}
            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Delivery Address</h3>
              <div style={styles.addressBox}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {order.customerName}
                </div>
                <div>{order.shippingAddress?.address}</div>
                <div>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </div>
                <div style={{ marginTop: '6px' }}>📞 +91 {order.customerMobile}</div>
                <div>📧 {order.customerEmail}</div>
                {order.shippingAddress?.gstin && (
                  <div style={styles.gstinTag}>
                    🏛️ GSTIN: {order.shippingAddress.gstin}
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown Card */}
            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Payment &amp; Tax Invoice</h3>

              <div style={styles.calcRows}>
                <div style={styles.calcRow}>
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>

                {order.discount > 0 && (
                  <div style={styles.calcRow}>
                    <span style={{ color: '#059669', fontWeight: '600' }}>Promotional Discount</span>
                    <span style={{ color: '#059669', fontWeight: '600' }}>-₹{order.discount}</span>
                  </div>
                )}

                <div style={styles.calcRow}>
                  <span>GST Tax (18%)</span>
                  <span>₹{order.tax}</span>
                </div>

                <div style={styles.calcRow}>
                  <span>Shipping &amp; Logistics</span>
                  <span>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span>
                </div>

                <div style={styles.totalRow}>
                  <span>Grand Total</span>
                  <span style={styles.grandTotal}>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Support Note */}
            <div style={styles.supportBox}>
              <span style={{ fontSize: '1.25rem' }}>💬</span>
              <div>
                <strong>Need help with your print order?</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Our production support desk is available at <Link href="/contact" style={{ color: 'var(--accent-color)' }}>support@vgprintinghub.com</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESIGN ARTWORK MODAL */}
      {viewArtworkUrl && (
        <div style={styles.modalOverlay} onClick={() => setViewArtworkUrl(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Approved Custom Design Snapshot</h3>
              <button
                type="button"
                onClick={() => setViewArtworkUrl(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: 'center', backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <img
                src={viewArtworkUrl}
                alt="Approved Artwork"
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setViewArtworkUrl(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Close
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
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  backLink: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    marginBottom: '2rem',
    boxShadow: 'var(--shadow-sm)',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '2rem',
  },
  headerFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.5rem',
  },
  orderLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--accent-color)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  orderTitle: {
    fontSize: '1.75rem',
    color: 'var(--text-primary)',
    margin: '0.2rem 0',
  },
  orderMeta: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.5rem',
  },
  totalBadge: {
    textAlign: 'right',
  },
  totalAmount: {
    display: 'block',
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  paymentPill: {
    fontSize: '0.8rem',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    color: 'var(--text-secondary)',
  },
  pipelineContainer: {
    paddingTop: '1.5rem',
  },
  pipelineTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '1.25rem',
  },
  progressTrack: {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: '80px',
  },
  stepCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  stepLabel: {
    fontSize: '0.8rem',
    lineHeight: 1.2,
  },
  cancelledBanner: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
  },
  trackingCard: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '2.5rem',
    alignItems: 'start',
  },
  itemsColumn: {
    flex: '1.8',
  },
  sectionHeading: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
    color: 'var(--text-primary)',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    display: 'flex',
    gap: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
    flexWrap: 'wrap',
  },
  itemImg: {
    width: '90px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-tertiary)',
    flexShrink: 0,
  },
  itemHeading: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  metaRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  chip: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  customBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
  },
  artworkPreviewBtn: {
    fontSize: '0.75rem',
    color: 'var(--accent-color)',
    fontWeight: '600',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  itemPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '0.5rem',
  },
  itemTotalAmount: {
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  infoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: '1.2',
  },
  sideCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '1.75rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  sideTitle: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  addressBox: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  gstinTag: {
    marginTop: '0.5rem',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'inline-block',
  },
  calcRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '2px solid var(--border-color)',
    paddingTop: '0.75rem',
    marginTop: '0.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  grandTotal: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--accent-color)',
  },
  supportBox: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    border: '1px solid var(--border-color)',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
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
    gap: '1rem',
  }
};
