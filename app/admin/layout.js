import Link from 'next/link';

export const metadata = {
  title: "Admin Panel - VG Printing Hub",
};

export default function AdminLayout({ children }) {
  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <Link href="/admin" style={styles.logo}>
            VG Printing <span style={styles.logoAccent}>Hub</span> <span style={styles.adminBadge}>Admin</span>
          </Link>
        </div>
        <nav style={styles.nav}>
          <Link href="/admin" style={styles.navLink}>📊 Dashboard</Link>
          <Link href="/admin/wholesalers" style={styles.navLink}>🏢 Wholesalers</Link>
          <Link href="/admin/products" style={styles.navLink}>🖨️ Products</Link>
          <Link href="/admin/orders" style={styles.navLink}>📦 Orders</Link>
        </nav>
        <div style={styles.sidebarFooter}>
          <Link href="/" style={styles.backLink}>&larr; Back to Storefront</Link>
        </div>
      </aside>
      <main style={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-secondary)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--text-primary)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  logoContainer: {
    padding: '1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
  },
  logoAccent: {
    color: 'var(--accent-color)',
  },
  adminBadge: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--accent-color)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 0',
    flex: 1,
  },
  navLink: {
    padding: '0.9rem 1.5rem',
    color: 'rgba(255,255,255,0.8)',
    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sidebarFooter: {
    padding: '1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  backLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    padding: '2.5rem 3rem',
    minHeight: '100vh',
  }
};
