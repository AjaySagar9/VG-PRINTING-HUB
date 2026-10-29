'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminWholesalersPage() {
  const [wholesalers, setWholesalers] = useState([]);
  const [stats, setStats] = useState({
    totalWholesalers: 0,
    pendingWholesalers: 0,
    approvedWholesalers: 0,
    rejectedWholesalers: 0,
  });
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchWholesalers();
  }, [activeTab]);

  const fetchWholesalers = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'ALL'
        ? '/api/admin/wholesalers'
        : `/api/admin/wholesalers?status=${activeTab}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load wholesalers');
      const data = await res.json();
      setWholesalers(data.wholesalers || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Could not load wholesalers. Make sure you are logged in as admin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    setActionLoadingId(userId);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch('/api/admin/wholesalers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approvalStatus: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setFeedback({
        type: 'success',
        message: data.message || `Account successfully set to ${newStatus}`
      });

      // Update in local state immediately
      setWholesalers((prev) =>
        prev.map((w) => (w.id === userId ? { ...w, approvalStatus: newStatus } : w))
      );

      // Refresh stats
      fetchWholesalers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Wholesale Partner Approvals</h1>
          <p style={styles.pageSubtitle}>
            Review business credentials, manage B2B account access, and toggle wholesale price eligibility.
          </p>
        </div>
        <button onClick={fetchWholesalers} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
          🔄 Refresh List
        </button>
      </header>

      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <div
          onClick={() => setActiveTab('PENDING')}
          style={{
            ...styles.statCard,
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer',
            backgroundColor: activeTab === 'PENDING' ? '#fffbeb' : 'white',
          }}
        >
          <div style={styles.statTitle}>Pending Approval</div>
          <div style={{ ...styles.statValue, color: '#d97706' }}>{stats.pendingWholesalers}</div>
          <div style={styles.statSub}>Requires admin review</div>
        </div>

        <div
          onClick={() => setActiveTab('APPROVED')}
          style={{
            ...styles.statCard,
            borderLeft: '4px solid #10b981',
            cursor: 'pointer',
            backgroundColor: activeTab === 'APPROVED' ? '#ecfdf5' : 'white',
          }}
        >
          <div style={styles.statTitle}>Approved Wholesalers</div>
          <div style={{ ...styles.statValue, color: '#059669' }}>{stats.approvedWholesalers}</div>
          <div style={styles.statSub}>Active wholesale pricing</div>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          style={{
            ...styles.statCard,
            borderLeft: '4px solid #ef4444',
            cursor: 'pointer',
            backgroundColor: activeTab === 'REJECTED' ? '#fef2f2' : 'white',
          }}
        >
          <div style={styles.statTitle}>Rejected / Inactive</div>
          <div style={{ ...styles.statValue, color: '#dc2626' }}>{stats.rejectedWholesalers}</div>
          <div style={styles.statSub}>Price access blocked</div>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          style={{
            ...styles.statCard,
            borderLeft: '4px solid var(--text-primary)',
            cursor: 'pointer',
            backgroundColor: activeTab === 'ALL' ? 'var(--bg-tertiary)' : 'white',
          }}
        >
          <div style={styles.statTitle}>Total Applications</div>
          <div style={styles.statValue}>{stats.totalWholesalers}</div>
          <div style={styles.statSub}>All registered B2B accounts</div>
        </div>
      </div>

      {/* Toast Alert Feedback */}
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
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabBtnActive : styles.tabBtnInactive)
            }}
          >
            {tab === 'ALL' && 'All Applications'}
            {tab === 'PENDING' && `Pending Approval (${stats.pendingWholesalers})`}
            {tab === 'APPROVED' && `Approved (${stats.approvedWholesalers})`}
            {tab === 'REJECTED' && `Rejected (${stats.rejectedWholesalers})`}
          </button>
        ))}
      </div>

      {/* Wholesalers Table Card */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingBox}>
            <p>Loading wholesalers directory...</p>
          </div>
        ) : wholesalers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Business & Contact</th>
                  <th style={styles.th}>Contact Details</th>
                  <th style={styles.th}>Business Type & GSTIN</th>
                  <th style={styles.th}>Address</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Approval Actions</th>
                </tr>
              </thead>
              <tbody>
                {wholesalers.map((w) => {
                  const isActionLoading = actionLoadingId === w.id;

                  return (
                    <tr key={w.id} style={styles.tr}>
                      {/* Business & Contact */}
                      <td style={styles.td}>
                        <div style={styles.bizName}>{w.businessName || 'Business Name N/A'}</div>
                        <div style={styles.contactName}>Contact: {w.name}</div>
                        <div style={styles.dateSub}>
                          Joined: {new Date(w.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500' }}>{w.email}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                          📞 +91 {w.mobile}
                        </div>
                      </td>

                      {/* Business Type & GSTIN */}
                      <td style={styles.td}>
                        <div style={{ fontWeight: '500' }}>{w.businessType || 'General'}</div>
                        {w.gstin ? (
                          <div style={styles.gstinTag} title="Provided GSTIN">
                            GST: {w.gstin}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '2px' }}>
                            GSTIN not provided
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td style={styles.td}>
                        <div style={styles.addressText}>
                          {w.businessAddress || 'No address provided'}
                        </div>
                      </td>

                      {/* Current Status */}
                      <td style={styles.td}>
                        {w.approvalStatus === 'APPROVED' && (
                          <span style={styles.badgeApproved}>Approved</span>
                        )}
                        {w.approvalStatus === 'PENDING' && (
                          <span style={styles.badgePending}>Pending</span>
                        )}
                        {w.approvalStatus === 'REJECTED' && (
                          <span style={styles.badgeRejected}>Rejected</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={styles.td}>
                        <div style={styles.actionButtonGroup}>
                          {w.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                              disabled={isActionLoading}
                              style={styles.approveBtn}
                              title="Approve wholesale access and unlock tier pricing"
                            >
                              {isActionLoading ? '...' : '✓ Approve'}
                            </button>
                          )}

                          {w.approvalStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateStatus(w.id, 'REJECTED')}
                              disabled={isActionLoading}
                              style={styles.rejectBtn}
                              title="Reject wholesale application"
                            >
                              {isActionLoading ? '...' : '✕ Reject'}
                            </button>
                          )}

                          {w.approvalStatus !== 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(w.id, 'PENDING')}
                              disabled={isActionLoading}
                              style={styles.revertBtn}
                              title="Reset back to pending"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '2.5rem' }}>📋</span>
            <h3 style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>No wholesale applications found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {activeTab === 'ALL'
                ? 'No businesses have registered as wholesalers yet.'
                : `There are currently no wholesalers with status "${activeTab}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  statCard: {
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
    transition: 'transform var(--transition-fast)',
  },
  statTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.35rem',
  },
  statValue: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  statSub: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: '0.5rem',
  },
  feedbackBanner: {
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1.25rem',
    marginBottom: '1.5rem',
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
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
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
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border-color)',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background-color var(--transition-fast)',
  },
  td: {
    padding: '1.2rem 1.25rem',
    fontSize: '0.9rem',
    verticalAlign: 'top',
  },
  bizName: {
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
  },
  contactName: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    marginTop: '2px',
  },
  dateSub: {
    color: 'var(--text-tertiary)',
    fontSize: '0.75rem',
    marginTop: '4px',
  },
  gstinTag: {
    display: 'inline-block',
    fontSize: '0.75rem',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
    marginTop: '4px',
  },
  addressText: {
    maxWidth: '220px',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  badgeApproved: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  badgePending: {
    backgroundColor: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  badgeRejected: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  approveBtn: {
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px 10px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  revertBtn: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    padding: '6px 10px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  loadingBox: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }
};
