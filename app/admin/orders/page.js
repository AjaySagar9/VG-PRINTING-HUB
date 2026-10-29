'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    placed: 0,
    designApproval: 0,
    inProduction: 0,
    dispatched: 0,
    delivered: 0,
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal for updating tracking
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [courierName, setCourierName] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);

  // Modal for reviewing artwork
  const [artworkModalItem, setArtworkModalItem] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL'
        ? '/api/admin/orders'
        : `/api/admin/orders?status=${filterStatus}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Could not load orders. Ensure you have admin privileges.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ type: 'success', message: data.message });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      fetchOrders();
    } catch (e) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    setSavingTracking(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: trackingModalOrder.id,
          status: 'Dispatched', // Automatically transition to Dispatched when courier assigned
          trackingCourier: courierName,
          trackingNumber: awbNumber,
          trackingUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ type: 'success', message: `Tracking added for #${trackingModalOrder.orderNumber}` });
      setTrackingModalOrder(null);
      fetchOrders();
    } catch (e) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setSavingTracking(false);
    }
  };

  const openTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setCourierName(order.trackingCourier || 'BlueDart');
    setAwbNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl || '');
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Customer Order Management</h1>
          <p style={styles.pageSubtitle}>
            Monitor custom printing orders, review uploaded artwork, manage production stages, and update courier shipments.
          </p>
        </div>
        <button onClick={fetchOrders} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
          🔄 Refresh Orders
        </button>
      </header>

      {/* Stats Counter Bar */}
      <div style={styles.statsGrid}>
        <div onClick={() => setFilterStatus('ALL')} style={{ ...styles.statCard, cursor: 'pointer' }}>
          <div style={styles.statLabel}>Total Orders</div>
          <div style={styles.statValue}>{stats.totalOrders}</div>
        </div>
        <div onClick={() => setFilterStatus('Placed')} style={{ ...styles.statCard, cursor: 'pointer', borderLeft: '4px solid #64748b' }}>
          <div style={styles.statLabel}>Placed</div>
          <div style={styles.statValue}>{stats.placed}</div>
        </div>
        <div onClick={() => setFilterStatus('Design Approval')} style={{ ...styles.statCard, cursor: 'pointer', borderLeft: '4px solid #d97706' }}>
          <div style={styles.statLabel}>Design Review</div>
          <div style={{ ...styles.statValue, color: '#d97706' }}>{stats.designApproval}</div>
        </div>
        <div onClick={() => setFilterStatus('In Production')} style={{ ...styles.statCard, cursor: 'pointer', borderLeft: '4px solid #7c3aed' }}>
          <div style={styles.statLabel}>In Production</div>
          <div style={{ ...styles.statValue, color: '#7c3aed' }}>{stats.inProduction}</div>
        </div>
        <div onClick={() => setFilterStatus('Dispatched')} style={{ ...styles.statCard, cursor: 'pointer', borderLeft: '4px solid #2563eb' }}>
          <div style={styles.statLabel}>Dispatched</div>
          <div style={{ ...styles.statValue, color: '#2563eb' }}>{stats.dispatched}</div>
        </div>
        <div onClick={() => setFilterStatus('Delivered')} style={{ ...styles.statCard, cursor: 'pointer', borderLeft: '4px solid #059669' }}>
          <div style={styles.statLabel}>Delivered</div>
          <div style={{ ...styles.statValue, color: '#059669' }}>{stats.delivered}</div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.message && (
        <div style={{
          ...styles.feedbackBanner,
          backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
          borderColor: feedback.type === 'error' ? '#fecaca' : '#a7f3d0',
          color: feedback.type === 'error' ? '#991b1b' : '#065f46',
        }}>
          <span>{feedback.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={styles.tabContainer}>
        {['ALL', 'Placed', 'Design Approval', 'In Production', 'Dispatched', 'Delivered'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            style={{
              ...styles.tabBtn,
              ...(filterStatus === st ? styles.tabBtnActive : styles.tabBtnInactive)
            }}
          >
            {st === 'ALL' ? 'All Orders' : st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingBox}>
            <p>Loading customer orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order ID &amp; Date</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Merchandise &amp; Artwork</th>
                  <th style={styles.th}>Total &amp; Payment</th>
                  <th style={styles.th}>Production Status</th>
                  <th style={styles.th}>Shipment Tracking</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id} style={styles.tr}>
                    {/* Order ID & Date */}
                    <td style={styles.td}>
                      <Link href={`/orders/${ord.id}`} style={styles.orderLink}>
                        #{ord.orderNumber || ord.id.slice(-8).toUpperCase()}
                      </Link>
                      <div style={styles.dateSub}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={styles.td}>
                      <div style={{ fontWeight: '600' }}>{ord.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ord.customerEmail}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        📞 +91 {ord.customerMobile}
                      </div>
                      {ord.shippingAddress?.city && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          📍 {ord.shippingAddress.city}, {ord.shippingAddress.state}
                        </div>
                      )}
                    </td>

                    {/* Merchandise & Custom Artwork */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {ord.items && ord.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={it.customization?.previewSnapshot || it.imageUrl || '/navlogo.png'}
                              alt={it.name}
                              style={styles.itemMiniThumb}
                            />
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                {it.name} &times; <strong>{it.quantity}</strong>
                              </div>
                              {it.customization ? (
                                <button
                                  type="button"
                                  onClick={() => setArtworkModalItem(it)}
                                  style={styles.artworkInspectBtn}
                                >
                                  🎨 Review Artwork ({it.customization.placement})
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Standard Stock</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total & Payment */}
                    <td style={styles.td}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>₹{ord.totalAmount}</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                        <span style={{
                          backgroundColor: ord.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                          color: ord.paymentStatus === 'PAID' ? '#047857' : '#b45309',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                        }}>
                          {ord.paymentStatus} ({ord.paymentMethod})
                        </span>
                      </div>
                    </td>

                    {/* Status Switcher */}
                    <td style={styles.td}>
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        style={styles.statusSelect}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Design Approval">Design Approval</option>
                        <option value="In Production">In Production</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Tracking Actions */}
                    <td style={styles.td}>
                      {ord.trackingNumber ? (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '600' }}>
                            {ord.trackingCourier}: {ord.trackingNumber}
                          </div>
                          <button
                            type="button"
                            onClick={() => openTrackingModal(ord)}
                            style={styles.editTrackingBtn}
                          >
                            Edit Tracking
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openTrackingModal(ord)}
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          + Add Tracking
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <h3 style={{ marginTop: '0.5rem' }}>No orders found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No customer orders match the filter &ldquo;{filterStatus}&rdquo;.
            </p>
          </div>
        )}
      </div>

      {/* TRACKING MODAL */}
      {trackingModalOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Add Courier Tracking Details</h3>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Entering tracking information marks order #{trackingModalOrder.orderNumber} as <strong>Dispatched</strong> and enables live tracking for the customer.
            </p>

            <form onSubmit={handleSaveTracking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Courier Partner Name</label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart, Delhivery, DTDC, Shiprocket"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Waybill / AWB Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. BD123456789IN"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Tracking URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://track.bluedart.com/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTracking}
                  className="btn btn-accent"
                  style={{ flex: 1 }}
                >
                  {savingTracking ? 'Saving...' : 'Save &amp; Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTWORK REVIEW MODAL */}
      {artworkModalItem && (
        <div style={styles.modalOverlay} onClick={() => setArtworkModalItem(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Customer Artwork Inspection</h3>
              <button
                type="button"
                onClick={() => setArtworkModalItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <img
                src={artworkModalItem.customization?.previewSnapshot || artworkModalItem.imageUrl}
                alt="Custom Imprint"
                style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }}
              />
            </div>

            <div style={styles.artworkDetails}>
              <div><strong>Item:</strong> {artworkModalItem.name}</div>
              <div><strong>Placement:</strong> {artworkModalItem.customization?.placement}</div>
              {artworkModalItem.customization?.logoFileName && (
                <div><strong>Original File:</strong> {artworkModalItem.customization.logoFileName}</div>
              )}
              {artworkModalItem.customization?.customText && (
                <div><strong>Custom Text:</strong> &ldquo;{artworkModalItem.customization.customText}&rdquo; ({artworkModalItem.customization.textFont})</div>
              )}
            </div>

            {artworkModalItem.customization?.logoUrl && (
              <a
                href={artworkModalItem.customization.logoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ textAlign: 'center' }}
              >
                💾 Download Original Vector / Logo File
              </a>
            )}

            <button
              type="button"
              onClick={() => setArtworkModalItem(null)}
              className="btn btn-primary"
            >
              Close Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1240px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  pageSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.25rem',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  feedbackBanner: {
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1.25rem',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  tabBtn: {
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  tabBtnActive: {
    backgroundColor: 'var(--text-primary)',
    color: 'white',
    border: '1px solid var(--text-primary)',
  },
  tabBtnInactive: {
    backgroundColor: 'white',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '1rem 1.25rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border-color)',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '1.2rem 1.25rem',
    fontSize: '0.9rem',
    verticalAlign: 'top',
  },
  orderLink: {
    fontWeight: '700',
    color: 'var(--accent-color)',
    fontSize: '0.95rem',
  },
  dateSub: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: '2px',
  },
  itemMiniThumb: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    backgroundColor: 'var(--bg-tertiary)',
    flexShrink: 0,
  },
  artworkInspectBtn: {
    fontSize: '0.75rem',
    color: 'var(--accent-color)',
    fontWeight: '600',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  statusSelect: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'white',
  },
  editTrackingBtn: {
    fontSize: '0.75rem',
    color: 'var(--accent-color)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginTop: '4px',
    display: 'block',
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
    maxWidth: '500px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  artworkDetails: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    color: 'var(--text-secondary)',
  },
  loadingBox: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    padding: '4rem 2rem',
    textAlign: 'center',
  }
};
