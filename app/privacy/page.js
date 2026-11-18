export const metadata = {
  title: "Privacy Policy - VG PRINTING HUB",
  description: "Official privacy policy, artwork protection, and personal data safety measures at VG Printing Hub.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.badge}>Data Safety</span>
          <h1 style={styles.title}>Privacy &amp; Artwork Protection Policy</h1>
          <p style={styles.subtitle}>
            Your privacy and intellectual property rights are 100% safeguarded at VG Printing Hub
          </p>
        </div>

        <div style={styles.contentCard}>
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>1. Information We Collect</h2>
            <p style={styles.paragraph}>
              When you purchase or register on <strong>VG PRINTING HUB</strong>, we collect relevant information necessary to fulfill your customized orders and provide customer support:
            </p>
            <ul style={styles.list}>
              <li><strong>Contact &amp; Shipping Data:</strong> Full Name, Email Address, Mobile Number, and Delivery Address.</li>
              <li><strong>B2B Business Information:</strong> Business Name, GSTIN number (for tax invoice &amp; input credit), and Contact Person details.</li>
              <li><strong>Custom Artwork &amp; Design Files:</strong> Company logos, graphic files (PNG, SVG, PDF), text imprints, and special printing instructions uploaded by you.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>2. Complete Artwork &amp; Trademark Protection</h2>
            <div style={styles.highlightBox}>
              <strong>Zero Commercial Reuse Guarantee:</strong> Your uploaded logos, company graphics, employee names, and vector files belong exclusively to you. VG Printing Hub will never sell, license, share, or repurpose your artwork for any third-party merchandise or commercial advertising without your explicit written consent.
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>3. Payment Security &amp; Encryption</h2>
            <p style={styles.paragraph}>
              All electronic payments are processed through RBI-regulated and PCI-DSS Level 1 compliant payment gateways (Razorpay). <strong>VG Printing Hub does not store or process your bank account numbers, credit card numbers, debit card numbers, or UPI PINs on our servers.</strong>
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>4. User Rights &amp; Account Deletion</h2>
            <p style={styles.paragraph}>
              You have full control over your personal data. You can update your saved addresses, password, and notification preferences at any time in your Customer Profile. If you wish to permanently delete your account, you can submit a secure deletion request directly from your account settings.
            </p>
          </section>

          <div style={styles.contactBox}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Privacy Officer Contact</h3>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              For any data privacy inquiries or trademark concerns, reach out to our grievance desk:
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <span>✉️ Email: <strong>vgscreenprinting@gmail.com</strong></span>
              <span>📞 Phone: <strong>+91 9528121233</strong></span>
              <span>📍 Office: <strong>Khushalya Enclave Phase 1, Bigbara, Rudrapur, Uttarakhand 263153</strong></span>
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
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid #bbf7d0',
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
  highlightBox: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #059669',
    padding: '1rem',
    borderRadius: '0 6px 6px 0',
    fontSize: '0.9rem',
    color: '#0f172a',
    lineHeight: 1.6,
  },
  contactBox: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '1.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    marginTop: '1rem',
  },
};
