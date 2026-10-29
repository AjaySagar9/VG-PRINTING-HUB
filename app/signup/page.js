'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [accountType, setAccountType] = useState('retail'); // 'retail' | 'wholesale'

  // Common fields
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Retail field
  const [name, setName] = useState('');

  // Wholesale fields
  const [contactName, setContactName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Reseller / Retailer');
  const [businessAddress, setBusinessAddress] = useState('');
  const [gstin, setGstin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Business type options
  const businessTypes = [
    'Reseller / Retailer',
    'Corporate / Enterprise',
    'Print Shop / Signage Studio',
    'Advertising & Marketing Agency',
    'School / College / Institution',
    'Event Management',
    'Other Business'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side validations
    const isWholesale = accountType === 'wholesale';
    const primaryName = isWholesale ? contactName : name;

    if (!primaryName || primaryName.trim().length < 2) {
      setErrorMessage(isWholesale ? 'Please enter contact person name' : 'Please enter your full name');
      return;
    }

    if (isWholesale) {
      if (!businessName.trim()) {
        setErrorMessage('Please enter your business or company name');
        return;
      }
      if (!businessAddress.trim()) {
        setErrorMessage('Please enter your complete business address');
        return;
      }
      if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase())) {
        setErrorMessage('GSTIN must be a valid 15-character Indian GST format (e.g. 22AAAAA0000A1Z5)');
        return;
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    const cleanMobile = mobile.replace(/[\s-]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setErrorMessage('Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9)');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter confirm password.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        accountType,
        name: isWholesale ? contactName : name,
        contactName: isWholesale ? contactName : undefined,
        businessName: isWholesale ? businessName : undefined,
        businessType: isWholesale ? businessType : undefined,
        businessAddress: isWholesale ? businessAddress : undefined,
        gstin: isWholesale && gstin ? gstin.trim().toUpperCase() : undefined,
        email: email.trim(),
        mobile: cleanMobile,
        password,
        confirmPassword,
      };

      const result = await signup(payload);

      setSuccessMessage(result.message || 'Registration successful!');

      // Redirect after a short moment
      setTimeout(() => {
        if (isWholesale) {
          router.push('/products');
        } else {
          router.push('/');
        }
      }, 1500);

    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create Your Account</h1>
            <p style={styles.subtitle}>
              Choose your account type to unlock custom print solutions & wholesale discounts
            </p>
          </div>

          {/* Account Type Selector Tabs */}
          <div style={styles.typeSelectorContainer} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={accountType === 'retail'}
              onClick={() => { setAccountType('retail'); setErrorMessage(''); }}
              style={{
                ...styles.typeBtn,
                ...(accountType === 'retail' ? styles.typeBtnActive : styles.typeBtnInactive)
              }}
            >
              <span style={styles.typeIcon}>👤</span>
              <div>
                <div style={styles.typeName}>Retail Customer</div>
                <div style={styles.typeDesc}>For personal & small volume orders</div>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={accountType === 'wholesale'}
              onClick={() => { setAccountType('wholesale'); setErrorMessage(''); }}
              style={{
                ...styles.typeBtn,
                ...(accountType === 'wholesale' ? styles.typeBtnActive : styles.typeBtnInactive)
              }}
            >
              <span style={styles.typeIcon}>🏢</span>
              <div>
                <div style={styles.typeName}>Wholesale Partner</div>
                <div style={styles.typeDesc}>For bulk buyers, businesses & print resellers</div>
              </div>
            </button>
          </div>

          {/* Wholesale Notice Banner */}
          {accountType === 'wholesale' && (
            <div style={styles.wholesaleNotice}>
              <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>ℹ️</span>
              <div>
                <strong>Wholesale Account Policy:</strong> Wholesale applications start in <strong>Pending</strong> status. 
                Our admin team will review your business credentials, after which exclusive tier pricing and bulk discounts will be unlocked.
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div style={styles.errorBanner} role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={styles.successBanner} role="status">
              <span>✓</span>
              <span>{successMessage} Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* RETAIL SPECIFIC FIELD */}
            {accountType === 'retail' && (
              <div className="input-group">
                <label className="input-label" htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  className="input-field"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* WHOLESALE SPECIFIC FIELDS */}
            {accountType === 'wholesale' && (
              <>
                <div style={styles.row}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="contactName">Contact Person Name *</label>
                    <input
                      type="text"
                      id="contactName"
                      className="input-field"
                      placeholder="e.g. Amit Patel"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="businessName">Business / Company Name *</label>
                    <input
                      type="text"
                      id="businessName"
                      className="input-field"
                      placeholder="e.g. Patel Print Solutions Pvt Ltd"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={styles.row}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="businessType">Business Type *</label>
                    <select
                      id="businessType"
                      className="input-field"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{ cursor: 'pointer', backgroundColor: 'white' }}
                      required
                    >
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="gstin">
                      GSTIN <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="gstin"
                      className="input-field"
                      placeholder="e.g. 24AAACP1234A1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="businessAddress">Complete Business Address *</label>
                  <textarea
                    id="businessAddress"
                    className="input-field"
                    placeholder="Unit / Floor, Building Name, Street, City, State, PIN"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>
              </>
            )}

            {/* COMMON FIELDS: Email & Mobile */}
            <div style={styles.row}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label" htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  className="input-field"
                  placeholder="contact@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label" htmlFor="mobile">10-Digit Mobile Number *</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={styles.mobilePrefix}>+91</span>
                  <input
                    type="tel"
                    id="mobile"
                    className="input-field"
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            {/* COMMON FIELDS: Password & Confirm Password with Show/Hide */}
            <div style={styles.row}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label" htmlFor="password">Password *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="input-field"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label" htmlFor="confirmPassword">Confirm Password *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="input-field"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                accountType === 'wholesale' ? 'Submit Wholesale Application' : 'Create Retail Account'
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{' '}
              <Link href="/login" style={styles.link}>
                Sign In
              </Link>
            </p>
          </div>
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
    maxWidth: '650px',
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
  typeSelectorContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  typeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
    transition: 'all var(--transition-normal)',
    cursor: 'pointer',
  },
  typeBtnActive: {
    border: '2px solid var(--accent-color)',
    backgroundColor: 'rgba(255, 78, 0, 0.04)',
    boxShadow: 'var(--shadow-sm)',
  },
  typeBtnInactive: {
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    opacity: 0.8,
  },
  typeIcon: {
    fontSize: '1.75rem',
  },
  typeName: {
    fontWeight: '600',
    fontSize: '1rem',
    color: 'var(--text-primary)',
  },
  typeDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  wholesaleNotice: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'flex-start',
    color: '#92400e',
    fontSize: '0.875rem',
    lineHeight: 1.4,
    marginBottom: '1.5rem',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  mobilePrefix: {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRight: 'none',
    padding: '12px 14px',
    borderTopLeftRadius: 'var(--radius-md)',
    borderBottomLeftRadius: 'var(--radius-md)',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
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
    marginTop: '1.25rem',
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
