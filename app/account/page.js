'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your account...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
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

  return (
    <div style={styles.page}>
      <div className="container">
        
        {/* Profile Card Header */}
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.avatar}>
              {(user.businessName || user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.userTitleRow}>
                <h1 style={styles.userName}>{user.businessName || user.name}</h1>
                {user.role === 'WHOLESALER' ? (
                  user.approvalStatus === 'APPROVED' ? (
                    <span style={styles.badgeApproved}>✓ Approved Wholesale Partner</span>
                  ) : (
                    <span style={styles.badgePending}>⏳ Wholesale Account (Under Review)</span>
                  )
                ) : (
                  <span style={styles.badgeRetail}>Retail Customer</span>
                )}
              </div>
              <div style={styles.userMeta}>
                <span>📧 {user.email}</span>
                <span>📞 +91 {user.mobile}</span>
                {user.gstin && <span>🏛️ GSTIN: {user.gstin}</span>}
              </div>
            </div>
            <button onClick={logout} className="btn btn-outline" style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Order History Section */}
        <div style={styles.ordersSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Order History &amp; Tracking</h2>
            <Link href="/products" className="btn btn-accent" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              + Order New Prints
            </Link>
          </div>

          {ordersLoading ? (
            <div style={styles.loadingBox}>
              <p>Fetching your orders and tracking records...</p>
            </div>
          ) : orders.length > 0 ? (
            <div style={styles.ordersList}>
              {orders.map((order) => {
                const statusStyle = getStatusColor(order.status);

                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderTopBar}>
                      <div>
                        <div style={styles.orderNumber}>
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </div>
                        <div style={styles.orderDate}>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
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

                    {/* Items Preview */}
                    <div style={styles.orderItemsPreview}>
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
                              {it.customization ? ` · Placement: ${it.customization.placement}` : ''}
                            </div>
                          </div>
                          <div style={styles.itemPrice}>
                            ₹{it.unitPrice * it.quantity}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Actions */}
                    <div style={styles.orderBottomBar}>
                      <div>
                        {order.trackingNumber ? (
                          <span style={styles.trackingInfo}>
                            🚚 Courier: <strong>{order.trackingCourier || 'Standard'}</strong> (AWB: {order.trackingNumber})
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/orders/${order.id}`}
                        className="btn btn-outline"
                        style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                      >
                        Track Order &amp; View Design &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyOrders}>
              <span style={{ fontSize: '3rem' }}>📦</span>
              <h3 style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>No orders yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                When you place corporate or personalized print orders, they will appear here with live tracking.
              </p>
              <Link href="/products" className="btn btn-primary">
                Explore Print Catalog
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '3rem 0 5rem',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '2.5rem',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    fontSize: '1.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '0.25rem',
  },
  userName: {
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
  },
  badgeApproved: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  badgePending: {
    backgroundColor: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  badgeRetail: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  userMeta: {
    display: 'flex',
    gap: '1.25rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    flexWrap: 'wrap',
  },
  logoutBtn: {
    marginLeft: 'auto',
    fontSize: '0.85rem',
    padding: '8px 16px',
  },
  ordersSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
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
  orderItemsPreview: {
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
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    backgroundColor: 'var(--bg-tertiary)',
    flexShrink: 0,
  },
  itemTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  emptyOrders: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '4rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
  },
  loadingBox: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  }
};
