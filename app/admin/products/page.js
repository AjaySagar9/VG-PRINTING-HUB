import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSubtitle}>Manage your store's products</p>
        </div>
        <button className="btn btn-primary">Add New Product</button>
      </header>

      <div style={styles.card}>
        {products.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Date Added</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={styles.tr}>
                  <td style={styles.td}>{product.name}</td>
                  <td style={styles.td}>₹{product.price}</td>
                  <td style={styles.td}>{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <button style={styles.actionBtn}>Edit</button>
                    <button style={{...styles.actionBtn, color: 'var(--accent-color)'}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <p>No products found. Add your first product to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  th: {
    textAlign: 'left',
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    backgroundColor: 'var(--bg-secondary)',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '1.5rem',
    color: 'var(--text-primary)',
  },
  actionBtn: {
    marginRight: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    fontSize: '0.875rem',
  },
  emptyState: {
    padding: '4rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  }
};
