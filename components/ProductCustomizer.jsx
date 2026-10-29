'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function ProductCustomizer({
  product,
  selectedColor,
  onCustomizationChange,
  onDesignConfirmed,
}) {
  const [placement, setPlacement] = useState(
    product.placements && product.placements.length > 0 ? product.placements[0] : 'Front Chest'
  );
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Positioning & scale
  const [scale, setScale] = useState(100); // 50 to 150%
  const [offsetX, setOffsetX] = useState(0); // -100 to 100
  const [offsetY, setOffsetY] = useState(0); // -100 to 100

  // Text customization
  const [customText, setCustomText] = useState('');
  const [textFont, setTextFont] = useState('Outfit');
  const [textColor, setTextColor] = useState('#ffffff');

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');

  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);
  const baseImgRef = useRef(null);

  // Available placements
  const availablePlacements = product.placements && product.placements.length > 0
    ? product.placements
    : ['Front Chest', 'Back', 'Left Chest', 'Sleeve'];

  // Handle Logo Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Client-side validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload PNG, JPG, WEBP, or SVG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Artwork must be under 10MB.');
      return;
    }

    // Fast local preview
    const localReader = new FileReader();
    localReader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        logoImgRef.current = img;
        drawCanvas();
      };
      img.src = event.target.result;
    };
    localReader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload artwork');
      }

      setLogoUrl(data.url);
      setLogoFile(file.name);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Preload base product image
  useEffect(() => {
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = product.imageUrl || '/navlogo.png';
    baseImg.onload = () => {
      baseImgRef.current = baseImg;
      drawCanvas();
    };
  }, [product.imageUrl]);

  // Redraw canvas whenever parameters change
  useEffect(() => {
    drawCanvas();
    updateParent();
  }, [selectedColor, placement, scale, offsetX, offsetY, customText, textFont, textColor, logoUrl]);

  const updateParent = () => {
    if (onCustomizationChange) {
      onCustomizationChange({
        placement,
        logoUrl,
        logoFileName: logoFile,
        scale,
        offsetX,
        offsetY,
        customText,
        textFont,
        textColor,
        hasCustomization: Boolean(logoUrl || customText),
      });
    }
  };

  // HTML5 Canvas Composite Renderer
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Draw base product background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw base product image if loaded
    if (baseImgRef.current) {
      ctx.drawImage(baseImgRef.current, 0, 0, width, height);

      // Color tint overlay if color is chosen
      if (selectedColor && selectedColor !== '#ffffff') {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = selectedColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    } else {
      // Mockup silhouette placeholder
      ctx.fillStyle = selectedColor || '#e2e8f0';
      ctx.fillRect(40, 40, width - 80, height - 80);
    }

    // 3. Define printable placement area coordinates
    let printZone = { x: width * 0.3, y: height * 0.3, w: width * 0.4, h: height * 0.35 };
    if (placement.includes('Left') || placement.includes('Pocket')) {
      printZone = { x: width * 0.55, y: height * 0.28, w: width * 0.22, h: height * 0.22 };
    } else if (placement.includes('Back')) {
      printZone = { x: width * 0.25, y: height * 0.25, w: width * 0.5, h: height * 0.5 };
    } else if (placement.includes('Sleeve')) {
      printZone = { x: width * 0.15, y: height * 0.35, w: width * 0.2, h: height * 0.25 };
    }

    // Draw dashed printable area guide
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 78, 0, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(printZone.x, printZone.y, printZone.w, printZone.h);
    ctx.restore();

    // 4. Render Logo Artwork
    if (logoImgRef.current) {
      ctx.save();
      const scaleFactor = scale / 100;
      const targetW = (printZone.w * 0.7) * scaleFactor;
      const targetH = (targetW * (logoImgRef.current.height / logoImgRef.current.width));

      const centerX = printZone.x + (printZone.w / 2) + offsetX;
      const centerY = printZone.y + (printZone.h / 2) + offsetY - (customText ? 20 : 0);

      ctx.drawImage(
        logoImgRef.current,
        centerX - targetW / 2,
        centerY - targetH / 2,
        targetW,
        targetH
      );
      ctx.restore();
    }

    // 5. Render Custom Text
    if (customText.trim()) {
      ctx.save();
      const textX = printZone.x + (printZone.w / 2) + offsetX;
      const textY = logoImgRef.current
        ? printZone.y + printZone.h - 15 + offsetY
        : printZone.y + (printZone.h / 2) + offsetY;

      ctx.font = `600 ${Math.max(12, Math.round(18 * (scale / 100)))}px ${textFont}, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtle drop shadow for legibility
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 4;
      ctx.fillText(customText, textX, textY);
      ctx.restore();
    }
  };

  const handleOpenConfirmation = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      setSnapshotUrl(dataUrl);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmFinal = () => {
    setShowConfirmModal(false);
    if (onDesignConfirmed) {
      onDesignConfirmed({
        placement,
        logoUrl,
        logoFileName: logoFile,
        scale,
        offsetX,
        offsetY,
        customText,
        textFont,
        textColor,
        previewSnapshot: snapshotUrl,
      });
    }
  };

  return (
    <div style={styles.customizerContainer}>
      <div style={styles.titleRow}>
        <div>
          <h3 style={styles.customizerTitle}>Interactive Design &amp; Artwork Studio</h3>
          <p style={styles.customizerSubtitle}>
            Upload your vector logo or artwork, pick placement zones, and preview live on your product.
          </p>
        </div>
        <span style={styles.liveBadge}>● Live Canvas</span>
      </div>

      <div style={styles.layout}>
        {/* LEFT: Live Interactive Preview Canvas */}
        <div style={styles.previewColumn}>
          <div style={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              style={styles.canvas}
            />
            <div style={styles.placementBadge}>
              Zone: {placement}
            </div>
          </div>
          <div style={styles.canvasLegend}>
            <span>🟧 Dashed orange box indicates printable imprint boundary.</span>
          </div>

          <button
            type="button"
            onClick={handleOpenConfirmation}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.9rem' }}
          >
            🔍 View Fullscreen Design Snapshot
          </button>
        </div>

        {/* RIGHT: Controls & Customization Options */}
        <div style={styles.controlsColumn}>
          
          {/* 1. Placement Selector */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Imprint Placement Zone</label>
            <div style={styles.placementButtons}>
              {availablePlacements.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlacement(p)}
                  style={{
                    ...styles.placementBtn,
                    ...(placement === p ? styles.placementBtnActive : styles.placementBtnInactive)
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Logo / Artwork Upload */}
          <div style={styles.controlGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.controlLabel}>Upload Company Logo / Graphic</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>PNG, SVG, JPG (Max 10MB)</span>
            </div>

            <div style={styles.uploadBox}>
              <input
                type="file"
                id="artworkUpload"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="artworkUpload" style={styles.uploadLabel}>
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📤</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                  {uploading ? 'Processing & Uploading...' : logoFile ? `Change File (${logoFile})` : 'Choose Artwork File'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  High resolution transparent PNG or vector SVG recommended
                </span>
              </label>
            </div>

            {uploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>⚠️ {uploadError}</p>
            )}

            {logoUrl && (
              <div style={styles.uploadedInfo}>
                <span>✓ Artwork Loaded: {logoFile}</span>
                <button
                  type="button"
                  onClick={() => {
                    logoImgRef.current = null;
                    setLogoUrl(null);
                    setLogoFile(null);
                    drawCanvas();
                  }}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 3. Logo Sizing & Position Adjustment */}
          {logoUrl && (
            <div style={styles.adjustmentsBox}>
              <div style={styles.sliderRow}>
                <label style={styles.sliderLabel}>Size: {scale}%</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={styles.sliderRow}>
                <label style={styles.sliderLabel}>Horizontal: {offsetX}px</label>
                <input
                  type="range"
                  min="-80"
                  max="80"
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={styles.sliderRow}>
                <label style={styles.sliderLabel}>Vertical: {offsetY}px</label>
                <input
                  type="range"
                  min="-80"
                  max="80"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          )}

          {/* 4. Custom Text Lines */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>
              Custom Line / Employee Name / Tagline <span style={{ fontWeight: 'normal', color: 'var(--text-tertiary)' }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe - Tech Lead"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="input-field"
              maxLength={40}
            />

            {customText.trim() && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Font</label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="input-field"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  >
                    <option value="Outfit">Modern Clean (Outfit)</option>
                    <option value="Arial">Bold Block (Arial)</option>
                    <option value="Georgia">Classic Serif (Georgia)</option>
                    <option value="Courier New">Monospace / Tech</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Text Color</label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {['#ffffff', '#000000', '#f59e0b', '#dc2626', '#2563eb', '#10b981'].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setTextColor(c)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: textColor === c ? '2px solid var(--accent-color)' : '1px solid #ccc',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION PREVIEW MODAL */}
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem' }}>Final Custom Design Preview</h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)' }}>
              <img
                src={snapshotUrl}
                alt="Customized Product Preview"
                style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            </div>

            <div style={styles.modalSummary}>
              <div><strong>Placement:</strong> {placement}</div>
              {logoFile && <div><strong>Logo File:</strong> {logoFile}</div>}
              {customText && <div><strong>Custom Text:</strong> &ldquo;{customText}&rdquo; ({textFont})</div>}
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Make Adjustments
              </button>
              <button
                type="button"
                onClick={handleConfirmFinal}
                className="btn btn-accent"
                style={{ flex: 1 }}
              >
                ✓ Confirm &amp; Save Design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  customizerContainer: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    padding: '1.75rem',
    marginTop: '2rem',
    boxShadow: 'var(--shadow-sm)',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  customizerTitle: {
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    marginBottom: '0.2rem',
  },
  customizerSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  liveBadge: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '9999px',
    border: '1px solid #a7f3d0',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
  },
  previewColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  canvasWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    aspectRatio: '1/1',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    backgroundColor: '#f8fafc',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  placementBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '4px',
    backdropFilter: 'blur(4px)',
  },
  canvasLegend: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    marginTop: '0.5rem',
    textAlign: 'center',
  },
  controlsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  controlLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  placementButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  placementBtn: {
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  placementBtnActive: {
    backgroundColor: 'var(--text-primary)',
    color: 'white',
    border: '1px solid var(--text-primary)',
  },
  placementBtnInactive: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  uploadBox: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  uploadedInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    color: '#065f46',
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  removeBtn: {
    color: '#dc2626',
    fontWeight: '600',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  adjustmentsBox: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  sliderLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    minWidth: '100px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    backdropFilter: 'blur(3px)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '520px',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  modalSummary: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: 'var(--bg-secondary)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
  }
};
