import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function Home() {
  // Fetch some products for featured section (mock query if db is empty)
  const products = await prisma.product.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' }
  });

  const featuredProducts = products.length > 0 ? products : [
    { id: '1', name: 'Custom Corporate T-Shirt', price: 499, description: 'High quality cotton' },
    { id: '2', name: 'Personalized Mug', price: 299, description: 'Ceramic 300ml' },
    { id: '3', name: 'Engraved Metal Pen', price: 199, description: 'Smooth ink' },
    { id: '4', name: 'Magnetic Badge', price: 99, description: 'Custom printed' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container">
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>Premium Custom Corporate Gifts</h1>
            <p style={styles.heroSubtitle}>
              Elevate your brand with high-quality, print-on-demand personalized items. 
              Fast shipping and secure payments.
            </p>
            <div style={styles.heroActions}>
              <Link href="/products" className="btn btn-accent" style={styles.heroBtn}>
                Shop Now
              </Link>
              <Link href="/categories" className="btn btn-outline" style={{...styles.heroBtn, backgroundColor: 'white'}}>
                Explore Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={styles.section}>
        <div className="container">
          <h2 style={styles.sectionTitle}>Featured Products</h2>
          <div style={styles.grid}>
            {featuredProducts.map((product) => (
              <div key={product.id} style={styles.productCard}>
                <div style={styles.productImagePlaceholder}>
                  <span>Image for {product.name}</span>
                </div>
                <div style={styles.productInfo}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productPrice}>₹{product.price}</p>
                  <Link href={`/products/${product.id}`} className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section style={{...styles.section, backgroundColor: 'var(--bg-tertiary)'}}>
        <div className="container">
          <div style={styles.grid3}>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>Fast Delivery</h3>
              <p style={styles.valueDesc}>Get your custom prints delivered quickly across India.</p>
            </div>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>Best Quality</h3>
              <p style={styles.valueDesc}>We use premium materials and high-end printing technology.</p>
            </div>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>Secure Payments</h3>
              <p style={styles.valueDesc}>100% safe and secure checkout process.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '6rem 0',
    textAlign: 'center',
    backgroundImage: 'linear-gradient(to right bottom, #fff, #f0f3f5)',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '3.5rem',
    marginBottom: '1.5rem',
    color: 'var(--text-primary)',
    letterSpacing: '-1px',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    marginBottom: '2.5rem',
    lineHeight: 1.6,
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  heroBtn: {
    padding: '16px 32px',
    fontSize: '1.125rem',
  },
  section: {
    padding: '5rem 0',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '2.5rem',
    marginBottom: '3rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '2rem',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
    cursor: 'pointer',
  },
  productImagePlaceholder: {
    height: '250px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-tertiary)',
  },
  productInfo: {
    padding: '1.5rem',
  },
  productName: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
  },
  productPrice: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--accent-color)',
  },
  valueCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  valueTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  valueDesc: {
    color: 'var(--text-secondary)',
  }
};
