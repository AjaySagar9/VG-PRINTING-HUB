import Link from 'next/link';

export const metadata = {
  title: "Admin Panel - PrintMine",
};

export default function AdminLayout({ children }) {
  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <Link href="/" style={styles.logo}>
            Print<span style={styles.logoAccent}>Mine</span> <span style={styles.adminBadge}>Admin</span>
          </Link>
        </div>
        <nav style={styles.nav}>
          <Link href="/admin" style={styles.navLink}>Dashboard</Link>
          <Link href="/admin/products" style={styles.navLink}>Products</Link>
          <Link href="/admin/orders" style={styles.navLink}>Orders</Link>
        </nav>
        <div style={styles.sidebarFooter}>
          <Link href="/" style={styles.backLink}>&larr; Back to Store</Link>
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
  },
  logoContainer: {
    padding: '2rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'white',
  },
  logoAccent: {
    color: 'var(--accent-color)',
  },
  adminBadge: {
    fontSize: '0.875rem',
    backgroundColor: 'var(--accent-color)',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 0',
    flex: 1,
  },
  navLink: {
    padding: '1rem 2rem',
    color: 'rgba(255,255,255,0.8)',
    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
    borderLeft: '4px solid transparent',
  },
  sidebarFooter: {
    padding: '2rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  backLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px',
    padding: '2rem 3rem',
  }
};
