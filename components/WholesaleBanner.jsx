'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function WholesaleBanner() {
  const { user, loading } = useAuth();

  if (loading || !user || user.role !== 'WHOLESALER') {
    return null;
  }

  if (user.approvalStatus === 'PENDING') {
    return (
      <div style={styles.pendingBanner} role="alert">
        <div className="container" style={styles.container}>
          <div style={styles.iconBox}>
            <span style={{ fontSize: '1.25rem' }}>⏳</span>
          </div>
          <div style={styles.textBox}>
            <p style={styles.title}>
              <strong>Wholesale Account Pending Admin Approval</strong> — Welcome, {user.businessName || user.name}!
            </p>
            <p style={styles.desc}>
              Your wholesale business application is currently under verification by our team. You can explore standard products below. 
              <strong> Exclusive bulk wholesale pricing</strong> will automatically activate once your account is approved.
            </p>
          </div>
          <div style={styles.badgePending}>Status: Under Review</div>
        </div>
      </div>
    );
  }

  if (user.approvalStatus === 'APPROVED') {
    return (
      <div style={styles.approvedBanner} role="status">
        <div className="container" style={styles.container}>
          <div style={styles.iconBox}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
          </div>
          <div style={styles.textBox}>
            <p style={styles.title}>
              <strong>Verified Wholesale Partner</strong> — {user.businessName || user.name}
            </p>
            <p style={styles.desc}>
              Your wholesale discount rates and tiered bulk pricing are active across our print catalog.
            </p>
          </div>
          <span style={styles.badgeApproved}>✓ Wholesale Pricing Active</span>
        </div>
      </div>
    );
  }

  if (user.approvalStatus === 'REJECTED') {
    return (
      <div style={styles.rejectedBanner} role="alert">
        <div className="container" style={styles.container}>
          <div style={styles.iconBox}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          </div>
          <div style={styles.textBox}>
            <p style={styles.title}>
              <strong>Wholesale Application Needs Attention</strong>
            </p>
            <p style={styles.desc}>
              Your wholesale account could not be approved with the submitted business details. 
              Please reach out to our team at <Link href="/contact" style={{ textDecoration: 'underline' }}>support</Link> to update your documents.
            </p>
          </div>
          <span style={styles.badgeRejected}>Action Required</span>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  pendingBanner: {
    backgroundColor: '#fffbeb',
    borderBottom: '1px solid #fde68a',
    color: '#92400e',
    padding: '0.85rem 0',
    fontSize: '0.9rem',
  },
  approvedBanner: {
    backgroundColor: '#ecfdf5',
    borderBottom: '1px solid #a7f3d0',
    color: '#065f46',
    padding: '0.85rem 0',
    fontSize: '0.9rem',
  },
  rejectedBanner: {
    backgroundColor: '#fef2f2',
    borderBottom: '1px solid #fecaca',
    color: '#991b1b',
    padding: '0.85rem 0',
    fontSize: '0.9rem',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  iconBox: {
    flexShrink: 0,
  },
  textBox: {
    flex: 1,
    minWidth: '240px',
  },
  title: {
    marginBottom: '0.15rem',
  },
  desc: {
    opacity: 0.9,
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: '1px solid #fcd34d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  badgeApproved: {
    backgroundColor: '#d1fae5',
    color: '#047857',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: '1px solid #6ee7b7',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  badgeRejected: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: '1px solid #fca5a5',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }
};
