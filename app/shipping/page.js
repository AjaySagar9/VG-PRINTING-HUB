import Link from 'next/link';

export const metadata = {
  title: "Shipping & Delivery Policy - VG PRINTING HUB",
  description: "Shipping timelines, delivery charges, packaging, and courier tracking details for VG Printing Hub customized merchandise.",
};

export default function ShippingPolicyPage() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.badge}>Order Logistics</span>
          <h1 style={styles.title}>Shipping &amp; Delivery Policy</h1>
          <p style={styles.subtitle}>
            Fast &amp; Insured Pan-India Delivery across 27,000+ PIN Codes
          </p>
        </div>

        <div style={styles.contentCard}>
          {/* Section 1: Overview */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>1. Production &amp; Dispatch Turnaround Time</h2>
            <p style={styles.paragraph}>
              Because every order at <strong>VG PRINTING HUB</strong> is custom printed and tailored with your uploaded artwork, our standard fulfillment timeline comprises two stages:
            </p>
            <div style={styles.grid2}>
              <div style={styles.timelineCard}>
                <div style={styles.timelineStep}>Stage 1: Production</div>
                <div style={styles.timelineDuration}>2 to 4 Business Days</div>
                <p style={styles.timelineDesc}>
                  Includes digital artwork pre-flight check, screen/DTF plate preparation, precision printing, heat curing, and quality inspection.
                </p>
              </div>
              <div style={styles.timelineCard}>
                <div style={styles.timelineStep}>Stage 2: Courier Transit</div>
                <div style={styles.timelineDuration}>3 to 5 Business Days</div>
                <p style={styles.timelineDesc}>
                  Express air and surface courier transit across Metros, Tier 1, and Tier 2 cities in India with live tracking updates.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Shipping Charges */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>2. Shipping Charges &amp; Free Delivery</h2>
            <ul style={styles.list}>
              <li><strong>Orders ₹999 and Above:</strong> 100% Free Standard Delivery across India.</li>
              <li><strong>Orders Below ₹999:</strong> Flat ₹99 nominal delivery and handling fee applied at checkout.</li>
              <li><strong>Bulk Wholesale Shipments:</strong> For large volume corporate orders exceeding 200+ kg, dedicated surface cargo and transport booking can be arranged with freight to-pay.</li>
            </ul>
          </section>

          {/* Section 3: Delivery Partners */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>3. Trusted Courier Partners &amp; Tracking</h2>
            <p style={styles.paragraph}>
              All shipments are dispatched through India's premier logistics partners, including <strong>BlueDart, Delhivery, DTDC, XpressBees, and India Post Speed Post</strong>.
            </p>
            <p style={styles.paragraph}>
              Once your order status changes to <em>&ldquo;Dispatched&rdquo;</em>, you will receive an automatic dispatch notification and your AWB Tracking Number will be updated in your <strong>My Account &gt; My Orders</strong> dashboard for real-time tracking.
            </p>
          </section>

          {/* Section 4: Secure Packaging */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>4. Commercial Grade Protective Packaging</h2>
            <p style={styles.paragraph}>
              Every garment is individually poly-bagged to protect against moisture, dust, and stains. Mugs and ceramic gifts are packaged in multi-layer bubble wrap with heavy corrugated outer boxes to ensure zero transit damage.
            </p>
          </section>

          {/* Section 5: Delivery Inquiries */}
          <div style={styles.contactBox}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Need Urgent Express Delivery for an Event?</h3>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              If you require fast-track printing for corporate exhibitions, college fests, or annual events, contact our logistics desk:
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <span>📞 Phone: <strong>+91 9528121233</strong></span>
              <span>✉️ Email: <strong>vgscreenprinting@gmail.com</strong></span>
              <span>📍 Hub: <strong>Rudrapur, Uttarakhand</strong></span>
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
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid #bfdbfe',
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
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  timelineCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
  },
  timelineStep: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--accent-color)',
    textTransform: 'uppercase',
  },
  timelineDuration: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: '4px 0 8px',
  },
  timelineDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
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
