'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Mode: 'login' | 'forgot' | 'reset'
  const [viewMode, setViewMode] = useState('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loginFeedbackUser, setLoginFeedbackUser] = useState(null);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoginFeedbackUser(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile number');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const result = await login(identifier.trim(), password);
      const user = result.user;
      setLoginFeedbackUser(user);

      if (user.role === 'ADMIN') {
        setSuccessMessage('Administrator login verified. Redirecting to Admin Dashboard...');
        setTimeout(() => router.push('/admin'), 1000);
      } else if (user.role === 'WHOLESALER') {
        if (user.approvalStatus === 'PENDING') {
          setSuccessMessage('Welcome! Your wholesale account is pending verification. Redirecting to catalog...');
        } else if (user.approvalStatus === 'APPROVED') {
          setSuccessMessage('Welcome back! Verified Wholesale Partner pricing unlocked. Redirecting...');
        } else {
          setSuccessMessage('Welcome! Note: Your wholesale application is currently under review.');
        }
        setTimeout(() => router.push('/products'), 1200);
      } else {
        setSuccessMessage('Welcome back! Redirecting to VG Printing Hub...');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your email/mobile and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      setSuccessMessage(data.message || 'Password reset token generated.');
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
      setViewMode('reset');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetToken.trim()) {
      setErrorMessage('Reset token is required');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessMessage(data.message || 'Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setViewMode('login');
        setPassword('');
        setSuccessMessage('Password updated successfully. Please sign in with your new credentials.');
      }, 1500);

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.card}>
          
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>
              {viewMode === 'login' && 'Welcome Back'}
              {viewMode === 'forgot' && 'Reset Password'}
              {viewMode === 'reset' && 'Set New Password'}
            </h1>
            <p style={styles.subtitle}>
              {viewMode === 'login' && 'Sign in with your Email or Mobile number to access Retail & Wholesale features'}
              {viewMode === 'forgot' && 'Enter your registered email or 10-digit mobile number to receive a reset token'}
              {viewMode === 'reset' && 'Enter your reset token and your new strong password'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div style={styles.errorBanner} role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div style={styles.successBanner} role="status">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Wholesale Status Notice after login */}
          {loginFeedbackUser && loginFeedbackUser.role === 'WHOLESALER' && (
            <div style={{
              ...styles.statusBanner,
              backgroundColor: loginFeedbackUser.approvalStatus === 'APPROVED' ? '#ecfdf5' : '#fffbeb',
              borderColor: loginFeedbackUser.approvalStatus === 'APPROVED' ? '#a7f3d0' : '#fde68a',
              color: loginFeedbackUser.approvalStatus === 'APPROVED' ? '#065f46' : '#92400e',
            }}>
              <strong>Wholesale Account Status: {loginFeedbackUser.approvalStatus}</strong>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                {loginFeedbackUser.approvalStatus === 'APPROVED'
                  ? 'Exclusive bulk wholesale pricing is active on your account.'
                  : 'Your account is under admin review. You can browse all standard products while approval is pending.'}
              </div>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleLogin} style={styles.form}>
              <div className="input-group">
                <label className="input-label" htmlFor="identifier">
                  Email Address or Mobile Number
                </label>
                <input
                  type="text"
                  id="identifier"
                  className="input-field"
                  placeholder="name@example.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="input-group">
                <div style={styles.passwordHeader}>
                  <label className="input-label" htmlFor="password" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    style={styles.forgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* 2. FORGOT PASSWORD REQUEST FORM */}
          {viewMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={styles.form}>
              <div className="input-group">
                <label className="input-label" htmlFor="forgotIdentifier">
                  Registered Email Address or Mobile Number
                </label>
                <input
                  type="text"
                  id="forgotIdentifier"
                  className="input-field"
                  placeholder="name@example.com or 9876543210"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Send Reset Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                &larr; Back to Sign In
              </button>
            </form>
          )}

          {/* 3. RESET PASSWORD FORM */}
          {viewMode === 'reset' && (
            <form onSubmit={handleResetPassword} style={styles.form}>
              <div className="input-group">
                <label className="input-label" htmlFor="resetToken">
                  Password Reset Token
                </label>
                <input
                  type="text"
                  id="resetToken"
                  className="input-field"
                  placeholder="Paste the reset token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  (The security token generated for your account)
                </p>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="newPassword">
                  New Password (Min 6 characters)
                </label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    className="input-field"
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeBtn}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirmNewPassword">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  className="input-field"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Cancel and Return to Sign In
              </button>
            </form>
          )}

          {/* Footer */}
          {viewMode === 'login' && (
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Don't have an account?{' '}
                <Link href="/signup" style={styles.link}>
                  Create Retail or Wholesale Account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-secondary)',
    padding: '2.5rem 0',
  },
  container: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'var(--bg-primary)',
    width: '100%',
    maxWidth: '480px',
    padding: '2.5rem 2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  statusBanner: {
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  passwordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  forgotPassword: {
    fontSize: '0.85rem',
    color: 'var(--accent-color)',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
    padding: '4px',
  },
  submitBtn: {
    width: '100%',
    marginTop: '0.75rem',
    padding: '14px',
    fontSize: '1.05rem',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-color)',
  },
  footerText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  link: {
    color: 'var(--accent-color)',
    fontWeight: '600',
  }
};
