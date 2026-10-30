'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function SecurityTab({ user, onProfileUpdated }) {
  const router = useRouter();
  const { logout } = useAuth();

  // Session State
  const [sessionData, setSessionData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [sessionError, setSessionError] = useState('');

  // Notification Preferences State
  const initialPrefs = user.notificationPrefs || {
    emailOrders: true,
    smsOrders: true,
    whatsappUpdates: true,
    marketingEmails: false,
  };

  const [prefs, setPrefs] = useState({
    emailOrders: initialPrefs.emailOrders ?? true,
    smsOrders: initialPrefs.smsOrders ?? true,
    whatsappUpdates: initialPrefs.whatsappUpdates ?? true,
    marketingEmails: initialPrefs.marketingEmails ?? false,
  });

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');

  // Delete Account Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    password: '',
    confirmText: '',
    submitting: false,
    error: '',
  });

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  const fetchSessionInfo = async () => {
    setLoadingSession(true);
    try {
      const res = await fetch('/api/user/sessions', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSessionData(data);
      }
    } catch (e) {
      console.error('Session check failed:', e);
    } finally {
      setLoadingSession(false);
    }
  };

  // Revoke other sessions
  const handleLogoutOthers = async () => {
    setRevokingSessions(true);
    setSessionSuccess('');
    setSessionError('');

    try {
      const res = await fetch('/api/user/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout_others' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke sessions');

      setSessionSuccess(data.message);
      fetchSessionInfo();
      setTimeout(() => setSessionSuccess(''), 5000);
    } catch (err) {
      setSessionError(err.message || 'Error revoking sessions');
    } finally {
      setRevokingSessions(false);
    }
  };

  // Save notification preferences
  const handleSavePrefs = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: prefs }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onProfileUpdated(data.user);
        setPrefsSuccess('Notification preferences saved successfully!');
        setTimeout(() => setPrefsSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Account deletion
  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (deleteModal.confirmText !== 'DELETE') {
      setDeleteModal((prev) => ({
        ...prev,
        error: 'Please type "DELETE" in capital letters to confirm.',
      }));
      return;
    }

    setDeleteModal((prev) => ({ ...prev, submitting: true, error: '' }));

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deleteModal.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      alert('Your account has been deactivated and scheduled for deletion. Thank you for your business with VG Printing Hub.');
      logout();
      router.push('/');
    } catch (err) {
      setDeleteModal((prev) => ({ ...prev, submitting: false, error: err.message }));
    }
  };

  return (
    <div style={styles.container}>
      {/* Card 1: Active Sessions & Device Security */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Active Sessions &amp; Devices</h2>
            <p style={styles.cardSubtitle}>
              Monitor authorized browser sessions connected to your VG Printing Hub account.
            </p>
          </div>
        </div>

        {sessionSuccess && (
          <div style={styles.successBanner} role="alert">
            ✓ {sessionSuccess}
          </div>
        )}
        {sessionError && (
          <div style={styles.errorBanner} role="alert">
            ⚠️ {sessionError}
          </div>
        )}

        {loadingSession ? (
          <p style={{ color: 'var(--text-secondary)' }}>Inspecting active sessions...</p>
        ) : (
          <div style={styles.sessionBox}>
            <div style={styles.sessionRow}>
              <div style={styles.deviceIcon}>💻</div>
              <div style={{ flex: 1 }}>
                <div style={styles.deviceTitle}>
                  {sessionData?.currentSession?.browser} on {sessionData?.currentSession?.os}
                  <span style={styles.currentDeviceBadge}>This Device</span>
                </div>
                <div style={styles.deviceMeta}>
                  IP: {sessionData?.currentSession?.clientIp || '127.0.0.1'} &bull; Status: Active Now
                </div>
              </div>
            </div>

            <div style={styles.sessionVersionInfo}>
              <span>Security Token Generation: <strong>v{sessionData?.sessionVersion || 1}</strong></span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                If you suspect unauthorized access or used a public computer, you can invalidate all tokens across other browsers.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleLogoutOthers}
                disabled={revokingSessions}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                {revokingSessions ? 'Terminating Sessions...' : '🚪 Log Out From All Other Devices'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Notification Preferences */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Communication &amp; Notification Preferences</h2>
            <p style={styles.cardSubtitle}>Choose how you receive order tracking, dispatch, and promotional updates.</p>
          </div>
        </div>

        {prefsSuccess && (
          <div style={styles.successBanner} role="alert">
            ✓ {prefsSuccess}
          </div>
        )}

        <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={styles.prefOption}>
            <input
              type="checkbox"
              checked={prefs.emailOrders}
              onChange={(e) => setPrefs((prev) => ({ ...prev, emailOrders: e.target.checked }))}
              style={styles.checkbox}
            />
            <div>
              <strong style={styles.prefTitle}>Email Order Confirmations &amp; Invoices</strong>
              <p style={styles.prefDesc}>Receive PDF receipts, artwork digital proof requests, and production status updates.</p>
            </div>
          </label>

          <label style={styles.prefOption}>
            <input
              type="checkbox"
              checked={prefs.smsOrders}
              onChange={(e) => setPrefs((prev) => ({ ...prev, smsOrders: e.target.checked }))}
              style={styles.checkbox}
            />
            <div>
              <strong style={styles.prefTitle}>SMS Courier &amp; Tracking Alerts</strong>
              <p style={styles.prefDesc}>Get real-time SMS messages with live AWB courier tracking links when your order is dispatched.</p>
            </div>
          </label>

          <label style={styles.prefOption}>
            <input
              type="checkbox"
              checked={prefs.whatsappUpdates}
              onChange={(e) => setPrefs((prev) => ({ ...prev, whatsappUpdates: e.target.checked }))}
              style={styles.checkbox}
            />
            <div>
              <strong style={styles.prefTitle}>WhatsApp Print Job Updates</strong>
              <p style={styles.prefDesc}>Direct WhatsApp notifications for sample approvals and dispatch delivery confirmations.</p>
            </div>
          </label>

          <label style={styles.prefOption}>
            <input
              type="checkbox"
              checked={prefs.marketingEmails}
              onChange={(e) => setPrefs((prev) => ({ ...prev, marketingEmails: e.target.checked }))}
              style={styles.checkbox}
            />
            <div>
              <strong style={styles.prefTitle}>Promotional Deals &amp; Festival Discount Coupons</strong>
              <p style={styles.prefDesc}>Stay updated on festive bulk merchandise pricing, new apparel collections, and seasonal offers.</p>
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button
              type="submit"
              disabled={savingPrefs}
              className="btn btn-accent"
              style={{ minWidth: '160px' }}
            >
              {savingPrefs ? 'Saving Preferences...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Card 3: Danger Zone / Account Deletion */}
      <div style={styles.dangerCard}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={{ ...styles.cardTitle, color: '#991b1b' }}>Danger Zone: Account Deletion</h2>
            <p style={styles.cardSubtitle}>
              Permanently close your VG Printing Hub profile and wipe saved personal information.
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#7f1d1d', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Deleting your account will remove your saved custom designs, delivery addresses, and personal credentials.
          Past tax invoices and order histories are safely anonymized and archived strictly in compliance with statutory financial retention laws.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={() =>
              setDeleteModal({
                isOpen: true,
                password: '',
                confirmText: '',
                submitting: false,
                error: '',
              })
            }
            style={styles.deleteAccountBtn}
          >
            ⚠️ Request Account Deletion
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', color: '#991b1b' }}>Confirm Account Deletion</h3>
              <button
                type="button"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              This action cannot be undone. To verify your identity, please enter your current account password and type <strong>DELETE</strong> below.
            </p>

            {deleteModal.error && (
              <div style={{ ...styles.errorBanner, marginBottom: '1rem' }}>
                ⚠️ {deleteModal.error}
              </div>
            )}

            <form onSubmit={handleDeleteAccountSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="deletePassword">Current Account Password *</label>
                <input
                  id="deletePassword"
                  type="password"
                  required
                  className="input-field"
                  value={deleteModal.password}
                  onChange={(e) => setDeleteModal((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="deleteConfirm">Type &ldquo;DELETE&rdquo; to confirm *</label>
                <input
                  id="deleteConfirm"
                  type="text"
                  required
                  className="input-field"
                  value={deleteModal.confirmText}
                  onChange={(e) => setDeleteModal((prev) => ({ ...prev, confirmText: e.target.value }))}
                  placeholder="DELETE"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteModal.submitting || deleteModal.confirmText !== 'DELETE'}
                  style={styles.confirmDeleteBtn}
                >
                  {deleteModal.submitting ? 'Deleting...' : 'Permanently Delete Account'}
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
  dangerCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid #fecaca',
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
  sessionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
  },
  deviceIcon: {
    fontSize: '1.75rem',
  },
  deviceTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  currentDeviceBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  deviceMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  sessionVersionInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    padding: '8px 12px',
  },
  prefOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  checkbox: {
    marginTop: '4px',
    width: '18px',
    height: '18px',
    accentColor: 'var(--accent-color)',
    cursor: 'pointer',
  },
  prefTitle: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    display: 'block',
  },
  prefDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  deleteAccountBtn: {
    padding: '10px 20px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '460px',
    width: '100%',
    padding: '2rem',
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
  confirmDeleteBtn: {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    border: 'none',
  },
  successBanner: {
    padding: '12px 16px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '1rem',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '1rem',
  },
};

