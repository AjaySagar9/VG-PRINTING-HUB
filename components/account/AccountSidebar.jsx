'use client';

import React from 'react';

export default function AccountSidebar({ user, activeTab, onSelectTab, onLogout }) {
  const isWholesale = user.role === 'WHOLESALER';

  const menuItems = [
    { id: 'profile', label: 'Personal Profile', icon: '👤', description: 'Name, email, mobile & password' },
    { id: 'orders', label: 'My Orders', icon: '📦', description: 'Tracking, history & reorders' },
    { id: 'addresses', label: 'Saved Addresses', icon: '📍', description: 'Delivery & billing addresses' },
    { id: 'designs', label: 'My Saved Designs', icon: '🎨', description: 'Custom artwork & mockups' },
    ...(isWholesale
      ? [{ id: 'wholesale', label: 'Wholesale Business', icon: '🏢', description: 'GSTIN, business tier & pricing' }]
      : []),
    { id: 'security', label: 'Security & Preferences', icon: '🔒', description: 'Sessions, alerts & privacy' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Profile Summary Card */}
      <div style={styles.profileSummary}>
        <div style={styles.avatar}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} style={styles.avatarImg} />
          ) : (
            <span>{(user.businessName || user.name || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div style={styles.profileText}>
          <h2 style={styles.userName}>{user.businessName || user.name}</h2>
          <p style={styles.userEmail}>{user.email}</p>

          <div style={styles.badgeRow}>
            {user.role === 'ADMIN' && (
              <span style={styles.adminBadge}>Admin</span>
            )}

            {isWholesale ? (
              user.approvalStatus === 'APPROVED' ? (
                <span style={styles.wholesaleApprovedBadge}>✓ Wholesale Partner</span>
              ) : (
                <span style={styles.wholesalePendingBadge}>⏳ Wholesale (Pending)</span>
              )
            ) : (
              <span style={styles.retailBadge}>Retail Customer</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={styles.navMenu}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              style={{
                ...styles.menuItem,
                backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                borderLeft: isActive ? '4px solid var(--accent-color)' : '4px solid transparent',
              }}
            >
              <span style={styles.itemIcon}>{item.icon}</span>
              <div style={styles.itemTextWrap}>
                <span
                  style={{
                    ...styles.itemLabel,
                    color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
                    fontWeight: isActive ? '700' : '500',
                  }}
                >
                  {item.label}
                </span>
                <span style={styles.itemDesc}>{item.description}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout button */}
      <div style={styles.footer}>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-outline"
          style={styles.logoutBtn}
        >
          🚪 Sign Out of Account
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  profileSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--border-color)',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileText: {
    minWidth: 0,
    flex: 1,
  },
  userName: {
    fontSize: '1.05rem',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: '700',
  },
  userEmail: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '0.35rem',
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  adminBadge: {
    fontSize: '0.65rem',
    fontWeight: '700',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  wholesaleApprovedBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  wholesalePendingBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  retailBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all var(--transition-fast)',
  },
  itemIcon: {
    fontSize: '1.25rem',
    width: '24px',
    textAlign: 'center',
  },
  itemTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  itemLabel: {
    fontSize: '0.9rem',
    display: 'block',
  },
  itemDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    display: 'block',
  },
  footer: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1rem',
    marginTop: 'auto',
  },
  logoutBtn: {
    width: '100%',
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
};

