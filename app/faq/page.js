export default function FAQPage() {
  const faqs = [
    { q: "Do you accept bulk corporate orders?", a: "Yes, we specialize in bulk and corporate orders with customized branding. Contact us for special pricing." },
    { q: "What is your average delivery time?", a: "Our standard delivery time is 3-5 business days depending on the order size and customization requirements." },
    { q: "Can I get a sample before a large order?", a: "Absolutely! We provide single paid samples so you can check the quality before committing to a bulk purchase." },
    { q: "What printing technologies do you use?", a: "We use high-quality DTF, Screen Printing, Sublimation, and UV printing depending on the product material." },
    { q: "What payment methods do you accept?", a: "We accept all major UPI apps, credit/debit cards, and net banking. For corporate orders, we also accept bank transfers." },
    { q: "Do you ship outside Uttarakhand?", a: "Yes, we ship our custom printed products pan-India using reliable courier partners." }
  ];

  return (
    <div className="animate-fade-in">
      <div style={styles.header}>
        <div className="container">
          <h1 style={styles.title}>Frequently Asked Questions</h1>
          <p style={styles.subtitle}>Find answers to the most common questions about our printing services, orders, and delivery.</p>
        </div>
      </div>

      <div className="container" style={styles.content}>
        <div style={styles.grid}>
          {faqs.map((faq, index) => (
            <div key={index} style={styles.faqCard}>
              <div style={styles.iconBox}>?</div>
              <div style={{flex: 1}}>
                <h3 style={styles.question}>{faq.q}</h3>
                <p style={styles.answer}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '4rem 0',
    textAlign: 'center',
    borderBottom: '1px solid var(--border-color)',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '1rem',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  content: {
    padding: '4rem 24px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  faqCard: {
    display: 'flex',
    gap: '1.5rem',
    backgroundColor: 'var(--bg-primary)',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
    alignItems: 'flex-start'
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  question: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem',
    color: 'var(--text-primary)',
  },
  answer: {
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  }
};
