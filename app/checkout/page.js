'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, quote, couponCode, clearCart } = useCart();

  // Customer & Shipping details form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY'); // 'RAZORPAY' | 'COD'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Prefill details if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.businessName || user.name || prev.name,
        email: user.email || prev.email,
        mobile: user.mobile || prev.mobile,
        address: user.businessAddress || prev.address,
        gstin: user.gstin || prev.gstin,
      }));

      fetch('/api/user/addresses')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.addresses && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const def = data.addresses.find((a) => a.isDefaultDelivery) || data.addresses[0];
            if (def) {
              setFormData((prev) => ({
                ...prev,
                name: def.name || prev.name,
                mobile: def.phone || prev.mobile,
                address: def.street || prev.address,
                city: def.city || prev.city,
                state: def.state || prev.state,
                pincode: def.pincode || prev.pincode,
              }));
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  // Dynamically load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!formData.name.trim()) {
      setErrorMessage('Please enter recipient full name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Please enter complete delivery address');
      return;
    }
    if (!formData.city.trim() || !formData.pincode.trim()) {
      setErrorMessage('Please enter city and 6-digit postal PIN code');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'COD') {
        // --- CASH ON DELIVERY FLOW ---
        const res = await fetch('/api/checkout/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            customerDetails: formData,
            couponCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to place COD order');
        }

        clearCart();
        router.push(`/orders/${data.orderId}?success=true&method=cod`);

      } else {
        // --- RAZORPAY PAYMENT FLOW ---
        const orderRes = await fetch('/api/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            customerDetails: formData,
            couponCode,
            paymentMethod: 'RAZORPAY',
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to initiate Razorpay checkout');
        }

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          throw new Error('Unable to load Razorpay payment gateway. Please check your internet connection.');
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency || 'INR',
          name: 'VG Printing Hub',
          description: `Custom Print Order #${orderData.orderNumber}`,
          image: '/navlogo.png',
          order_id: orderData.razorpayOrderId.startsWith('order_') && !orderData.razorpayOrderId.includes('test')
            ? orderData.razorpayOrderId
            : undefined,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.mobile,
          },
          theme: {
            color: '#ff4e00',
          },
          handler: async function (response) {
            try {
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  razorpayOrderId: response.razorpay_order_id || orderData.razorpayOrderId,
                  razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpaySignature: response.razorpay_signature || 'simulated_test_signature',
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }

              clearCart();
              router.push(`/orders/${orderData.orderId}?success=true&method=online`);
            } catch (vErr) {
              setErrorMessage(`Verification error: ${vErr.message}`);
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setErrorMessage('Payment cancelled or window closed. You can retry anytime.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setLoading(false);
          setErrorMessage(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
      }

    } catch (err) {
      setErrorMessage(err.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const isCodEligible = (quote?.totalAmount || 0) <= 5000;

  return (
    <div style={styles.page}>
      <div className="container">
        
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <Link href="/cart">&larr; Return to Shopping Cart</Link>
        </div>

        <header style={styles.header}>
          <h1 style={styles.title}>Secure Checkout</h1>
          <p style={styles.subtitle}>Enter delivery address and choose your payment method</p>
        </header>

        {errorMessage && (
          <div style={styles.errorAlert} role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={styles.layout}>
          
          {/* Left Column: Delivery & Payment Details */}
          <div style={styles.leftColumn}>
            
            {/* 1. Contact Information */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>1. Contact Information</h2>
              <div style={styles.grid2}>
                <div className="input-group">
                  <label className="input-label" htmlFor="name">Full Name / Company Representative *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="mobile">10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="email">Email Address (Order Confirmation &amp; Tracking) *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="name@business.com"
                  required
                />
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>2. Shipping &amp; Delivery Address</h2>

              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    SELECT FROM SAVED ADDRESSES:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {savedAddresses.map((sa) => {
                      const isSelected = formData.address === sa.street && formData.pincode === sa.pincode;
                      return (
                        <button
                          key={sa.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              name: sa.name || prev.name,
                              mobile: sa.phone || prev.mobile,
                              address: sa.street,
                              city: sa.city,
                              state: sa.state,
                              pincode: sa.pincode,
                            }));
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? '#fff7ed' : 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <strong>{sa.name}</strong> ({sa.city} - {sa.pincode})
                          {sa.isDefaultDelivery && <span style={{ marginLeft: '4px', color: '#059669', fontSize: '0.7rem' }}>✓ Default</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="address">Street Address, Building, Floor *</label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Plot No. 12, Cyber Gateway, Sector 21"
                  required
                />
              </div>

              <div style={styles.grid3}>
                <div className="input-group">
                  <label className="input-label" htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Gurugram"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Haryana"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="pincode">PIN Code *</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="122001"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="gstin">
                  GSTIN <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional for B2B Tax Invoice &amp; Input Credit)</span>
                </label>
                <input
                  type="text"
                  id="gstin"
                  name="gstin"
                  value={formData.gstin}
                  onChange={(e) => setFormData((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                  className="input-field"
                  placeholder="06AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="notes">
                  Order Instructions &amp; Artwork Notes <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g. Please send digital sample for approval before bulk printing"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>3. Select Payment Method</h2>

              {/* Online Payment via Razorpay */}
              <div
                onClick={() => setPaymentMethod('RAZORPAY')}
                style={{
                  ...styles.paymentOption,
                  border: paymentMethod === 'RAZORPAY' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  backgroundColor: paymentMethod === 'RAZORPAY' ? 'rgba(255, 78, 0, 0.03)' : 'white',
                }}
              >
                <input
                  type="radio"
                  id="payRazorpay"
                  name="paymentMethodRadio"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                />
                <div style={{ flex: 1 }}>
                  <div style={styles.payName}>
                    <span>Online Payment (Razorpay Secure Gateway)</span>
                    <span style={styles.recommendTag}>Fastest &amp; Recommended</span>
                  </div>
                  <div style={styles.payDesc}>
                    UPI (Google Pay, PhonePe, Paytm), Credit &amp; Debit Cards, NetBanking, and Corporate Wallets.
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem' }}>💳</span>
              </div>

              {/* Cash on Delivery (COD) */}
              <div
                onClick={() => { if (isCodEligible) setPaymentMethod('COD'); }}
                style={{
                  ...styles.paymentOption,
                  border: paymentMethod === 'COD' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  backgroundColor: paymentMethod === 'COD' ? 'rgba(255, 78, 0, 0.03)' : 'white',
                  opacity: isCodEligible ? 1 : 0.6,
                  cursor: isCodEligible ? 'pointer' : 'not-allowed',
                }}
              >
                <input
                  type="radio"
                  id="payCOD"
                  name="paymentMethodRadio"
                  checked={paymentMethod === 'COD'}
                  disabled={!isCodEligible}
                  onChange={() => { if (isCodEligible) setPaymentMethod('COD'); }}
                />
                <div style={{ flex: 1 }}>
                  <div style={styles.payName}>
                    <span>Cash on Delivery (COD)</span>
                    <span style={styles.codFeeTag}>+₹50 handling</span>
                  </div>
                  <div style={styles.payDesc}>
                    {isCodEligible
                      ? 'Pay with cash or UPI upon delivery. Note: Custom printed items are verified prior to dispatch.'
                      : 'COD is restricted to orders up to ₹5,000. Please use Online Payment for larger orders.'}
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem' }}>💵</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div style={styles.rightColumn}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary ({items.length} items)</h2>

              {/* Items List Snapshot */}
              <div style={styles.itemsSnapshot}>
                {items.map((it) => (
                  <div key={it.id} style={styles.snapshotItem}>
                    <img
                      src={it.customization?.previewSnapshot || it.imageUrl || '/navlogo.png'}
                      alt={it.name}
                      style={styles.snapshotImg}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.snapshotName}>{it.name}</div>
                      <div style={styles.snapshotMeta}>
                        Qty: <strong>{it.quantity}</strong>
                        {it.selectedSize ? ` · Size: ${it.selectedSize}` : ''}
                        {it.customization ? ' · Customized' : ''}
                      </div>
                    </div>
                    <div style={styles.snapshotPrice}>
                      ₹{(user?.role === 'WHOLESALER' && user?.approvalStatus === 'APPROVED' && it.wholesalePrice ? it.wholesalePrice : it.price) * it.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div style={styles.breakdownRows}>
                <div style={styles.row}>
                  <span style={styles.rowLabel}>Subtotal</span>
                  <span style={styles.rowValue}>₹{quote?.subtotal || '...'}</span>
                </div>

                {quote?.totalWholesaleSavings > 0 && (
                  <div style={styles.row}>
                    <span style={{ ...styles.rowLabel, color: '#059669', fontWeight: '600' }}>
                      Wholesale B2B Savings
                    </span>
                    <span style={{ ...styles.rowValue, color: '#059669', fontWeight: '600' }}>
                      -₹{quote.totalWholesaleSavings}
                    </span>
                  </div>
                )}

                {quote?.couponDiscount > 0 && (
                  <div style={styles.row}>
                    <span style={{ ...styles.rowLabel, color: '#059669', fontWeight: '600' }}>
                      Coupon Discount ({couponCode})
                    </span>
                    <span style={{ ...styles.rowValue, color: '#059669', fontWeight: '600' }}>
                      -₹{quote.couponDiscount}
                    </span>
                  </div>
                )}

                <div style={styles.row}>
                  <span style={styles.rowLabel}>GST Tax (18% Standard)</span>
                  <span style={styles.rowValue}>₹{quote?.tax || '...'}</span>
                </div>

                <div style={styles.row}>
                  <span style={styles.rowLabel}>Shipping</span>
                  <span style={styles.rowValue}>
                    {quote?.shippingCharge === 0 ? (
                      <span style={{ color: '#059669', fontWeight: '600' }}>FREE</span>
                    ) : (
                      `₹${quote?.shippingCharge || 99}`
                    )}
                  </span>
                </div>

                {paymentMethod === 'COD' && (
                  <div style={styles.row}>
                    <span style={styles.rowLabel}>COD Convenience Fee</span>
                    <span style={styles.rowValue}>₹50</span>
                  </div>
                )}

                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total Payable</span>
                  <span style={styles.totalValue}>
                    ₹{(quote?.totalAmount || 0) + (paymentMethod === 'COD' ? 50 : 0)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-accent"
                style={styles.submitOrderBtn}
              >
                {loading
                  ? 'Processing Order...'
                  : paymentMethod === 'COD'
                  ? 'Confirm Cash on Delivery Order'
                  : 'Pay with Razorpay & Place Order'}
              </button>

              <div style={styles.securityNote}>
                🔒 100% Secure Payment. We never store card or UPI PINs.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '2.5rem 0 5rem',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  breadcrumb: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.25rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
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
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: '1.8',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '1.75rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.75rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1rem',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  payName: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
    flexWrap: 'wrap',
  },
  recommendTag: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  codFeeTag: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  payDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  rightColumn: {
    flex: '1.2',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: '95px',
  },
  summaryTitle: {
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
  },
  itemsSnapshot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '260px',
    overflowY: 'auto',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  snapshotItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  snapshotImg: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    backgroundColor: 'var(--bg-tertiary)',
    flexShrink: 0,
  },
  snapshotName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  snapshotMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  snapshotPrice: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
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
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '2px solid var(--border-color)',
    paddingTop: '1rem',
    marginTop: '0.5rem',
  },
  totalLabel: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  totalValue: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--accent-color)',
  },
  submitOrderBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '1.05rem',
  },
  securityNote: {
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    textAlign: 'center',
  }
};
