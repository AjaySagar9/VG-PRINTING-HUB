'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { totalCount } = useCart();

  return (
    <header style={styles.header}>
      <div className="container" style={styles.container}>
        <div style={styles.logoContainer}>
          <Link href="/" style={{ ...styles.logo, display: 'flex', alignItems: 'center' }}>
            <Image
              src="/navlogo.png"
              alt="VG Printing Hub Logo"
              width={140}
              height={45}
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
              priority
            />
          </Link>
        </div>

        <nav style={styles.nav}>
          <Link href="/" style={styles.navLink}>Home</Link>
          <Link href="/products" style={styles.navLink}>Products</Link>
          <Link href="/categories" style={styles.navLink}>Categories</Link>
          <Link href="/contact" style={styles.navLink}>Contact</Link>
        </nav>

        <div style={styles.actions}>
          {loading ? (
            <div style={styles.skeletonAction} />
          ) : user ? (
            <div style={styles.userProfile}>
              {/* Role / Wholesale Status Badge */}
              {user.role === 'ADMIN' && (
                <Link href="/admin" style={styles.adminBadge}>
                  Admin Panel
                </Link>
              )}

              {user.role === 'WHOLESALER' && (
                user.approvalStatus === 'APPROVED' ? (
                  <span style={styles.wholesaleApprovedBadge} title="Approved Wholesale Partner">
                    ✓ Wholesale Partner
                  </span>
                ) : (
                  <span style={styles.wholesalePendingBadge} title="Wholesale account pending admin review">
                    ⏳ Wholesale (Pending)
                  </span>
                )
              )}

              {user.role === 'RETAILER' && (
                <span style={styles.retailerBadge}>
                  Retail
                </span>
              )}

              <Link href="/account" style={styles.ordersLink} title="View your order history & tracking">
                📦 My Orders
              </Link>

              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.businessName || user.name}</span>
                <span style={styles.userEmail}>{user.email}</span>
              </div>

              <button
                onClick={logout}
                className="btn btn-outline"
                style={styles.logoutBtn}
                title="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="/login" style={{ ...styles.navLink, marginRight: '1.25rem' }}>
                Login
              </Link>
              <Link href="/signup" className="btn btn-outline" style={{ marginRight: '1rem' }}>
                Sign Up
              </Link>
            </div>
          )}

          <Link href="/cart" className="btn btn-accent" style={styles.cartBtn}>
            Cart ({totalCount})
          </Link>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '75px',
  },
  logoContainer: {
    flexShrink: 0,
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    color: 'var(--text-primary)',
  },
  nav: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    fontWeight: '500',
    fontSize: '1rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.2,
    marginRight: '0.25rem',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  adminBadge: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
  },
  wholesaleApprovedBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  wholesalePendingBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  retailerBadge: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontWeight: '500',
  },
  ordersLink: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-tertiary)',
    whiteSpace: 'nowrap',
    transition: 'background-color var(--transition-fast)',
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  cartBtn: {
    padding: '10px 20px',
    fontSize: '0.95rem',
  },
  skeletonAction: {
    width: '120px',
    height: '36px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-full)',
  }
};
