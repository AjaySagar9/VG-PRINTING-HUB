import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let productCount = 0;
  let orderCount = 0;
  let totalWholesalers = 0;
  let pendingWholesalers = 0;
  let pendingList = [];

  try {
    productCount = await prisma.product.count();
    orderCount = await prisma.order.count();
    totalWholesalers = await prisma.user.count({ where: { role: 'WHOLESALER' } });
    pendingWholesalers = await prisma.user.count({ where: { role: 'WHOLESALER', approvalStatus: 'PENDING' } });

    pendingList = await prisma.user.findMany({
      where: { role: 'WHOLESALER', approvalStatus: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        businessName: true,
        businessType: true,
        email: true,
        mobile: true,
        createdAt: true,
      }
    });
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err.message);
  }

  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={styles.pageTitle}>Admin Dashboard</h1>
            <p style={styles.pageSubtitle}>Welcome back to your VG Printing Hub control panel.</p>
          </div>
          <Link href="/admin/wholesalers" className="btn btn-accent" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Manage Wholesalers ({pendingWholesalers} Pending)
          </Link>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Pending Wholesale Approvals</h3>
          <p style={{ ...styles.statValue, color: pendingWholesalers > 0 ? 'var(--accent-color)' : 'var(--text-primary)' }}>
            {pendingWholesalers}
          </p>
          <Link href="/admin/wholesalers?status=PENDING" style={styles.statLink}>
            Review applications &rarr;
          </Link>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Wholesalers</h3>
          <p style={styles.statValue}>{totalWholesalers}</p>
          <Link href="/admin/wholesalers" style={styles.statLink}>
            View directory &rarr;
          </Link>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Products</h3>
          <p style={styles.statValue}>{productCount}</p>
          <Link href="/admin/products" style={styles.statLink}>
            Manage products &rarr;
          </Link>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Orders</h3>
          <p style={styles.statValue}>{orderCount}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            Revenue: ₹0.00
          </p>
        </div>
      </div>

      {/* Pending Wholesale Applications Queue */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={styles.sectionTitle}>Wholesale Partner Applications Awaiting Review</h2>
          <Link href="/admin/wholesalers" style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: '500' }}>
            View All ({totalWholesalers}) &rarr;
          </Link>
        </div>

        <div style={styles.card}>
          {pendingList.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Business Name</th>
                    <th style={styles.th}>Contact Person</th>
                    <th style={styles.th}>Business Type</th>
                    <th style={styles.th}>Email / Mobile</th>
                    <th style={styles.th}>Applied Date</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((user) => (
                    <tr key={user.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{user.businessName || 'N/A'}</td>
                      <td style={styles.td}>{user.name}</td>
                      <td style={styles.td}>{user.businessType || 'General'}</td>
                      <td style={styles.td}>
                        <div>{user.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+91 {user.mobile}</div>
                      </td>
                      <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <Link
                          href="/admin/wholesalers"
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          Review &amp; Approve
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2rem' }}>✓</span>
              <p style={{ marginTop: '0.5rem' }}>All wholesale applications are up to date! No pending approvals.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div style={styles.recentOrders}>
        <h2 style={styles.sectionTitle}>Recent Orders</h2>
        <div style={styles.card}>
          {orderCount > 0 ? (
            <p>Orders will appear here.</p>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No orders placed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '2.5rem',
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.25rem',
    color: 'var(--text-primary)',
  },
  pageSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.75rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
  },
  statTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  statLink: {
    fontSize: '0.85rem',
    color: 'var(--accent-color)',
    marginTop: '0.75rem',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: '1.35rem',
    fontWeight: '600',
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
  },
  td: {
    padding: '1rem 1.25rem',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  recentOrders: {
    marginTop: '2rem',
  }
};
