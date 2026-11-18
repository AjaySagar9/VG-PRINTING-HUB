import Link from 'next/link';

export const metadata = {
  title: "Terms & Conditions - VG PRINTING HUB",
  description: "Official terms and conditions for customized printing orders, corporate merchandising, and wholesale contracts at VG Printing Hub.",
};

export default function TermsPage() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.badge}>Legal Agreement</span>
          <h1 style={styles.title}>Terms &amp; Conditions</h1>
          <p style={styles.subtitle}>
            Please read these terms carefully before placing an order on VG Printing Hub
          </p>
        </div>

        <div style={styles.contentCard}>
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>1. Contract Agreement</h2>
            <p style={styles.paragraph}>
              These Terms &amp; Conditions govern your purchase and use of the printing services and custom merchandise provided by <strong>VG PRINTING HUB</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), registered in Rudrapur, Uttarakhand. By placing an order via our website or creating an account, you agree to be legally bound by these terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>2. Artwork Ownership &amp; Intellectual Property</h2>
            <p style={styles.paragraph}>
              By uploading artwork, brand logos, trademarks, or custom graphics to our customizer, you confirm and warrant that:
            </p>
            <ul style={styles.list}>
              <li>You own the copyright or are authorized by the trademark owner to reproduce the uploaded logo or artwork.</li>
              <li>Your design does not violate any third-party intellectual property rights, patents, or trade secrets.</li>
              <li>You agree to indemnify VG Printing Hub against any trademark infringement claims resulting from client-submitted graphics.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>3. Digital Proofs &amp; Print Color Variations</h2>
            <p style={styles.paragraph}>
              We utilize commercial screen printing, DTF, vinyl, and high-precision embroidery. However, please note that:
            </p>
            <ul style={styles.list}>
              <li>Digital screens (RGB) emit light and may display colors slightly brighter than physical cured textiles (CMYK / Pantone inks). A minor, industry-standard color variance of 5–8% may occur depending on garment fabric blend.</li>
              <li>Placement guidelines displayed on the customizer preview are accurate proportional approximations. Minor tolerance of +/- 0.5 inches in manual heat-press placement is standard.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>4. Pricing, Minimum Order Quantities (MOQ) &amp; Taxes</h2>
            <p style={styles.paragraph}>
              All prices shown on the website are in Indian Rupees (INR) and are subject to 18% GST for corporate printing goods. Dynamic volume pricing tiers apply based on total unit volume. Minimum Order Quantities (MOQs) must be met for each product to proceed to checkout.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>5. Governing Law &amp; Jurisdiction</h2>
            <p style={styles.paragraph}>
              These terms and all transactions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with orders placed on VG Printing Hub shall be subject to the exclusive jurisdiction of the competent courts in <strong>Rudrapur, Udham Singh Nagar, Uttarakhand</strong>.
            </p>
          </section>

          <div style={styles.contactBox}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Contact Legal &amp; Commercial Desk</h3>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <span>📞 Phone: <strong>+91 9528121233</strong></span>
              <span>✉️ Email: <strong>vgscreenprinting@gmail.com</strong></span>
              <span>🏢 Operating Entity: <strong>VG PRINTING HUB, Rudrapur (UK)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '3rem 0 5rem',
    backgroundColor: 'var(--bg-primary)',
  },
  container: {
    maxWidth: '860px',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '2.25rem',
    color: 'var(--text-primary)',
    margin: '0.75rem 0 0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionHeading: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  paragraph: {
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    fontSize: '0.95rem',
    margin: 0,
  },
  list: {
    paddingLeft: '1.25rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.8,
    fontSize: '0.95rem',
  },
  contactBox: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '1.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    marginTop: '1rem',
  },
};
