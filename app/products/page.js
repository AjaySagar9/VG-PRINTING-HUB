'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function ProductsPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewerInfo, setViewerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, debouncedSearch, sortBy, currentPage, user]);

  const fetchCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (sortBy) {
        params.set('sort', sortBy);
      }
      params.set('page', currentPage.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();

      setProducts(data.products || []);
      if (data.categories) setCategories(data.categories);
      if (data.pagination) setPagination(data.pagination);
      setViewerInfo(data.viewer || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load catalog. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const isApprovedWholesaler = viewerInfo?.isApprovedWholesaler;

  return (
    <div style={styles.page}>
      <div className="container">
        
        {/* Header & Title */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Custom Merchandise &amp; Print Catalog</h1>
            <p style={styles.subtitle}>
              Customized corporate gifting, branded apparel, awards, and stationery. Fast fulfillment across India.
            </p>
          </div>

          {/* Wholesale Status Indicator */}
          {user?.role === 'WHOLESALER' ? (
            isApprovedWholesaler ? (
              <div style={styles.approvedPill}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <div>
                  <strong>Approved Wholesale Pricing Active</strong>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Direct Factory Tier Rates Unlocked</div>
                </div>
              </div>
            ) : (
              <div style={styles.pendingPill}>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                <div>
                  <strong>Wholesale Account: Pending Review</strong>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Application under admin verification</div>
                </div>
              </div>
            )
          ) : (
            <Link href="/signup" style={styles.b2bPromoBox}>
              <span style={{ fontSize: '1.5rem' }}>🏢</span>
              <div>
                <strong style={{ color: 'var(--accent-color)' }}>Wholesale &amp; Bulk Printing</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Register for exclusive B2B wholesale rates &rarr;
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Filter Bar: Search, Category Pills, Sort */}
        <div style={styles.filterBar}>
          {/* Search Input */}
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search t-shirts, hoodies, pens, joining kits, mugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={styles.sortWrapper}>
            <label style={styles.sortLabel}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              style={styles.sortSelect}
            >
              <option value="featured">Featured Picks</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={styles.categoryPills}>
          <button
            type="button"
            onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
            style={{
              ...styles.catPill,
              ...(selectedCategory === 'all' ? styles.catPillActive : styles.catPillInactive)
            }}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
              style={{
                ...styles.catPill,
                ...(selectedCategory === cat.slug ? styles.catPillActive : styles.catPillInactive)
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Active Wholesale Notice */}
        {isApprovedWholesaler && (
          <div style={styles.wholesaleNoticeBanner}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <div>
              <strong>Wholesale Partner Privileges Active:</strong> You are viewing direct B2B volume prices. 
              Orders with minimum batch sizes qualify for wholesale billing and custom artwork placement.
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading catalog items...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
            <button onClick={fetchCatalog} className="btn btn-outline" style={{ marginTop: '1rem' }}>
              Try Again
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div style={styles.grid}>
            {products.map((product) => {
              const hasWholesalePrice = isApprovedWholesaler && product.wholesalePrice;

              return (
                <div key={product.id} style={styles.productCard}>
                  {/* Image & Badges */}
                  <div style={styles.imageWrapper}>
                    <img
                      src={product.imageUrl || (product.images && product.images[0]) || '/navlogo.png'}
                      alt={product.name}
                      style={styles.productImage}
                    />
                    {product.badge && (
                      <span style={styles.badgeTopLeft}>{product.badge}</span>
                    )}
                    {product.discountPercent > 0 && !hasWholesalePrice && (
                      <span style={styles.badgeTopRight}>-{product.discountPercent}%</span>
                    )}
                  </div>

                  {/* Body */}
                  <div style={styles.cardBody}>
                    <div style={styles.categoryName}>
                      {product.category?.name || 'Custom Print'}
                    </div>

                    <Link href={`/products/${product.id}`} style={styles.productTitleLink}>
                      <h3 style={styles.productTitle}>{product.name}</h3>
                    </Link>

                    {/* Rating */}
                    <div style={styles.ratingRow}>
                      <span style={{ color: '#f59e0b' }}>★★★★★</span>
                      <span style={styles.ratingNum}>{product.rating || 4.8}</span>
                      <span style={styles.reviewCount}>({product.ratingCount || 50})</span>
                    </div>

                    <p style={styles.productDesc}>{product.description}</p>

                    {/* MOQ info */}
                    <div style={styles.moqRow}>
                      <span>
                        📦 {hasWholesalePrice ? `Wholesale MOQ: ${product.wholesaleMoq || 20} pcs` : `MOQ: ${product.moq || 1} pc`}
                      </span>
                      {product.customizable && (
                        <span style={styles.customizablePill}>🎨 Customizable</span>
                      )}
                    </div>

                    {/* Pricing Display */}
                    <div style={styles.pricingSection}>
                      {hasWholesalePrice ? (
                        <div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={styles.wholesaleBadge}>WHOLESALE B2B</span>
                            {product.wholesaleSavingsPercent && (
                              <span style={styles.savingsPill}>Save {product.wholesaleSavingsPercent}%</span>
                            )}
                          </div>
                          <div style={styles.priceRow}>
                            <span style={styles.wholesalePriceText}>₹{product.wholesalePrice}</span>
                            <span style={styles.retailStrikethrough}>₹{product.price}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.priceRow}>
                          <span style={styles.retailPriceText}>₹{product.price}</span>
                          <span style={styles.perUnitText}>/ unit</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <Link
                      href={`/products/${product.id}`}
                      className="btn btn-primary"
                      style={styles.cardActionBtn}
                    >
                      {product.customizable ? 'Customize & Order' : 'View Product'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div style={styles.emptyBox}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>No products match your criteria</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Try searching with different keywords or clear the category filters.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="btn btn-accent"
              style={{ marginTop: '1.25rem' }}
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div style={styles.paginationRow}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              &larr; Previous
            </button>
            <span style={styles.pageIndicator}>
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '3rem 0 5rem',
    backgroundColor: 'var(--bg-secondary)',
    minHeight: '85vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  title: {
    fontSize: '2.5rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    maxWidth: '650px',
  },
  approvedPill: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    padding: '0.75rem 1.25rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: 'var(--shadow-sm)',
  },
  pendingPill: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    padding: '0.75rem 1.25rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: 'var(--shadow-sm)',
  },
  b2bPromoBox: {
    backgroundColor: 'white',
    border: '1px solid var(--border-color)',
    padding: '0.75rem 1.25rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: 'var(--shadow-sm)',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)',
    fontSize: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '12px 38px 12px 42px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    boxShadow: 'var(--shadow-sm)',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-tertiary)',
    fontSize: '0.85rem',
  },
  sortWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sortLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  sortSelect: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },
  categoryPills: {
    display: 'flex',
    gap: '0.6rem',
    overflowX: 'auto',
    paddingBottom: '0.75rem',
    marginBottom: '1.75rem',
  },
  catPill: {
    padding: '8px 18px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.875rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  catPillActive: {
    backgroundColor: 'var(--text-primary)',
    color: 'white',
    border: '1px solid var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  catPillInactive: {
    backgroundColor: 'white',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  wholesaleNoticeBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    color: '#065f46',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2rem',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
    gap: '2rem',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '240px',
    backgroundColor: 'var(--bg-tertiary)',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  badgeTopRight: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  cardBody: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  categoryName: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.25rem',
  },
  productTitleLink: {
    color: 'inherit',
  },
  productTitle: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
    lineHeight: 1.3,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.8rem',
    marginBottom: '0.5rem',
  },
  ratingNum: {
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  reviewCount: {
    color: 'var(--text-tertiary)',
  },
  productDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    lineHeight: 1.4,
    marginBottom: '0.75rem',
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  moqRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed var(--border-color)',
  },
  customizablePill: {
    color: 'var(--accent-color)',
    fontWeight: '600',
  },
  pricingSection: {
    paddingTop: '0.5rem',
    marginBottom: '1rem',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  retailPriceText: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  wholesalePriceText: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#059669',
  },
  retailStrikethrough: {
    fontSize: '0.9rem',
    color: 'var(--text-tertiary)',
    textDecoration: 'line-through',
  },
  perUnitText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  wholesaleBadge: {
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  savingsPill: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  cardActionBtn: {
    width: '100%',
    textAlign: 'center',
    padding: '10px',
    fontSize: '0.9rem',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '5rem',
  },
  spinner: {
    display: 'inline-block',
    width: '36px',
    height: '36px',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-color)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '2rem',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '4rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '3rem',
  },
  pageIndicator: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  }
};
