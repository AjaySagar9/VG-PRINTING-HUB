'use client';

import React, { useState } from 'react';

export default function ProfileTab({ user, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    mobile: user.mobile || '',
    avatarUrl: user.avatarUrl || '',
  });

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // OTP Verification modal state
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    channel: 'email', // 'email' | 'mobile'
    code: '',
    testCode: '',
    loading: false,
    error: '',
    message: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload avatar photo
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setErrorMessage('Please upload a JPG, PNG, or WEBP photo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Profile photo must be less than 5MB.');
      return;
    }

    setAvatarUploading(true);
    setErrorMessage('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload photo');

      setFormData((prev) => ({ ...prev, avatarUrl: json.url }));

      // Auto-save avatar
      const updateRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: json.url }),
      });
      const updateJson = await updateRes.json();
      if (updateRes.ok && updateJson.user) {
        onProfileUpdated(updateJson.user);
        setSuccessMessage('Profile photo updated successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save personal details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          avatarUrl: formData.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      onProfileUpdated(data.user);
      setSuccessMessage(data.message || 'Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);

      // If email or mobile changed, prompt verification
      if (data.emailChanged) {
        openVerification('email', data.testCodes?.emailVerifyCode);
      } else if (data.mobileChanged) {
        openVerification('mobile', data.testCodes?.mobileVerifyCode);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(data.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 6000);
    } catch (err) {
      setPasswordError(err.message || 'Error changing password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Open verification dialog
  const openVerification = async (channel, existingTestCode = '') => {
    setVerifyModal({
      isOpen: true,
      channel,
      code: '',
      testCode: existingTestCode || '',
      loading: false,
      error: '',
      message: `Enter the 6-digit verification code sent to your ${channel}.`,
    });

    if (!existingTestCode) {
      // Trigger send OTP
      try {
        const res = await fetch('/api/user/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel, action: 'send' }),
        });
        const data = await res.json();
        if (res.ok && data.testCode) {
          setVerifyModal((prev) => ({ ...prev, testCode: data.testCode }));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const submitOtpVerification = async (e) => {
    e.preventDefault();
    setVerifyModal((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: verifyModal.channel,
          action: 'verify',
          code: verifyModal.code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Refresh profile data
      const freshRes = await fetch('/api/user/profile');
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        onProfileUpdated(freshData.user);
      }

      setVerifyModal((prev) => ({
        ...prev,
        isOpen: false,
        code: '',
        error: '',
      }));
      setSuccessMessage(`${verifyModal.channel === 'email' ? 'Email' : 'Mobile number'} verified successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setVerifyModal((prev) => ({ ...prev, error: err.message, loading: false }));
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

      {/* Card 1: Personal Details */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Personal Information</h2>
            <p style={styles.cardSubtitle}>Manage your name, contact details, and account profile.</p>
          </div>
          <div>
            {user.role === 'WHOLESALER' ? (
              <span style={styles.roleWholesaleBadge}>🏢 Wholesale Account</span>
            ) : (
              <span style={styles.roleRetailBadge}>👤 Retail Customer</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={styles.form}>
          {/* Avatar Section */}
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.name} style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {(formData.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="avatar-file" className="btn btn-outline" style={styles.uploadBtn}>
                {avatarUploading ? 'Uploading...' : '📷 Change Photo'}
              </label>
              <input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                style={{ display: 'none' }}
              />
              <p style={styles.avatarHelp}>PNG, JPG, or WEBP up to 5MB.</p>
            </div>
          </div>

          <div style={styles.formGrid}>
            {/* Full Name */}
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
              />
            </div>

            {/* Email with verify pill */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" htmlFor="email">Email Address *</label>
                {user.isEmailVerified ? (
                  <span style={styles.verifiedPill}>✓ Verified</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => openVerification('email')}
                    style={styles.verifyBtn}
                  >
                    ⚡ Verify Now
                  </button>
                )}
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@company.com"
              />
            </div>

            {/* Mobile with verify pill */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" htmlFor="mobile">Mobile Number (10 Digits) *</label>
                {user.isMobileVerified ? (
                  <span style={styles.verifiedPill}>✓ Verified</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => openVerification('mobile')}
                    style={styles.verifyBtn}
                  >
                    ⚡ Verify Now
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={styles.phonePrefix}>+91</span>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  maxLength={10}
                  className="input-field"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                />
              </div>
            </div>

            {/* Member Since info */}
            <div className="input-group">
              <label className="input-label">Account Created</label>
              <input
                type="text"
                disabled
                className="input-field"
                value={new Date(user.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-accent"
              style={{ minWidth: '160px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Change Password */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Change Password</h2>
            <p style={styles.cardSubtitle}>Ensure your account is protected with a secure password.</p>
          </div>
        </div>

        {passwordSuccess && (
          <div style={styles.successBanner} role="alert">
            ✓ {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div style={styles.errorBanner} role="alert">
            ⚠️ {passwordError}
          </div>
        )}

        <form onSubmit={handleSavePassword} style={styles.form}>
          <div style={styles.formGrid}>
            <div className="input-group">
              <label className="input-label" htmlFor="currentPassword">Current Password *</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="input-field"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="newPassword">New Password (Min 6 Characters) *</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
                className="input-field"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="input-field"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={passwordSaving}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Verification OTP Modal */}
      {verifyModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>
                Verify {verifyModal.channel === 'email' ? 'Email Address' : 'Mobile Number'}
              </h3>
              <button
                type="button"
                onClick={() => setVerifyModal((prev) => ({ ...prev, isOpen: false }))}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              We have generated a 6-digit confirmation code for{' '}
              <strong>{verifyModal.channel === 'email' ? user.email : `+91 ${user.mobile}`}</strong>.
            </p>

            {verifyModal.testCode && (
              <div style={styles.demoOtpBox}>
                <span style={{ fontSize: '0.8rem', color: '#0369a1' }}>
                  🔑 <strong>Verification Code:</strong>
                </span>
                <span style={styles.demoOtpCode}>{verifyModal.testCode}</span>
              </div>
            )}

            {verifyModal.error && (
              <div style={{ ...styles.errorBanner, marginBottom: '1rem' }}>
                ⚠️ {verifyModal.error}
              </div>
            )}

            <form onSubmit={submitOtpVerification}>
              <div className="input-group">
                <label className="input-label" htmlFor="otpCode">Enter 6-Digit Code</label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  className="input-field"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '6px' }}
                  value={verifyModal.code}
                  onChange={(e) => setVerifyModal((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="123456"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => openVerification(verifyModal.channel)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Resend Code
                </button>
                <button
                  type="submit"
                  disabled={verifyModal.loading || verifyModal.code.length !== 6}
                  className="btn btn-accent"
                  style={{ flex: 1 }}
                >
                  {verifyModal.loading ? 'Verifying...' : 'Verify & Confirm'}
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
    gap: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
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
  roleWholesaleBadge: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  roleRetailBadge: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
  },
  avatarWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-tertiary)',
    border: '2px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--accent-color)',
  },
  uploadBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'inline-block',
  },
  avatarHelp: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.35rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  phonePrefix: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 12px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  verifiedPill: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  verifyBtn: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--accent-color)',
    textDecoration: 'underline',
    cursor: 'pointer',
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
    maxWidth: '440px',
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
  demoOtpBox: {
    backgroundColor: '#f0f9ff',
    border: '1px dashed #7dd3fc',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoOtpCode: {
    fontFamily: 'monospace',
    fontSize: '1.1rem',
    fontWeight: '800',
    letterSpacing: '2px',
    color: '#0284c7',
  },
};

