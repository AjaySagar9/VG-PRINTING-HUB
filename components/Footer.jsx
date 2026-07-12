import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.container}>
        <div style={styles.column}>
          <h3 style={styles.brand}>VG PRINTING <span style={{color: 'var(--accent-color)'}}>HUB</span></h3>
          <p style={styles.text}>
            Your one-stop shop for high-quality, print-on-demand customized corporate gifts.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{...styles.text, fontSize: '0.875rem', display: 'flex', gap: '0.5rem'}}>
              <span>📍</span> Khushalya Enclave Phase 1, Bigbara, Rudrapur, UK
            </p>
            <p style={{...styles.text, fontSize: '0.875rem', display: 'flex', gap: '0.5rem'}}>
              <span>📞</span> +91 9528121233
            </p>
            <p style={{...styles.text, fontSize: '0.875rem', display: 'flex', gap: '0.5rem'}}>
              <span>✉️</span> vgscreenprinting@gmail.com
            </p>
          </div>
        </div>
        <div style={styles.column}>
          <h4 style={styles.heading}>Quick Links</h4>
          <Link href="/products" style={styles.link}>All Products</Link>
          <Link href="/categories" style={styles.link}>Categories</Link>
          <Link href="/about" style={styles.link}>About Us</Link>
        </div>
        <div style={styles.column}>
          <h4 style={styles.heading}>Customer Service</h4>
          <Link href="/contact" style={styles.link}>Contact Us</Link>
          <Link href="/faq" style={styles.link}>FAQ</Link>
          <Link href="/returns" style={styles.link}>Returns Policy</Link>
        </div>
      </div>
      <div style={styles.bottom}>
        <div className="container" style={styles.bottomContent}>
          <p>&copy; {new Date().getFullYear()} VG PRINTING HUB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: 'var(--bg-secondary)',
    paddingTop: '4rem',
    borderTop: '1px solid var(--border-color)',
    marginTop: 'auto',
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '3rem',
    marginBottom: '3rem',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  brand: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  text: {
    color: 'var(--text-secondary)',
  },
  heading: {
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
  },
  link: {
    color: 'var(--text-secondary)',
    transition: 'color var(--transition-fast)',
  },
  bottom: {
    backgroundColor: 'var(--bg-primary)',
    borderTop: '1px solid var(--border-color)',
    padding: '1.5rem 0',
  },
  bottomContent: {
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    fontSize: '0.875rem',
  }
};
