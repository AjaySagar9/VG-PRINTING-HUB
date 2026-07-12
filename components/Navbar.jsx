import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header style={styles.header}>
      <div className="container" style={styles.container}>
        <div style={styles.logoContainer}>
          <Link href="/" style={{ ...styles.logo, display: 'flex', alignItems: 'center' }}>
            <Image src="/navlogo.png" alt="VG Printing Hub Logo" width={140} height={45} style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
          </Link>
        </div>
        <nav style={styles.nav}>
          <Link href="/" style={styles.navLink}>Home</Link>
          <Link href="/products" style={styles.navLink}>Products</Link>
          <Link href="/categories" style={styles.navLink}>Categories</Link>
          <Link href="/contact" style={styles.navLink}>Contact</Link>
        </nav>
        <div style={styles.actions}>
          <Link href="/login" style={{ ...styles.navLink, marginRight: '1.5rem' }}>
            Login
          </Link>
          <Link href="/signup" className="btn btn-outline" style={{ marginRight: '1rem' }}>
            Sign Up
          </Link>
          <Link href="/cart" className="btn btn-accent">
            Cart (0)
          </Link>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '75px',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    color: 'var(--text-primary)',
  },
  logoAccent: {
    color: 'var(--accent-color)',
  },
  nav: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    fontWeight: '500',
    fontSize: '1rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
  }
};
