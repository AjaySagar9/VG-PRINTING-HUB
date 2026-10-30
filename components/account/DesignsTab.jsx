'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';

export default function DesignsTab({ user }) {
  const router = useRouter();
  const { addItem } = useCart();

  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // View modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    design: null,
  });

  // Rename modal state
  const [renameModal, setRenameModal] = useState({
    isOpen: false,
    id: null,
    designName: '',
    submitting: false,
    error: '',
  });

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/designs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDesigns(data.designs || []);
      }
    } catch (e) {
      console.error('Fetch designs error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Add saved design directly to cart
  const handleAddToCart = (design) => {
    const isWholesale = user.role === 'WHOLESALER' && user.approvalStatus === 'APPROVED';
    const quantity = isWholesale ? 25 : 1;

    addItem({
      productId: design.productId || 'custom_design',
      name: design.productName,
      price: 499, // standard base price if standalone
      imageUrl: design.previewSnapshot || design.artworkUrl || '/navlogo.png',
      selectedColor: design.selectedColor || '#ffffff',
      selectedSize: design.selectedSize || 'L',
      quantity,
      customization: {
        hasCustomization: true,
        placement: design.placement || 'Front Center',
        customText: design.customText || '',
        textColor: design.textColor || '#ffffff',
        logoUrl: design.artworkUrl || null,
        previewSnapshot: design.previewSnapshot,
        scale: design.scale || 1.0,
        offsetY: design.offsetY || 0,
      },
    });

    setToastMessage(`Added "${design.designName}" to your cart!`);
    setTimeout(() => {
      setToastMessage('');
      router.push('/cart');
    }, 1200);
  };

  // Delete design
  const handleDeleteDesign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved design?')) {
      return;
    }

    try {
      const res = await fetch(`/api/user/designs?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete design');

      setToastMessage('Design removed from library');
      setTimeout(() => setToastMessage(''), 3000);
      fetchDesigns();
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Rename design submit
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    setRenameModal((prev) => ({ ...prev, submitting: true, error: '' }));

    try {
      const res = await fetch('/api/user/designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: renameModal.id,
          designName: renameModal.designName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename design');

      setToastMessage('Design renamed successfully!');
      setTimeout(() => setToastMessage(''), 3000);
      setRenameModal({ isOpen: false, id: null, designName: '', submitting: false, error: '' });
      fetchDesigns();
    } catch (err) {
      setRenameModal((prev) => ({ ...prev, submitting: false, error: err.message }));
    }
  };

  return (
    <div style={styles.container}>
      {toastMessage && (
        <div style={styles.toastBanner}>
          ✓ {toastMessage}
        </div>
      )}
      {errorMessage && (
        <div style={styles.errorBanner}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Header Row */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>My Saved Designs &amp; Artwork</h2>
          <p style={styles.subtitle}>
            Your personalized mockups, brand logos, and custom printing layouts saved for one-click reordering.
          </p>
        </div>

        <Link href="/products" className="btn btn-accent" style={styles.createBtn}>
          + Create New Custom Print
        </Link>
      </div>

      {/* Designs Grid */}
      {loading ? (
        <div style={styles.emptyBox}>
          <p>Loading your saved artwork and custom merchandise...</p>
        </div>
      ) : designs.length > 0 ? (
        <div style={styles.grid}>
          {designs.map((design) => (
            <div key={design.id} style={styles.designCard}>
              {/* Snapshot Preview */}
              <div
                style={styles.snapshotWrapper}
                onClick={() => setPreviewModal({ isOpen: true, design })}
                title="Click to view full preview"
              >
                <img
                  src={design.previewSnapshot || design.artworkUrl || '/navlogo.png'}
                  alt={design.designName}
                  style={styles.snapshotImg}
                />
                <div style={styles.previewOverlay}>
                  <span>🔍 View Preview</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={styles.cardBody}>
                <div style={styles.titleRow}>
                  <h3 style={styles.designTitle}>{design.designName}</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setRenameModal({
                        isOpen: true,
                        id: design.id,
                        designName: design.designName,
                        submitting: false,
                        error: '',
                      })
                    }
                    style={styles.renameBtn}
                    title="Rename this design"
                  >
                    ✏️
                  </button>
                </div>

                <p style={styles.productNameText}>{design.productName}</p>

                <div style={styles.specsList}>
                  <span style={styles.specPill}>📍 {design.placement}</span>
                  {design.selectedColor && (
                    <span style={styles.specPill}>
                      Color: <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: design.selectedColor, borderRadius: '50%', verticalAlign: 'middle', border: '1px solid #ccc' }} />
                    </span>
                  )}
                  {design.selectedSize && (
                    <span style={styles.specPill}>Size: {design.selectedSize}</span>
                  )}
                  {design.customText && (
                    <span style={styles.specPill}>Text: &ldquo;{design.customText}&rdquo;</span>
                  )}
                </div>

                <div style={styles.savedDate}>
                  Saved on {new Date(design.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>

                {/* Card Actions */}
                <div style={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(design)}
                    className="btn btn-accent"
                    style={styles.cartBtn}
                  >
                    🛒 Add to Cart
                  </button>

                  <div style={styles.subActions}>
                    {design.productId && (
                      <Link
                        href={`/products/${design.productId}`}
                        className="btn btn-outline"
                        style={styles.actionBtn}
                        title="Re-open in Product Customizer"
                      >
                        🎨 Customize
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteDesign(design.id)}
                      style={styles.deleteBtn}
                      title="Remove design"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyBox}>
          <span style={{ fontSize: '3rem' }}>🎨</span>
          <h3 style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>No saved designs yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            When you customize T-shirts, Hoodies, Caps, or Mugs in our 3D Studio, you can save your designs here for quick reordering.
          </p>
          <Link href="/products" className="btn btn-primary">
            Browse Products &amp; Design Now
          </Link>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModal.isOpen && previewModal.design && (
        <div style={styles.modalOverlay}>
          <div style={styles.previewModalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>{previewModal.design.designName}</h3>
              <button
                type="button"
                onClick={() => setPreviewModal({ isOpen: false, design: null })}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.largePreviewBox}>
              <img
                src={previewModal.design.previewSnapshot || previewModal.design.artworkUrl}
                alt={previewModal.design.designName}
                style={styles.largePreviewImg}
              />
            </div>

            <div style={styles.previewMetaBox}>
              <div><strong>Base Product:</strong> {previewModal.design.productName}</div>
              <div><strong>Placement:</strong> {previewModal.design.placement}</div>
              {previewModal.design.customText && (
                <div><strong>Custom Printed Text:</strong> &ldquo;{previewModal.design.customText}&rdquo;</div>
              )}
              {previewModal.design.artworkUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  <a
                    href={previewModal.design.artworkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    🔗 Download / View High-Res Artwork File &rarr;
                  </a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setPreviewModal({ isOpen: false, design: null });
                  handleAddToCart(previewModal.design);
                }}
                className="btn btn-accent"
                style={{ flex: 1 }}
              >
                🛒 Add this Design to Cart
              </button>
              <button
                type="button"
                onClick={() => setPreviewModal({ isOpen: false, design: null })}
                className="btn btn-outline"
                style={{ minWidth: '100px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.renameModalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>Rename Saved Design</h3>
              <button
                type="button"
                onClick={() => setRenameModal((prev) => ({ ...prev, isOpen: false }))}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            {renameModal.error && (
              <div style={{ ...styles.errorBanner, marginBottom: '1rem' }}>
                ⚠️ {renameModal.error}
              </div>
            )}

            <form onSubmit={handleRenameSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="designName">New Design Name *</label>
                <input
                  id="designName"
                  type="text"
                  required
                  autoFocus
                  className="input-field"
                  value={renameModal.designName}
                  onChange={(e) => setRenameModal((prev) => ({ ...prev, designName: e.target.value }))}
                  placeholder="e.g., Annual Tech Fest 2026 Black Tee"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setRenameModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameModal.submitting}
                  className="btn btn-accent"
                >
                  {renameModal.submitting ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  toastBanner: {
    padding: '12px 16px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  createBtn: {
    padding: '8px 18px',
    fontSize: '0.85rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  designCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  snapshotWrapper: {
    height: '220px',
    backgroundColor: '#f8fafc',
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  snapshotImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    transition: 'transform 0.2s ease',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  cardBody: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  designTitle: {
    fontSize: '1.05rem',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  renameBtn: {
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  productNameText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
  },
  specsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginBottom: '0.75rem',
  },
  specPill: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  savedDate: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginBottom: '1rem',
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.85rem',
  },
  cartBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    width: '100%',
  },
  subActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionBtn: {
    flex: 1,
    padding: '6px 12px',
    fontSize: '0.8rem',
  },
  deleteBtn: {
    padding: '6px 10px',
    fontSize: '0.8rem',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#fff5f5',
    cursor: 'pointer',
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '3.5rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  previewModalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '560px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
  },
  renameModalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '420px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  closeBtn: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  largePreviewBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    textAlign: 'center',
    maxHeight: '380px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largePreviewImg: {
    maxWidth: '100%',
    maxHeight: '340px',
    objectFit: 'contain',
  },
  previewMetaBox: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    marginTop: '1rem',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
};

