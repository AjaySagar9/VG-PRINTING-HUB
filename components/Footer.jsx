import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.container}>
        
        {/* Column 1: Brand & Contact Info */}
        <div style={styles.column}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start' }}>
            <Image
              src="/logo.png"
              alt="VG Printing Hub Logo"
              width={220}
              height={70}
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
            />
          </div>
          <p style={styles.text}>
            Your premier destination for high-definition custom printing, corporate merchandise, and wholesale branded apparel.
          </p>
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ ...styles.text, fontSize: '0.85rem', display: 'flex', gap: '0.5rem', margin: 0 }}>
              <span>📍</span> Khushalya Enclave Phase 1, Bigbara, Rudrapur, Uttarakhand 263153
            </p>
            <p style={{ ...styles.text, fontSize: '0.85rem', display: 'flex', gap: '0.5rem', margin: 0 }}>
              <span>📞</span> +91 9528121233 / +91 9012205321
            </p>
            <p style={{ ...styles.text, fontSize: '0.85rem', display: 'flex', gap: '0.5rem', margin: 0 }}>
              <span>✉️</span> vgscreenprinting@gmail.com
            </p>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Explore Catalog</h4>
          <Link href="/products" style={styles.link}>All Custom Merchandise</Link>
          <Link href="/categories" style={styles.link}>Product Categories</Link>
          <Link href="/about" style={styles.link}>About Our Factory</Link>
          <Link href="/account" style={styles.link}>My Customer Account</Link>
        </div>

        {/* Column 3: Customer Service */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Customer Support</h4>
          <Link href="/contact" style={styles.link}>Contact Us &amp; Visit Hub</Link>
          <Link href="/faq" style={styles.link}>Frequently Asked Questions</Link>
          <a
            href="https://wa.me/919528121233?text=Hello%20VG%20Printing%20Hub,%20I%20have%20an%20inquiry"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.link, color: '#16a34a', fontWeight: '600' }}
          >
            💬 WhatsApp Live Desk (+91 9528121233)
          </a>
        </div>

        {/* Column 4: Policies & Compliance */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Policies &amp; Legal</h4>
          <Link href="/returns" style={styles.link}>Returns &amp; Replacement</Link>
          <Link href="/shipping" style={styles.link}>Shipping &amp; Delivery</Link>
          <Link href="/privacy" style={styles.link}>Privacy &amp; Trademark Policy</Link>
          <Link href="/terms" style={styles.link}>Terms &amp; Conditions</Link>
        </div>

      </div>

      <div style={styles.bottom}>
        <div className="container" style={styles.bottomContent}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} VG PRINTING HUB. All rights reserved.</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            🔒 256-Bit SSL Encrypted • ⚡ Razorpay Verified • 📋 B2B GST Invoicing
          </p>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: 'var(--bg-secondary)',
    paddingTop: '3.5rem',
    borderTop: '1px solid var(--border-color)',
    marginTop: 'auto',
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '2.5rem',
    marginBottom: '2.5rem',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  text: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.9rem',
    margin: 0,
  },
  heading: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
  },
  link: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'color var(--transition-fast)',
  },
  bottom: {
    backgroundColor: 'var(--bg-primary)',
    borderTop: '1px solid var(--border-color)',
    padding: '1.25rem 0',
  },
  bottomContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
  },
};
