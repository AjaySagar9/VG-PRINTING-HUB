import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  let categories = [];
  try {
    categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  } catch (err) {
    console.warn('Categories query error:', err.message);
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <header style={styles.header}>
          <h1 style={styles.title}>Browse by Product Category</h1>
          <p style={styles.subtitle}>
            Explore our custom printing categories — tailored for corporate uniforms, marketing events, employee kits, and executive gifts.
          </p>
        </header>

        <div style={styles.grid}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              style={styles.categoryCard}
            >
              <div style={styles.imageWrapper}>
                <img
                  src={cat.imageUrl || '/navlogo.png'}
                  alt={cat.name}
                  style={styles.catImage}
                />
                <div style={styles.overlay} />
                <span style={styles.itemCountBadge}>
                  {cat._count?.products || 0} Products
                </span>
              </div>
              <div style={styles.cardContent}>
                <h3 style={styles.categoryName}>{cat.name}</h3>
                <span style={styles.exploreLink}>Explore Category &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '3.5rem 0 5rem',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  header: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 3rem',
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '2rem',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
    cursor: 'pointer',
  },
  imageWrapper: {
    position: 'relative',
    height: '220px',
    backgroundColor: 'var(--bg-tertiary)',
    overflow: 'hidden',
  },
  catImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)',
  },
  itemCountBadge: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
  },
  cardContent: {
    padding: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
  },
  exploreLink: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--accent-color)',
  }
};
