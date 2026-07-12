export default function ContactPage() {
  return (
    <div className="animate-fade-in">
      <div style={styles.header}>
        <div className="container">
          <h1 style={styles.title}>Contact Us</h1>
          <p style={styles.subtitle}>We'd love to hear from you. Get in touch with us for customized printing solutions.</p>
        </div>
      </div>

      <div className="container" style={styles.content}>
        <div style={styles.grid}>
          {/* Contact Information */}
          <div style={styles.infoCard}>
            <h2 style={styles.cardTitle}>Get In Touch</h2>
            <p style={styles.cardDesc}>Reach out to VG PRINTING HUB directly using the details below.</p>
            
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <div style={styles.iconBox}>📍</div>
                <div>
                  <h4 style={styles.infoLabel}>Address</h4>
                  <p style={styles.infoText}>
                    Khushalya Enclave Phase 1,<br />
                    Bigbara, Rudrapur,<br />
                    Uttarakhand 263153
                  </p>
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.iconBox}>📞</div>
                <div>
                  <h4 style={styles.infoLabel}>Phone</h4>
                  <p style={styles.infoText}>+91 9528121233</p>
                  <p style={styles.infoText}>+91 9012205321</p>
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.iconBox}>✉️</div>
                <div>
                  <h4 style={styles.infoLabel}>Email</h4>
                  <p style={styles.infoText}>vgscreenprinting@gmail.com</p>
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.iconBox}>📱</div>
                <div style={{width: '100%'}}>
                  <h4 style={styles.infoLabel}>Social Media</h4>
                  <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
                    <a href="https://www.instagram.com/vg_printing_hub/" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      <span>Instagram</span>
                    </a>
                    <a href="https://www.facebook.com/p/VG-Screen-Printing-61574378830489/" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      <span>Facebook</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <a href="https://wa.me/919528121233" target="_blank" rel="noopener noreferrer" className="btn" style={{backgroundColor: '#25D366', color: 'white', width: '100%', marginBottom: '2rem'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Chat on WhatsApp
            </a>
            
            <div style={styles.founderBox}>
              <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Founder</p>
              <h4 style={{fontSize: '1.125rem', fontWeight: '600'}}>Vishal Gangwar</h4>
            </div>
          </div>

          {/* Contact Form */}
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>Send a Message</h2>
            <form style={styles.form}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input type="text" className="input-field" placeholder="Your Name" />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" className="input-field" placeholder="your@email.com" />
              </div>
              <div className="input-group">
                <label className="input-label">Subject</label>
                <input type="text" className="input-field" placeholder="How can we help?" />
              </div>
              <div className="input-group">
                <label className="input-label">Message</label>
                <textarea className="input-field" rows="4" placeholder="Your message here..." style={{resize: 'vertical'}}></textarea>
              </div>
              <button type="button" className="btn btn-accent" style={{width: '100%', marginTop: '1rem'}}>
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Google Maps Section */}
        <div style={{marginTop: '4rem'}}>
          <h2 style={{...styles.cardTitle, textAlign: 'center', marginBottom: '2rem'}}>Find Us</h2>
          <div style={{borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', height: '400px', border: '1px solid var(--border-color)'}}>
            <iframe 
              src="https://maps.google.com/maps?q=VG+Printing+Hub,+Bigbara,+Rudrapur,+Uttarakhand&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{border: 0}} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
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
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '3rem',
    alignItems: 'start',
  },
  infoCard: {
    backgroundColor: 'var(--bg-primary)',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  formCard: {
    backgroundColor: 'var(--bg-primary)',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
  },
  cardTitle: {
    fontSize: '1.75rem',
    marginBottom: '0.5rem',
  },
  cardDesc: {
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: '1rem',
    marginBottom: '0.25rem',
  },
  infoText: {
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  founderBox: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-color)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  socialLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
    fontSize: '0.875rem',
    fontWeight: '500'
  }
};
