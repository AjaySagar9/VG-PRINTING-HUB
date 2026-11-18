'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const PRESET_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const PRESET_PLACEMENTS = ['Front Chest', 'Back Full', 'Left Chest Pocket', 'Right Sleeve', 'Left Sleeve', 'Back Collar'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    price: '',
    wholesalePrice: '',
    imageUrl: '',
    images: [],
    moq: 1,
    wholesaleMoq: 20,
    stock: 500,
    badge: '',
    customizable: true,
    colors: [],
    disabledColors: [],
    colorImages: {},
    sizes: [],
    placements: [],
    pricingTiers: [],
  });

  // Color input scratch
  const [newColorHex, setNewColorHex] = useState('#1e3a8a');
  const [newPlacementText, setNewPlacementText] = useState('');

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  const fetchAdminProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch admin products');
      }
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      categoryId: categories[0]?.id || '',
      description: '',
      price: '',
      wholesalePrice: '',
      imageUrl: '',
      images: [],
      moq: 1,
      wholesaleMoq: 20,
      stock: 500,
      badge: '',
      customizable: true,
      colors: ['#ffffff', '#1a1a1a', '#1e3a8a'],
      disabledColors: [],
      colorImages: {},
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      placements: ['Front Chest', 'Back Full', 'Left Chest Pocket'],
      pricingTiers: [
        { minQty: 1, maxQty: 9, price: 500, wholesalePrice: 350 },
        { minQty: 10, maxQty: 49, price: 450, wholesalePrice: 300 },
        { minQty: 50, maxQty: 99, price: 400, wholesalePrice: 270 },
        { minQty: 100, maxQty: null, price: 350, wholesalePrice: 240 },
      ],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    let parsedTiers = [];
    if (prod.pricingTiers) {
      try {
        parsedTiers = typeof prod.pricingTiers === 'string' ? JSON.parse(prod.pricingTiers) : prod.pricingTiers;
      } catch (e) {
        parsedTiers = [];
      }
    }

    let parsedColorImgs = {};
    if (prod.colorImages) {
      try {
        parsedColorImgs = typeof prod.colorImages === 'string' ? JSON.parse(prod.colorImages) : prod.colorImages;
      } catch (e) {
        parsedColorImgs = {};
      }
    }

    setFormData({
      name: prod.name || '',
      slug: prod.slug || '',
      categoryId: prod.categoryId || '',
      description: prod.description || '',
      price: prod.price || '',
      wholesalePrice: prod.wholesalePrice || '',
      imageUrl: prod.imageUrl || '',
      images: prod.images || [],
      moq: prod.moq || 1,
      wholesaleMoq: prod.wholesaleMoq || 20,
      stock: prod.stock != null ? prod.stock : 500,
      badge: prod.badge || '',
      customizable: prod.customizable !== false,
      colors: prod.colors || [],
      disabledColors: prod.disabledColors || [],
      colorImages: parsedColorImgs,
      sizes: prod.sizes || [],
      placements: prod.placements || [],
      pricingTiers: parsedTiers,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.price) {
      setFormError('Product name and retail price are required.');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const payload = editingProduct ? { id: editingProduct.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      await fetchAdminProducts();
    } catch (err) {
      setFormError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      await fetchAdminProducts();
    } catch (err) {
      alert(err.message || 'Error deleting product');
    }
  };

  // Color management
  const addColor = () => {
    if (!formData.colors.includes(newColorHex)) {
      setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, newColorHex],
      }));
    }
  };

  const removeColor = (color) => {
    setFormData((prev) => {
      const nextColors = prev.colors.filter((c) => c !== color);
      const nextDisabled = prev.disabledColors.filter((c) => c !== color);
      const nextColorImages = { ...prev.colorImages };
      delete nextColorImages[color];
      return {
        ...prev,
        colors: nextColors,
        disabledColors: nextDisabled,
        colorImages: nextColorImages,
      };
    });
  };

  const toggleColorDisabled = (color) => {
    setFormData((prev) => {
      const isAlreadyDisabled = prev.disabledColors.includes(color);
      const nextDisabled = isAlreadyDisabled
        ? prev.disabledColors.filter((c) => c !== color)
        : [...prev.disabledColors, color];
      return { ...prev, disabledColors: nextDisabled };
    });
  };

  const updateColorImage = (color, url) => {
    setFormData((prev) => ({
      ...prev,
      colorImages: {
        ...prev.colorImages,
        [color]: url,
      },
    }));
  };

  // Size toggle
  const toggleSize = (size) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(size);
      const nextSizes = exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size];
      return { ...prev, sizes: nextSizes };
    });
  };

  // Placement management
  const togglePlacement = (placement) => {
    setFormData((prev) => {
      const exists = prev.placements.includes(placement);
      const nextPlacements = exists
        ? prev.placements.filter((p) => p !== placement)
        : [...prev.placements, placement];
      return { ...prev, placements: nextPlacements };
    });
  };

  const addCustomPlacement = () => {
    if (newPlacementText.trim() && !formData.placements.includes(newPlacementText.trim())) {
      setFormData((prev) => ({
        ...prev,
        placements: [...prev.placements, newPlacementText.trim()],
      }));
      setNewPlacementText('');
    }
  };

  // Pricing tier management
  const addTierSlab = () => {
    const lastTier = formData.pricingTiers[formData.pricingTiers.length - 1];
    const newMin = lastTier ? (Number(lastTier.maxQty) || Number(lastTier.minQty) * 2) + 1 : 1;
    const newTier = {
      minQty: newMin,
      maxQty: null,
      price: formData.price ? Math.round(formData.price * 0.85) : 400,
      wholesalePrice: formData.wholesalePrice ? Math.round(formData.wholesalePrice * 0.85) : 250,
    };
    setFormData((prev) => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, newTier],
    }));
  };

  const updateTierField = (idx, field, value) => {
    setFormData((prev) => {
      const nextTiers = [...prev.pricingTiers];
      nextTiers[idx] = {
        ...nextTiers[idx],
        [field]: value === '' ? null : Number(value),
      };
      return { ...prev, pricingTiers: nextTiers };
    });
  };

  const removeTier = (idx) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== idx),
    }));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Product Management &amp; Configuration</h1>
          <p style={styles.pageSubtitle}>
            Configure colors, color-specific images, size matrices, MOQs, customization positions, and dynamic pricing tiers.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ fontWeight: '700' }}>
          + Add New Product
        </button>
      </header>

      {/* Filter / Search Bar */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 Search catalog products by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ maxWidth: '420px', padding: '10px 14px' }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredProducts.length}</strong> of {products.length} products
        </span>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Catalog Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading products catalog...
          </div>
        ) : filteredProducts.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Retail Price / MOQ</th>
                <th style={styles.th}>Wholesale Price / MOQ</th>
                <th style={styles.th}>Colors &amp; Sizes</th>
                <th style={styles.th}>Pricing Tiers</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                let tiersCount = 0;
                try {
                  const t = typeof product.pricingTiers === 'string' ? JSON.parse(product.pricingTiers) : product.pricingTiers;
                  tiersCount = Array.isArray(t) ? t.length : 0;
                } catch (e) {
                  tiersCount = 0;
                }

                return (
                  <tr key={product.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={product.imageUrl || '/navlogo.png'}
                          alt={product.name}
                          style={styles.tableThumb}
                        />
                        <div>
                          <strong>{product.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Stock: {product.stock} units • {product.customizable ? '🎨 Customizable' : 'Standard'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{product.category?.name || 'General'}</td>
                    <td style={styles.td}>
                      <strong>₹{product.price}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        MOQ: {product.moq || 1} unit(s)
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: '#059669' }}>
                      {product.wholesalePrice ? (
                        <div>
                          <strong>₹{product.wholesalePrice}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#065f46' }}>
                            MOQ: {product.wholesaleMoq || 20} units
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>Not set</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>{product.colors?.length || 0} colors ({product.disabledColors?.length || 0} disabled)</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{product.sizes?.length || 0} sizes available</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {tiersCount > 0 ? (
                        <span style={styles.tierCountBadge}>
                          ⚡ {tiersCount} Volume Tiers
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No tiers</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          style={styles.deleteBtn}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <p>No products matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* FULL PRODUCT CONFIGURATION MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Catalog Product'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={styles.formErrorBanner}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={styles.formGrid}>
              
              {/* SECTION 1: GENERAL INFO */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>1. General Product Details</h3>
                <div style={styles.formRow}>
                  <div style={{ flex: 2 }}>
                    <label style={styles.label}>Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div style={{ ...styles.formRow, marginTop: '0.75rem' }}>
                  <div style={{ flex: 2 }}>
                    <label style={styles.label}>Main Photo URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="input-field"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Badge / Tag</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. Bestseller, New"
                      className="input-field"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: BASE PRICING & MOQS */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>2. Base Pricing &amp; Minimum Order Quantities (MOQ)</h3>
                <div style={styles.formRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Retail Unit Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Retail MOQ (Pieces)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Wholesale Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Wholesale MOQ (Pieces)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.wholesaleMoq}
                      onChange={(e) => setFormData({ ...formData, wholesaleMoq: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: COLORS & COLOR-SPECIFIC IMAGES */}
              <div style={styles.formSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={styles.sectionTitle}>3. Product Colors &amp; Dynamic Images</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      style={{ width: '36px', height: '32px', cursor: 'pointer', border: 'none', background: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      + Add Color
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {formData.colors.map((color) => {
                    const isDisabled = formData.disabledColors.includes(color);
                    const colorImg = formData.colorImages[color] || '';

                    return (
                      <div key={color} style={styles.colorConfigRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '130px' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: color,
                              border: '1px solid #ccc',
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{color}</span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <input
                            type="url"
                            placeholder="Color image URL (https://...)"
                            value={colorImg}
                            onChange={(e) => updateColorImage(color, e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleColorDisabled(color)}
                          style={{
                            ...styles.stockToggleBtn,
                            backgroundColor: isDisabled ? '#fef2f2' : '#f0fdf4',
                            color: isDisabled ? '#dc2626' : '#15803d',
                            borderColor: isDisabled ? '#fecaca' : '#bbf7d0',
                          }}
                        >
                          {isDisabled ? '✕ Out of Stock' : '✓ In Stock'}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          style={styles.removeColorBtn}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: SIZES & CUSTOMIZATION POSITIONS */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>4. Available Sizes &amp; Customization Zones</h3>
                
                {/* Sizes */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={styles.label}>Select Available Sizes for this Product</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '4px' }}>
                    {PRESET_SIZES.map((sz) => {
                      const isSelected = formData.sizes.includes(sz);
                      return (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => toggleSize(sz)}
                          style={{
                            ...styles.tagBtn,
                            backgroundColor: isSelected ? 'var(--text-primary)' : 'white',
                            color: isSelected ? 'white' : 'var(--text-secondary)',
                          }}
                        >
                          {sz} {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Placements */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.label}>Supported Customization Imprint Positions</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        placeholder="Custom zone..."
                        value={newPlacementText}
                        onChange={(e) => setNewPlacementText(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <button
                        type="button"
                        onClick={addCustomPlacement}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '6px' }}>
                    {PRESET_PLACEMENTS.map((p) => {
                      const isSelected = formData.placements.includes(p);
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => togglePlacement(p)}
                          style={{
                            ...styles.tagBtn,
                            backgroundColor: isSelected ? 'var(--accent-color)' : 'white',
                            color: isSelected ? 'white' : 'var(--text-secondary)',
                          }}
                        >
                          {p} {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 5: QUANTITY-BASED DYNAMIC PRICING TIERS */}
              <div style={styles.formSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={styles.sectionTitle}>5. Quantity-Based Dynamic Pricing Tiers</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Configure volume tier discounts for retail and wholesale customers (e.g. 1-9, 10-49, 50-99, 100+).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTierSlab}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    + Add Pricing Slab
                  </button>
                </div>

                {formData.pricingTiers.length > 0 ? (
                  <div style={styles.tierAdminTable}>
                    <div style={styles.tierAdminHead}>
                      <span>Min Qty</span>
                      <span>Max Qty (Empty for +)</span>
                      <span>Retail Price (₹)</span>
                      <span>Wholesale Price (₹)</span>
                      <span>Action</span>
                    </div>

                    {formData.pricingTiers.map((tier, idx) => (
                      <div key={idx} style={styles.tierAdminRow}>
                        <input
                          type="number"
                          min="1"
                          value={tier.minQty}
                          onChange={(e) => updateTierField(idx, 'minQty', e.target.value)}
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                        />
                        <input
                          type="number"
                          placeholder="Infinity (e.g. 100+)"
                          value={tier.maxQty == null ? '' : tier.maxQty}
                          onChange={(e) => updateTierField(idx, 'maxQty', e.target.value)}
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                        />
                        <input
                          type="number"
                          min="0"
                          value={tier.price}
                          onChange={(e) => updateTierField(idx, 'price', e.target.value)}
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                        />
                        <input
                          type="number"
                          min="0"
                          value={tier.wholesalePrice || ''}
                          onChange={(e) => updateTierField(idx, 'wholesalePrice', e.target.value)}
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    No volume pricing tiers configured. Base price will apply to all quantities.
                  </div>
                )}
              </div>

              {/* MODAL ACTIONS */}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-accent"
                  style={{ flex: 1.5, fontWeight: '700' }}
                >
                  {saving ? 'Saving Product...' : editingProduct ? '✓ Update Product' : '+ Create Product'}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '0.25rem',
  },
  pageSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  searchBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1.5rem',
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
    padding: '1.25rem',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    backgroundColor: 'var(--bg-secondary)',
    fontSize: '0.85rem',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
  },
  td: {
    padding: '1.25rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    verticalAlign: 'middle',
  },
  tableThumb: {
    width: '48px',
    height: '48px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  tierCountBadge: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #fed7aa',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  emptyState: {
    padding: '4rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backdropFilter: 'blur(3px)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '820px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  formErrorBanner: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.85rem',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formSection: {
    backgroundColor: '#fafafa',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  colorConfigRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'white',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
  },
  stockToggleBtn: {
    border: '1px solid',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  removeColorBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tagBtn: {
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tierAdminTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '0.5rem',
  },
  tierAdminHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 40px',
    gap: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    padding: '0 4px',
  },
  tierAdminRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 40px',
    gap: '8px',
    alignItems: 'center',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
};
