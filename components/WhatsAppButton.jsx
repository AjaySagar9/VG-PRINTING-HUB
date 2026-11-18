'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Do not show on admin panel pages
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const phoneNumber = '919528121233';
  const defaultMessage = encodeURIComponent(
    'Hello VG Printing Hub! I would like to inquire about customized merchandise / printing services.'
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <aside aria-label="Customer Support">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...styles.floatingContainer,
          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
        }}
        title="Chat with VG Printing Hub on WhatsApp"
        aria-label="Chat with VG Printing Hub on WhatsApp"
      >
        {/* Tooltip Pill on Desktop */}
        <span
          style={{
            ...styles.tooltip,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          Need Help? Chat on WhatsApp
        </span>

        {/* Floating Circle Button */}
        <div style={styles.buttonCircle}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </a>
    </aside>
  );
}

const styles = {
  floatingContainer: {
    position: 'fixed',
    bottom: '26px',
    right: '26px',
    zIndex: 9998,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  buttonCircle: {
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    backgroundColor: '#25D366',
    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  tooltip: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '7px 14px',
    borderRadius: '20px',
    fontSize: '0.825rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  },
};
