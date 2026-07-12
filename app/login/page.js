import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="animate-fade-in" style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Welcome Back</h1>
            <p style={styles.subtitle}>Login to your VG PRINTING HUB account</p>
          </div>

          <form style={styles.form}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                className="input-field" 
                placeholder="john@example.com" 
                required 
              />
            </div>
            
            <div className="input-group">
              <div style={styles.passwordHeader}>
                <label className="input-label" htmlFor="password" style={{marginBottom: 0}}>Password</label>
                <Link href="#" style={styles.forgotPassword}>Forgot Password?</Link>
              </div>
              <input 
                type="password" 
                id="password" 
                className="input-field" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <button type="submit" className="btn btn-accent" style={styles.submitBtn}>
              Sign In
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account?{' '}
              <Link href="/signup" style={styles.link}>
                Create one now
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
    padding: '2rem 0'
  },
  container: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: 'var(--bg-primary)',
    width: '100%',
    maxWidth: '450px',
    padding: '3rem 2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem'
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  passwordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  forgotPassword: {
    fontSize: '0.875rem',
    color: 'var(--accent-color)',
    fontWeight: '500'
  },
  submitBtn: {
    width: '100%',
    marginTop: '1.5rem',
    padding: '14px'
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-color)'
  },
  footerText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem'
  },
  link: {
    color: 'var(--text-primary)',
    fontWeight: '600'
  }
};
