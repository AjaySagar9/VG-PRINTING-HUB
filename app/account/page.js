'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import AccountSidebar from '@/components/account/AccountSidebar';
import ProfileTab from '@/components/account/ProfileTab';
import OrdersTab from '@/components/account/OrdersTab';
import AddressesTab from '@/components/account/AddressesTab';
import DesignsTab from '@/components/account/DesignsTab';
import WholesaleTab from '@/components/account/WholesaleTab';
import SecurityTab from '@/components/account/SecurityTab';

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout, refreshUser } = useAuth();

  const tabParam = searchParams.get('tab');
  const [tabState, setTabState] = useState(null);
  const activeTab = tabState || tabParam || 'profile';

  const [profileOverride, setProfileOverride] = useState(null);
  const localUser = profileOverride || user;

  // Auth Protection: redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, loading, router]);

  const handleSelectTab = (tabId) => {
    setTabState(tabId);
    router.replace(`/account?tab=${tabId}`, { scroll: false });
  };

  const handleProfileUpdated = (updatedUser) => {
    setProfileOverride(updatedUser);
    if (refreshUser) {
      refreshUser();
    }
  };

  if (loading || !user || !localUser) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingSpinner}>⚙️</div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
          Loading your customer dashboard and order history...
        </p>
      </div>
    );
  }

  const isWholesale = localUser.role === 'WHOLESALER';

  return (
    <div style={styles.page}>
      <div className="container">
        {/* Breadcrumbs */}
        <div style={styles.breadcrumbs}>
          <Link href="/">Home</Link> &gt; <span>My Account</span> &gt;{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: '600', textTransform: 'capitalize' }}>
            {activeTab}
          </span>
        </div>

        {/* Mobile Navigation Tabs (visible only on small screens) */}
        <div style={styles.mobileTabNav}>
          <button
            type="button"
            onClick={() => handleSelectTab('profile')}
            style={{
              ...styles.mobileTabBtn,
              borderBottom: activeTab === 'profile' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'profile' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'profile' ? '700' : '500',
            }}
          >
            👤 Profile
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('orders')}
            style={{
              ...styles.mobileTabBtn,
              borderBottom: activeTab === 'orders' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'orders' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'orders' ? '700' : '500',
            }}
          >
            📦 Orders
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('addresses')}
            style={{
              ...styles.mobileTabBtn,
              borderBottom: activeTab === 'addresses' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'addresses' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'addresses' ? '700' : '500',
            }}
          >
            📍 Addresses
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab('designs')}
            style={{
              ...styles.mobileTabBtn,
              borderBottom: activeTab === 'designs' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'designs' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'designs' ? '700' : '500',
            }}
          >
            🎨 Designs
          </button>
          {isWholesale && (
            <button
              type="button"
              onClick={() => handleSelectTab('wholesale')}
              style={{
                ...styles.mobileTabBtn,
                borderBottom: activeTab === 'wholesale' ? '2px solid var(--accent-color)' : '2px solid transparent',
                color: activeTab === 'wholesale' ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'wholesale' ? '700' : '500',
              }}
            >
              🏢 Wholesale
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSelectTab('security')}
            style={{
              ...styles.mobileTabBtn,
              borderBottom: activeTab === 'security' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'security' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'security' ? '700' : '500',
            }}
          >
            🔒 Security
          </button>
        </div>

        {/* Dashboard 2-Column Grid */}
        <div style={styles.dashboardGrid}>
          {/* Desktop Left Sidebar */}
          <div style={styles.sidebarColumn}>
            <AccountSidebar
              user={localUser}
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              onLogout={logout}
            />
          </div>

          {/* Main Content Area */}
          <main style={styles.contentColumn}>
            {activeTab === 'profile' && (
              <ProfileTab
                user={localUser}
                onProfileUpdated={handleProfileUpdated}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab />
            )}

            {activeTab === 'addresses' && (
              <AddressesTab user={localUser} />
            )}

            {activeTab === 'designs' && (
              <DesignsTab user={localUser} />
            )}

            {activeTab === 'wholesale' && isWholesale && (
              <WholesaleTab
                user={localUser}
                onProfileUpdated={handleProfileUpdated}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                user={localUser}
                onProfileUpdated={handleProfileUpdated}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.loadingPage}>
          <div style={styles.loadingSpinner}>⚙️</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Loading Account Dashboard...
          </p>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

const styles = {
  page: {
    padding: '2rem 0 5rem',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  loadingPage: {
    padding: '8rem 1rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    fontSize: '2.5rem',
    animation: 'spin 1.5s linear infinite',
  },
  breadcrumbs: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  mobileTabNav: {
    display: 'none',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    backgroundColor: 'white',
    borderRadius: 'var(--radius-md)',
    padding: '4px 8px',
    border: '1px solid var(--border-color)',
    marginBottom: '1.5rem',
    gap: '0.5rem',
  },
  mobileTabBtn: {
    padding: '8px 14px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  sidebarColumn: {
    position: 'sticky',
    top: '90px',
  },
  contentColumn: {
    minWidth: 0,
  },
};
