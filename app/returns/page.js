import Link from 'next/link';

export const metadata = {
  title: "Cancellation, Returns & Refund Policy - VG PRINTING HUB",
  description: "Official cancellation, replacement, and refund policy for custom printed products and corporate merchandise at VG Printing Hub.",
};

export default function ReturnsPolicyPage() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <span style={styles.badge}>Customer Protection</span>
          <h1 style={styles.title}>Returns, Replacement &amp; Cancellation Policy</h1>
          <p style={styles.subtitle}>
            Last updated: November 2026 • VG Printing Hub, Rudrapur, Uttarakhand
          </p>
        </div>

        <div style={styles.contentCard}>
          {/* Section 1: Custom Printed Products */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>1. Custom Printed &amp; Personalized Products</h2>
            <p style={styles.paragraph}>
              At <strong>VG PRINTING HUB</strong>, our custom merchandise (such as customized t-shirts, hoodies, caps, employee joining kits, personalized mugs, and promotional pens) is custom printed and tailored exclusively for you according to your uploaded artwork, design specifications, and size selections.
            </p>
            <div style={styles.highlightBox}>
              <strong>Important Notice:</strong> Once your digital artwork proof or layout is confirmed and sent into production, custom printed items cannot be cancelled, returned, or exchanged for reasons of design change, buyer remorse, or incorrect size selection. Please review your digital preview carefully before placing the order.
            </div>
          </section>

          {/* Section 2: Replacement Guarantee */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>2. Replacement Guarantee for Defects or Damage</h2>
            <p style={styles.paragraph}>
              We stand behind the print quality and craftsmanship of our merchandise. You are eligible for a <strong>100% Free Replacement or Full Reprint</strong> in the following scenarios:
            </p>
            <ul style={styles.list}>
              <li><strong>Manufacturing Defect:</strong> Stitching tears, fabric holes, broken closures, or material defects.</li>
              <li><strong>Print or Graphic Defect:</strong> Major misprint, incorrect logo placement, wrong color mismatch differing significantly from approved digital proof, or peeling print on arrival.</li>
              <li><strong>Transit Damage:</strong> Package arrived visibly broken or damaged during courier transit.</li>
              <li><strong>Wrong Product or Size Delivered:</strong> You received an item or size differing from your confirmed order invoice.</li>
            </ul>
            <div style={styles.alertSuccess}>
              <strong>How to Report:</strong> Please notify our support team within <strong>48 hours of delivery</strong> via WhatsApp at <strong>+91 9528121233</strong> or email at <strong>vgscreenprinting@gmail.com</strong> along with clear photos/unboxing video of the defect and your Order Number (e.g., <code>VG-XXXXXX-XXX</code>).
            </div>
          </section>

          {/* Section 3: Non-Custom / Plain Products */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>3. Standard Non-Customized Items</h2>
            <p style={styles.paragraph}>
              For plain, non-customized merchandise ordered without personalized printing, we offer a <strong>7-Day Return Window</strong> from the date of delivery. The item must be unused, unwashed, in its original tags and intact packaging.
            </p>
          </section>

          {/* Section 4: Cancellation Policy */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>4. Order Cancellation Rules</h2>
            <ul style={styles.list}>
              <li><strong>Before Production Starts (Order Status: &ldquo;Placed&rdquo;):</strong> You can cancel your order directly from your Customer Account dashboard under <em>My Orders</em> for an immediate full refund.</li>
              <li><strong>After Production Starts (Status: &ldquo;In Production&rdquo; or &ldquo;Dispatched&rdquo;):</strong> The order cannot be cancelled as fabric has already been processed and ink/thread applied.</li>
            </ul>
          </section>

          {/* Section 5: Refund Timelines */}
          <section style={styles.section}>
            <h2 style={styles.sectionHeading}>5. Refund Processing &amp; Timelines</h2>
            <p style={styles.paragraph}>
              Once a refund is approved by our quality control desk:
            </p>
            <ul style={styles.list}>
              <li><strong>Online Payments (Razorpay / UPI / Cards / Netbanking):</strong> The refunded amount is credited back to the original source account within <strong>5 to 7 business days</strong> as per standard banking processing cycles.</li>
              <li><strong>Cash on Delivery (COD):</strong> Refunds for approved COD returns will be transferred to your verified Bank Account or UPI ID within <strong>3 to 5 business days</strong> after bank details verification.</li>
            </ul>
          </section>

          {/* Contact Details */}
          <div style={styles.contactBox}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Have Questions Regarding Returns?</h3>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Our dedicated support team in Rudrapur is available Monday through Saturday (9:00 AM – 7:00 PM IST).
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <span>📞 Phone: <strong>+91 9528121233</strong> / <strong>+91 9012205321</strong></span>
              <span>✉️ Email: <strong>vgscreenprinting@gmail.com</strong></span>
              <span>📍 Address: <strong>Khushalya Enclave Phase 1, Bigbara, Rudrapur, Uttarakhand 263153</strong></span>
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
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid #fed7aa',
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
    backgroundColor: '#fffaf0',
    borderLeft: '4px solid #f59e0b',
    padding: '1rem',
    borderRadius: '0 6px 6px 0',
    fontSize: '0.9rem',
    color: '#92400e',
    lineHeight: 1.6,
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: '#166534',
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
