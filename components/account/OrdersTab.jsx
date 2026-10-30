'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';

export default function OrdersTab() {
  const router = useRouter();
  const { addItem } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, DELIVERED, CANCELLED
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    order: null,
    actionType: 'cancel', // 'cancel' | 'return'
    reason: '',
    loading: false,
    error: '',
    success: '',
  });

  const [reorderToast, setReorderToast] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Fetch orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 'Dispatched':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
      case 'In Production':
        return { bg: '#fdf4ff', text: '#86198f', border: '#f5d0fe' };
      case 'Design Approval':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
      case 'Cancelled':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      default:
        return { bg: 'var(--bg-tertiary)', text: 'var(--text-primary)', border: 'var(--border-color)' };
    }
  };

  // Reorder functionality: add items into active cart
  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;

    let count = 0;
    order.items.forEach((item) => {
      addItem({
        productId: item.productId,
        name: item.name,
        price: item.unitPrice || item.price || 0,
        wholesalePrice: item.wholesalePrice || null,
        imageUrl: item.customization?.previewSnapshot || item.imageUrl || '/navlogo.png',
        selectedColor: item.selectedColor || '#ffffff',
        selectedSize: item.selectedSize || '',
        quantity: item.quantity || 1,
        customization: item.customization || null,
      });
      count += (item.quantity || 1);
    });

    setReorderToast(`Added ${count} item(s) from Order #${order.orderNumber || order.id.slice(-6)} to your cart!`);
    setTimeout(() => {
      setReorderToast('');
      router.push('/cart');
    }, 1200);
  };

  // Submit Order Action (Cancel or Return)
  const handleOrderAction = async (e) => {
    e.preventDefault();
    if (!actionModal.order) return;

    setActionModal((prev) => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const res = await fetch(`/api/orders/${actionModal.order.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.actionType,
          reason: actionModal.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setActionModal((prev) => ({
        ...prev,
        loading: false,
        success: data.message,
      }));

      // Refresh orders list
      fetchOrders();

      setTimeout(() => {
        setActionModal({
          isOpen: false,
          order: null,
          actionType: 'cancel',
          reason: '',
          loading: false,
          error: '',
          success: '',
        });
      }, 2000);
    } catch (err) {
      setActionModal((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') {
      return ['Placed', 'Design Approval', 'In Production', 'Dispatched'].includes(order.status);
    }
    if (filter === 'DELIVERED') return order.status === 'Delivered';
    if (filter === 'CANCELLED') return order.status === 'Cancelled';
    return true;
  });

  return (
    <div style={styles.container}>
      {reorderToast && (
        <div style={styles.toastBanner}>
          🛒 {reorderToast}
        </div>
      )}

      {/* Header & Filter Row */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>My Orders &amp; Print Jobs</h2>
          <p style={styles.subtitle}>Track production stages, courier shipping, or easily reorder previous merchandise.</p>
        </div>

        <Link href="/products" className="btn btn-accent" style={styles.orderNewBtn}>
          + New Print Order
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterBar}>
        {[
          { key: 'ALL', label: `All Orders (${orders.length})` },
          { key: 'ACTIVE', label: `In Progress (${orders.filter((o) => ['Placed', 'Design Approval', 'In Production', 'Dispatched'].includes(o.status)).length})` },
          { key: 'DELIVERED', label: `Delivered (${orders.filter((o) => o.status === 'Delivered').length})` },
          { key: 'CANCELLED', label: `Cancelled (${orders.filter((o) => o.status === 'Cancelled').length})` },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              ...styles.filterTab,
              borderBottom: filter === f.key ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: filter === f.key ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: filter === f.key ? '700' : '500',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={styles.emptyState}>
          <p>Loading your orders and tracking records...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div style={styles.ordersList}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusStyle(order.status);
            const canCancel = ['Placed', 'Design Approval'].includes(order.status);
            const canReturn = order.status === 'Delivered' && (!order.returnStatus || order.returnStatus === 'NONE');

            return (
              <div key={order.id} style={styles.orderCard}>
                {/* Top Bar */}
                <div style={styles.orderTopBar}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={styles.orderNumber}>
                      Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                    </div>
                    <div style={styles.orderDate}>
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      ● {order.status}
                    </span>

                    <div style={styles.orderTotal}>
                      ₹{order.totalAmount}
                    </div>
                  </div>
                </div>

                {/* Return Status Alert if requested */}
                {order.returnStatus && order.returnStatus !== 'NONE' && (
                  <div style={styles.returnAlert}>
                    <span>↩️ Return Status: <strong>{order.returnStatus}</strong></span>
                    {order.returnReason && <span style={{ opacity: 0.85 }}> &mdash; Reason: {order.returnReason}</span>}
                  </div>
                )}

                {/* Cancel Reason if cancelled */}
                {order.status === 'Cancelled' && order.cancelReason && (
                  <div style={styles.cancelAlert}>
                    <span>✕ Cancelled: {order.cancelReason}</span>
                  </div>
                )}

                {/* Items Preview */}
                <div style={styles.itemsContainer}>
                  {order.items && order.items.map((it, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <img
                        src={it.customization?.previewSnapshot || it.imageUrl || '/navlogo.png'}
                        alt={it.name}
                        style={styles.itemThumb}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.itemTitle}>{it.name}</div>
                        <div style={styles.itemMeta}>
                          Qty: <strong>{it.quantity}</strong>
                          {it.selectedSize ? ` · Size: ${it.selectedSize}` : ''}
                          {it.selectedColor ? ` · Color: ${it.selectedColor}` : ''}
                          {it.customization ? ` · Placement: ${it.customization.placement}` : ''}
                        </div>
                      </div>
                      <div style={styles.itemPrice}>
                        ₹{it.unitPrice * it.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Delivery Address Preview */}
                {order.shippingAddress && (
                  <div style={styles.addressLine}>
                    <span>📍 Shipping to: <strong>{order.customerName}</strong> &mdash; {order.shippingAddress.address || order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</span>
                  </div>
                )}

                {/* Bottom Actions */}
                <div style={styles.orderBottomBar}>
                  <div style={styles.trackingInfo}>
                    {order.trackingNumber ? (
                      <span>
                        🚚 Courier: <strong>{order.trackingCourier || 'Standard'}</strong> (AWB: {order.trackingNumber})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                      </span>
                    )}
                  </div>

                  <div style={styles.btnRow}>
                    {/* Reorder Button */}
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="btn btn-outline"
                      style={styles.actionBtn}
                      title="Reorder exact customized items again"
                    >
                      🔄 Reorder
                    </button>

                    {/* Cancel Order Option */}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() =>
                          setActionModal({
                            isOpen: true,
                            order,
                            actionType: 'cancel',
                            reason: '',
                            loading: false,
                            error: '',
                            success: '',
                          })
                        }
                        style={styles.cancelBtn}
                      >
                        ✕ Cancel Order
                      </button>
                    )}

                    {/* Return Request Option */}
                    {canReturn && (
                      <button
                        type="button"
                        onClick={() =>
                          setActionModal({
                            isOpen: true,
                            order,
                            actionType: 'return',
                            reason: '',
                            loading: false,
                            error: '',
                            success: '',
                          })
                        }
                        style={styles.returnBtn}
                      >
                        ↩️ Request Return
                      </button>
                    )}

                    {/* View Details / Invoice Link */}
                    <Link
                      href={`/orders/${order.id}`}
                      className="btn btn-primary"
                      style={styles.actionBtn}
                    >
                      View Order &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '3rem' }}>📦</span>
          <h3 style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>No orders found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {filter === 'ALL'
              ? 'You have not placed any print orders yet. Customize and order corporate merchandise today!'
              : `No orders matching status filter: "${filter}".`}
          </p>
          <Link href="/products" className="btn btn-primary">
            Explore Merchandise Catalog
          </Link>
        </div>
      )}

      {/* Cancel / Return Action Modal */}
      {actionModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>
                {actionModal.actionType === 'cancel' ? 'Cancel Order' : 'Request Return / Replacement'}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Order #{actionModal.order?.orderNumber || actionModal.order?.id?.slice(-8).toUpperCase()}
            </p>

            {actionModal.actionType === 'cancel' && (
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Are you sure you want to cancel this order? Cancellations are only permitted prior to raw material preparation and custom printing production.
              </p>
            )}

            {actionModal.actionType === 'return' && (
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Please specify the reason for the return or exchange request (e.g., misprint, sizing discrepancy, or defective fabric).
              </p>
            )}

            {actionModal.error && (
              <div style={styles.modalError}>
                ⚠️ {actionModal.error}
              </div>
            )}

            {actionModal.success && (
              <div style={styles.modalSuccess}>
                ✓ {actionModal.success}
              </div>
            )}

            {!actionModal.success && (
              <form onSubmit={handleOrderAction}>
                <div className="input-group">
                  <label className="input-label" htmlFor="actionReason">
                    {actionModal.actionType === 'cancel' ? 'Cancellation Reason' : 'Reason / Defect Description *'}
                  </label>
                  <textarea
                    id="actionReason"
                    required={actionModal.actionType === 'return'}
                    rows={3}
                    className="input-field"
                    value={actionModal.reason}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder={
                      actionModal.actionType === 'cancel'
                        ? 'e.g., Placed by mistake, wrong quantity specified'
                        : 'e.g., Artwork print misalignment on front chest'
                    }
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionModal.loading}
                    className={`btn ${actionModal.actionType === 'cancel' ? 'btn-outline' : 'btn-accent'}`}
                    style={
                      actionModal.actionType === 'cancel'
                        ? { borderColor: '#ef4444', color: '#dc2626' }
                        : {}
                    }
                  >
                    {actionModal.loading
                      ? 'Processing...'
                      : actionModal.actionType === 'cancel'
                      ? 'Confirm Cancellation'
                      : 'Submit Return Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  toastBanner: {
    padding: '12px 16px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  orderNewBtn: {
    padding: '8px 18px',
    fontSize: '0.85rem',
  },
  filterBar: {
    display: 'flex',
    gap: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  filterTab: {
    padding: '8px 4px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color var(--transition-fast)',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    padding: '1.5rem',
  },
  orderTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  orderNumber: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  orderDate: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  orderTotal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  returnAlert: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  cancelAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  itemThumb: {
    width: '46px',
    height: '46px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    backgroundColor: 'var(--bg-tertiary)',
    flexShrink: 0,
  },
  itemTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  itemMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  itemPrice: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  addressLine: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-secondary)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '1rem',
  },
  orderBottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  trackingInfo: {
    fontSize: '0.85rem',
    color: '#1e40af',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '6px 14px',
    fontSize: '0.825rem',
  },
  cancelBtn: {
    padding: '6px 12px',
    fontSize: '0.825rem',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#fff5f5',
    cursor: 'pointer',
    fontWeight: '600',
  },
  returnBtn: {
    padding: '6px 12px',
    fontSize: '0.825rem',
    color: '#d97706',
    border: '1px solid #fde68a',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#fffbeb',
    cursor: 'pointer',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '3.5rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '460px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  closeBtn: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  modalError: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  modalSuccess: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '600',
    textAlign: 'center',
  },
};

