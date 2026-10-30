'use client';

import React, { useState, useEffect } from 'react';

export default function AddressesTab({ user }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal State for Add / Edit
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    id: null,
    formData: {
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Delivery',
      isDefaultDelivery: false,
      isDefaultBilling: false,
      deliveryInstructions: '',
    },
    submitting: false,
    formError: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/addresses', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error('Fetch addresses error:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      id: null,
      formData: {
        name: user.name || '',
        phone: user.mobile || '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        addressType: 'Delivery',
        isDefaultDelivery: addresses.length === 0,
        isDefaultBilling: addresses.length === 0,
        deliveryInstructions: '',
      },
      submitting: false,
      formError: '',
    });
  };

  const openEditModal = (addr) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      id: addr.id,
      formData: {
        name: addr.name,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        addressType: addr.addressType || 'Delivery',
        isDefaultDelivery: addr.isDefaultDelivery,
        isDefaultBilling: addr.isDefaultBilling,
        deliveryInstructions: addr.deliveryInstructions || '',
      },
      submitting: false,
      formError: '',
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalState((prev) => ({ ...prev, submitting: true, formError: '' }));

    const { mode, id, formData } = modalState;
    const url = '/api/user/addresses';
    const method = mode === 'add' ? 'POST' : 'PUT';
    const payload = mode === 'add' ? formData : { ...formData, id };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save address');
      }

      setSuccessMessage(data.message || 'Address saved successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
      closeModal();
      fetchAddresses();
    } catch (err) {
      setModalState((prev) => ({ ...prev, submitting: false, formError: err.message }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this saved address?')) {
      return;
    }

    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete address');

      setSuccessMessage('Address removed successfully');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchAddresses();
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleSetDefault = async (id, type) => {
    try {
      const payload = {
        id,
        [type === 'delivery' ? 'isDefaultDelivery' : 'isDefaultBilling']: true,
      };

      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage(`Default ${type} address updated!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Alerts */}
      {successMessage && (
        <div style={styles.successBanner} role="alert">
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={styles.errorBanner} role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Saved Addresses</h2>
          <p style={styles.subtitle}>Manage your delivery locations and billing details for express checkout.</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-accent"
          style={styles.addBtn}
        >
          + Add New Address
        </button>
      </div>

      {/* Address Grid */}
      {loading ? (
        <div style={styles.emptyBox}>
          <p>Loading your saved addresses...</p>
        </div>
      ) : addresses.length > 0 ? (
        <div style={styles.grid}>
          {addresses.map((addr) => (
            <div key={addr.id} style={styles.addressCard}>
              <div style={styles.cardTopRow}>
                <div style={styles.nameRow}>
                  <strong style={styles.recipientName}>{addr.name}</strong>
                  <span style={styles.typeBadge}>{addr.addressType}</span>
                </div>

                <div style={styles.badgeRow}>
                  {addr.isDefaultDelivery && (
                    <span style={styles.defaultDeliveryBadge}>Default Delivery</span>
                  )}
                  {addr.isDefaultBilling && (
                    <span style={styles.defaultBillingBadge}>Default Billing</span>
                  )}
                </div>
              </div>

              <div style={styles.addressContent}>
                <p style={styles.streetLine}>{addr.street}</p>
                <p style={styles.cityLine}>
                  {addr.city}, {addr.state} &mdash; <strong>{addr.pincode}</strong>
                </p>
                <p style={styles.phoneLine}>📞 +91 {addr.phone}</p>
                {addr.deliveryInstructions && (
                  <p style={styles.instructionsLine}>
                    📝 <em>Instructions: {addr.deliveryInstructions}</em>
                  </p>
                )}
              </div>

              <div style={styles.cardActions}>
                <div style={styles.defaultButtons}>
                  {!addr.isDefaultDelivery && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id, 'delivery')}
                      style={styles.setDefaultLink}
                    >
                      Make Default Delivery
                    </button>
                  )}
                  {!addr.isDefaultBilling && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id, 'billing')}
                      style={styles.setDefaultLink}
                    >
                      Make Default Billing
                    </button>
                  )}
                </div>

                <div style={styles.rightActions}>
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="btn btn-outline"
                    style={styles.editBtn}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    style={styles.deleteBtn}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyBox}>
          <span style={{ fontSize: '3rem' }}>📍</span>
          <h3 style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>No addresses saved yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Add your office, factory, or home delivery addresses for instant 1-click checkout.
          </p>
          <button type="button" onClick={openAddModal} className="btn btn-primary">
            + Add Your First Address
          </button>
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {modalState.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem' }}>
                {modalState.mode === 'add' ? 'Add New Delivery / Billing Address' : 'Edit Address Details'}
              </h3>
              <button type="button" onClick={closeModal} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            {modalState.formError && (
              <div style={styles.formErrorBanner}>
                ⚠️ {modalState.formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={styles.modalGrid}>
                <div className="input-group">
                  <label className="input-label" htmlFor="addrName">Recipient / Business Name *</label>
                  <input
                    id="addrName"
                    name="name"
                    type="text"
                    required
                    className="input-field"
                    value={modalState.formData.name}
                    onChange={handleInputChange}
                    placeholder="Recipient or Office Desk Name"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="addrPhone">10-Digit Mobile Number *</label>
                  <input
                    id="addrPhone"
                    name="phone"
                    type="tel"
                    required
                    maxLength={10}
                    className="input-field"
                    value={modalState.formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                  />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label" htmlFor="addrStreet">Street Address, Unit / Floor, Building *</label>
                  <textarea
                    id="addrStreet"
                    name="street"
                    rows={2}
                    required
                    className="input-field"
                    value={modalState.formData.street}
                    onChange={handleInputChange}
                    placeholder="e.g., Plot 42, Sector 18, Udyog Vihar Phase 4"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="addrCity">City *</label>
                  <input
                    id="addrCity"
                    name="city"
                    type="text"
                    required
                    className="input-field"
                    value={modalState.formData.city}
                    onChange={handleInputChange}
                    placeholder="Gurugram / New Delhi / Mumbai"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="addrState">State / UT *</label>
                  <input
                    id="addrState"
                    name="state"
                    type="text"
                    required
                    className="input-field"
                    value={modalState.formData.state}
                    onChange={handleInputChange}
                    placeholder="Haryana / Delhi / Maharashtra"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="addrPincode">6-Digit PIN Code *</label>
                  <input
                    id="addrPincode"
                    name="pincode"
                    type="text"
                    required
                    maxLength={6}
                    className="input-field"
                    value={modalState.formData.pincode}
                    onChange={handleInputChange}
                    placeholder="122015"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="addressType">Address Type</label>
                  <select
                    id="addressType"
                    name="addressType"
                    className="input-field"
                    value={modalState.formData.addressType}
                    onChange={handleInputChange}
                  >
                    <option value="Delivery">Delivery Address</option>
                    <option value="Billing">Billing Address</option>
                    <option value="Both">Both Delivery &amp; Billing</option>
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label" htmlFor="deliveryInstructions">Delivery Instructions (Optional)</label>
                  <input
                    id="deliveryInstructions"
                    name="deliveryInstructions"
                    type="text"
                    className="input-field"
                    value={modalState.formData.deliveryInstructions}
                    onChange={handleInputChange}
                    placeholder="e.g., Deliver between 10am-6pm at Reception Gate 2"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      name="isDefaultDelivery"
                      checked={modalState.formData.isDefaultDelivery}
                      onChange={handleInputChange}
                    />
                    <span>Set as my default <strong>Delivery</strong> address</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      name="isDefaultBilling"
                      checked={modalState.formData.isDefaultBilling}
                      onChange={handleInputChange}
                    />
                    <span>Set as my default <strong>Billing</strong> address</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={closeModal} className="btn btn-outline">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalState.submitting}
                  className="btn btn-accent"
                  style={{ minWidth: '150px' }}
                >
                  {modalState.submitting ? 'Saving Address...' : 'Save Address'}
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
  addBtn: {
    padding: '8px 18px',
    fontSize: '0.85rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  recipientName: {
    fontSize: '1.05rem',
    color: 'var(--text-primary)',
  },
  typeBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  badgeRow: {
    display: 'flex',
    gap: '0.35rem',
    flexWrap: 'wrap',
  },
  defaultDeliveryBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  defaultBillingBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  addressContent: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    marginBottom: '1.25rem',
  },
  streetLine: {
    marginBottom: '0.25rem',
    fontWeight: '500',
  },
  cityLine: {
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  phoneLine: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  instructionsLine: {
    fontSize: '0.8rem',
    color: '#6b7280',
    backgroundColor: 'var(--bg-secondary)',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    marginTop: '0.35rem',
  },
  cardActions: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  defaultButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  setDefaultLink: {
    fontSize: '0.75rem',
    color: 'var(--accent-color)',
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'underline',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
  editBtn: {
    padding: '4px 12px',
    fontSize: '0.8rem',
  },
  deleteBtn: {
    padding: '4px 10px',
    fontSize: '0.8rem',
    color: '#dc2626',
    cursor: 'pointer',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-full)',
    backgroundColor: '#fff5f5',
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '3.5rem 2rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
  },
  successBanner: {
    padding: '12px 16px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '500',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '560px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  formErrorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.85rem',
  },
};

