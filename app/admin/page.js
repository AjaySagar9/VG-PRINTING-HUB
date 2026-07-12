import prisma from '@/lib/prisma';

export default async function AdminDashboard() {
  // Fetch some stats
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  
  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Dashboard</h1>
        <p style={styles.pageSubtitle}>Welcome back to your admin control panel.</p>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Products</h3>
          <p style={styles.statValue}>{productCount}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Orders</h3>
          <p style={styles.statValue}>{orderCount}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Revenue</h3>
          <p style={styles.statValue}>₹0.00</p>
        </div>
      </div>

      <div style={styles.recentOrders}>
        <h2 style={styles.sectionTitle}>Recent Orders</h2>
        <div style={styles.card}>
          {orderCount > 0 ? (
            <p>Orders will appear here.</p>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No orders found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '3rem',
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  pageSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
  },
  statTitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  recentOrders: {
    marginTop: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
  }
};
