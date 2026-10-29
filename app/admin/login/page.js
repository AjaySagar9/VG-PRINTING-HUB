'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier.trim() || !password) {
      setError('Please enter admin email/mobile and password');
      return;
    }

    setLoading(true);

    try {
      const result = await login(identifier.trim(), password);
      const user = result.user;

      if (user.role !== 'ADMIN') {
        setError('Access denied: This account does not possess administrator privileges.');
        return;
      }

      setSuccess('Admin credentials verified. Redirecting to control panel...');
      setTimeout(() => {
        router.push('/admin');
      }, 1000);

    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>Restricted Access</div>
          <h1 style={styles.title}>VG Printing Hub Admin</h1>
          <p style={styles.subtitle}>Sign in with administrator credentials</p>
        </div>

        {error && (
          <div style={styles.errorBanner} role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successBanner} role="status">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={styles.form}>
          <div className="input-group">
            <label className="input-label" htmlFor="adminId">Admin Email or Mobile</label>
            <input
              type="text"
              id="adminId"
              className="input-field"
              placeholder="admin@vgprintinghub.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="adminPassword">Admin Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="adminPassword"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Verifying Admin Access...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={styles.footer}>
          <Link href="/" style={styles.backLink}>
            &larr; Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: '440px',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  badge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--accent-color)',
    backgroundColor: 'rgba(255, 78, 0, 0.1)',
    padding: '4px 10px',
    borderRadius: '9999px',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  title: {
    fontSize: '1.75rem',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: 'var(--text-secondary)',
  },
  submitBtn: {
    width: '100%',
    marginTop: '1rem',
    padding: '12px',
    fontSize: '1rem',
  },
  footer: {
    marginTop: '1.75rem',
    textAlign: 'center',
    paddingTop: '1.25rem',
    borderTop: '1px solid var(--border-color)',
  },
  backLink: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
  }
};
