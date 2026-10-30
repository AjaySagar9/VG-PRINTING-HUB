'use client';

import React, { useState } from 'react';

export default function WholesaleTab({ user, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    businessName: user.businessName || '',
    businessType: user.businessType || '',
    contactPerson: user.contactPerson || user.name || '',
    businessAddress: user.businessAddress || '',
    businessWebsite: user.businessWebsite || '',
    gstin: user.gstin || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [reverificationAlert, setReverificationAlert] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveWholesale = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    setReverificationAlert(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          contactPerson: formData.contactPerson,
          businessAddress: formData.businessAddress,
          businessWebsite: formData.businessWebsite,
          gstin: formData.gstin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update wholesale profile');
      }

      onProfileUpdated(data.user);
      setSuccessMessage(data.message || 'Business details updated successfully!');
      if (data.wholesaleReverificationTriggered) {
        setReverificationAlert(true);
      }
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Verification Status Banner */}
      {user.approvalStatus === 'APPROVED' ? (
        <div style={styles.approvedBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>✓</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', color: '#065f46' }}>
                Verified Wholesale Partner Account
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#047857' }}>
                Your business credentials have been vetted and approved. You enjoy direct B2B discounted wholesale pricing across all product categories.
              </p>
            </div>
          </div>
        </div>
      ) : user.approvalStatus === 'PENDING' ? (
        <div style={styles.pendingBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⏳</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', color: '#92400e' }}>
                Wholesale Account Pending Verification
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#b45309' }}>
                Our compliance team is verifying your business documentation and GSTIN details. Verification typically takes 24-48 business hours. You can still order at retail rates in the meantime.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.rejectedBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', color: '#991b1b' }}>
                Wholesale Application Status: Not Approved
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>
                Your wholesale application requires additional verification or documentation. Please update your GSTIN and business address below, or reach out to partners@vgprintinghub.com.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Re-verification Notice Alert */}
      {reverificationAlert && (
        <div style={styles.warningAlert} role="alert">
          ℹ️ <strong>Admin Re-Verification Queued:</strong> Because your legal business details or GSTIN were modified, your partner account has been temporarily placed in review for tax compliance.
        </div>
      )}

      {/* Pricing Tier Card */}
      <div style={styles.tierCard}>
        <div style={styles.tierHeader}>
          <div>
            <span style={styles.tierTag}>ASSIGNED WHOLESALE TIER</span>
            <h3 style={styles.tierTitle}>{user.wholesaleTier || 'Tier 1 - Standard Wholesale'}</h3>
          </div>
          <div style={styles.tierBadge}>
            {user.approvalStatus === 'APPROVED' ? 'Active Tier' : 'Pending Activation'}
          </div>
        </div>

        <div style={styles.tierGrid}>
          <div style={styles.tierStat}>
            <span style={styles.statLabel}>Wholesale Margin</span>
            <span style={styles.statValue}>Up to 45% Off</span>
          </div>
          <div style={styles.tierStat}>
            <span style={styles.statLabel}>Bulk Minimum Order Qty</span>
            <span style={styles.statValue}>20 - 25 Units / SKU</span>
          </div>
          <div style={styles.tierStat}>
            <span style={styles.statLabel}>Priority Production</span>
            <span style={styles.statValue}>48-Hour Fast-Track</span>
          </div>
          <div style={styles.tierStat}>
            <span style={styles.statLabel}>Dedicated Support</span>
            <span style={styles.statValue}>Wholesale Account Rep</span>
          </div>
        </div>

        <p style={styles.tierFooterNote}>
          🔒 <em>Note: Wholesale tiers and volumetric discount brackets are calibrated by VG Printing Hub account executives based on quarterly volume.</em>
        </p>
      </div>

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

      {/* Business Details Form */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Business &amp; Tax Profile</h2>
            <p style={styles.cardSubtitle}>
              Ensure your legal company name, GST registration, and registered business address match your commercial invoicing records.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveWholesale}>
          <div style={styles.formGrid}>
            {/* Business Name */}
            <div className="input-group">
              <label className="input-label" htmlFor="businessName">Registered Business / Company Name *</label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                className="input-field"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="e.g., Apex Tech Solutions Pvt Ltd"
              />
            </div>

            {/* Business Type */}
            <div className="input-group">
              <label className="input-label" htmlFor="businessType">Business Entity Type *</label>
              <select
                id="businessType"
                name="businessType"
                required
                className="input-field"
                value={formData.businessType}
                onChange={handleInputChange}
              >
                <option value="">Select Business Entity Type</option>
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership / LLP">Partnership / LLP</option>
                <option value="Public Limited Company">Public Limited Company</option>
                <option value="Educational / Non-Profit Institution">Educational / Non-Profit Institution</option>
                <option value="Advertising / Merchandising Agency">Advertising / Merchandising Agency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Contact Person */}
            <div className="input-group">
              <label className="input-label" htmlFor="contactPerson">Authorized Contact Person *</label>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                required
                className="input-field"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Name of procurement / brand manager"
              />
            </div>

            {/* GSTIN */}
            <div className="input-group">
              <label className="input-label" htmlFor="gstin">
                GSTIN Number (15 Characters)
                {user.gstin && user.approvalStatus === 'APPROVED' && (
                  <span style={styles.verifiedGSTINPill}>Verified</span>
                )}
              </label>
              <input
                id="gstin"
                name="gstin"
                type="text"
                maxLength={15}
                className="input-field"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="e.g., 22AAAAA0000A1Z5"
                style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
              />
            </div>

            {/* Business Website */}
            <div className="input-group">
              <label className="input-label" htmlFor="businessWebsite">Business Website URL (Optional)</label>
              <input
                id="businessWebsite"
                name="businessWebsite"
                type="url"
                className="input-field"
                value={formData.businessWebsite}
                onChange={handleInputChange}
                placeholder="https://www.example.com"
              />
            </div>

            {/* Registered Business Address */}
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label" htmlFor="businessAddress">Registered Office / Billing Address *</label>
              <textarea
                id="businessAddress"
                name="businessAddress"
                rows={3}
                required
                className="input-field"
                value={formData.businessAddress}
                onChange={handleInputChange}
                placeholder="Full official business address as registered in GST records"
              />
            </div>
          </div>

          <div style={styles.formFooter}>
            <p style={styles.securityNote}>
              ⚠️ <em>Notice: Modifying your verified GSTIN, Legal Business Name, or Address will automatically trigger administrative review to protect your wholesale tax credentials.</em>
            </p>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-accent"
              style={{ minWidth: '180px' }}
            >
              {saving ? 'Updating Business Details...' : 'Save Business Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  approvedBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
  },
  pendingBanner: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
  },
  rejectedBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
  },
  warningAlert: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontSize: '0.9rem',
  },
  tierCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-sm)',
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  tierTag: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--accent-color)',
    textTransform: 'uppercase',
  },
  tierTitle: {
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginTop: '2px',
  },
  tierBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '9999px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  tierStat: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  tierFooterNote: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.75rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardHeader: {
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  verifiedGSTINPill: {
    marginLeft: '8px',
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '1px 6px',
    borderRadius: '9999px',
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '1.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.25rem',
  },
  securityNote: {
    fontSize: '0.8rem',
    color: '#b45309',
    maxWidth: '520px',
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
};

