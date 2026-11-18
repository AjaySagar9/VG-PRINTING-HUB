'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function ProductCustomizer({
  product,
  selectedColor,
  currentColorImage,
  onCustomizationChange,
  onDesignConfirmed,
}) {
  const [placement, setPlacement] = useState(
    product.placements && product.placements.length > 0 ? product.placements[0] : 'Front Chest'
  );
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Positioning & scale
  const [scale, setScale] = useState(100); // 40 to 180%
  const [offsetX, setOffsetX] = useState(0); // -100 to 100
  const [offsetY, setOffsetY] = useState(0); // -100 to 100

  // Text customization
  const [customText, setCustomText] = useState('');
  const [textFont, setTextFont] = useState('Outfit');
  const [textColor, setTextColor] = useState('#ffffff');

  // Customization instructions
  const [instructions, setInstructions] = useState('');

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');

  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);
  const baseImgRef = useRef(null);

  // Available placements
  const availablePlacements = product.placements && product.placements.length > 0
    ? product.placements
    : ['Front Chest', 'Back Full', 'Left Chest', 'Sleeve'];

  // Handle Artwork / Logo Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Client-side validation: PNG, JPG, JPEG, WEBP, SVG, PDF
    const validMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!validMimes.includes(file.type) && !isPdfFile) {
      setUploadError('Invalid format. Please upload PNG, JPG, JPEG, WEBP, SVG, or PDF.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Artwork must be under 15MB.');
      return;
    }

    setIsPdf(isPdfFile);

    // If image/svg, generate fast preview
    if (!isPdfFile) {
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
    } else {
      logoImgRef.current = null;
    }

    // Upload to backend
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
      if (data.isPdf) {
        setIsPdf(true);
      }
    } catch (err) {
      setUploadError(err.message || 'Error uploading artwork');
    } finally {
      setUploading(false);
    }
  };

  // Preload base product image (reacts to currentColorImage or product.imageUrl)
  useEffect(() => {
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = currentColorImage || product.imageUrl || '/navlogo.png';
    baseImg.onload = () => {
      baseImgRef.current = baseImg;
      drawCanvas();
    };
  }, [currentColorImage, product.imageUrl]);

  // Redraw canvas whenever any parameter changes
  useEffect(() => {
    drawCanvas();
    updateParent();
  }, [
    selectedColor,
    currentColorImage,
    placement,
    scale,
    offsetX,
    offsetY,
    customText,
    textFont,
    textColor,
    logoUrl,
    isPdf,
    instructions,
  ]);

  const updateParent = () => {
    if (onCustomizationChange) {
      onCustomizationChange({
        placement,
        logoUrl,
        logoFileName: logoFile,
        isPdf,
        scale,
        offsetX,
        offsetY,
        customText,
        textFont,
        textColor,
        instructions,
        hasCustomization: Boolean(logoUrl || customText.trim() || instructions.trim()),
      });
    }
  };

  // Canvas composite drawing engine
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw base product image
    if (baseImgRef.current) {
      ctx.drawImage(baseImgRef.current, 0, 0, width, height);

      // Only apply multiply tint if NO specific color image is loaded and a non-white color is chosen
      if (!currentColorImage && selectedColor && selectedColor !== '#ffffff' && selectedColor !== 'white') {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = selectedColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = selectedColor || '#e2e8f0';
      ctx.fillRect(40, 40, width - 80, height - 80);
    }

    // 3. Define printable imprint zones
    let printZone = { x: width * 0.3, y: height * 0.28, w: width * 0.4, h: height * 0.38 };
    if (placement.includes('Left') || placement.includes('Pocket')) {
      printZone = { x: width * 0.54, y: height * 0.26, w: width * 0.24, h: height * 0.24 };
    } else if (placement.includes('Back')) {
      printZone = { x: width * 0.25, y: height * 0.24, w: width * 0.5, h: height * 0.5 };
    } else if (placement.includes('Sleeve')) {
      printZone = { x: width * 0.14, y: height * 0.34, w: width * 0.22, h: height * 0.26 };
    }

    // Printable dashed boundary
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 78, 0, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(printZone.x, printZone.y, printZone.w, printZone.h);
    ctx.restore();

    // 4. Render Logo / Artwork
    const scaleFactor = scale / 100;
    const centerX = printZone.x + (printZone.w / 2) + offsetX;
    const centerY = printZone.y + (printZone.h / 2) + offsetY - (customText.trim() ? 22 : 0);

    if (isPdf && logoUrl) {
      // PDF Vector Artwork Placeholder on Canvas
      ctx.save();
      const badgeW = Math.min(printZone.w * 0.85, 140) * scaleFactor;
      const badgeH = badgeW * 0.65;
      const bX = centerX - badgeW / 2;
      const bY = centerY - badgeH / 2;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(bX, bY, badgeW, badgeH, 6);
      ctx.fill();

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top red header
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(bX, bY, badgeW, Math.max(16, badgeH * 0.35), [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, Math.round(11 * scaleFactor))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('PDF VECTOR ARTWORK', centerX, bY + Math.max(12, badgeH * 0.25));

      ctx.fillStyle = '#0f172a';
      ctx.font = `600 ${Math.max(8, Math.round(10 * scaleFactor))}px sans-serif`;
      const shortName = logoFile ? (logoFile.length > 16 ? logoFile.substring(0, 14) + '...' : logoFile) : 'Attached';
      ctx.fillText(shortName, centerX, bY + badgeH * 0.75);
      ctx.restore();
    } else if (logoImgRef.current) {
      // Normal Image / SVG Artwork
      ctx.save();
      const targetW = (printZone.w * 0.72) * scaleFactor;
      const targetH = targetW * (logoImgRef.current.height / logoImgRef.current.width);

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
      const textY = (logoImgRef.current || isPdf)
        ? printZone.y + printZone.h - 16 + offsetY
        : printZone.y + (printZone.h / 2) + offsetY;

      const fontSize = Math.max(12, Math.round(18 * (scale / 100)));
      ctx.font = `600 ${fontSize}px ${textFont}, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
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
        isPdf,
        scale,
        offsetX,
        offsetY,
        customText,
        textFont,
        textColor,
        instructions,
        previewSnapshot: snapshotUrl,
        hasCustomization: Boolean(logoUrl || customText.trim() || instructions.trim()),
      });
    }
  };

  const handleResetPosition = () => {
    setScale(100);
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <div style={styles.customizerContainer}>
      <div style={styles.titleRow}>
        <div>
          <h3 style={styles.customizerTitle}>Interactive Design &amp; Artwork Studio</h3>
          <p style={styles.customizerSubtitle}>
            Upload company logo or vector artwork (PNG, JPG, SVG, PDF), add custom text, and see a live product preview.
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
            {selectedColor && (
              <div style={styles.colorBadge}>
                Color: {selectedColor}
              </div>
            )}
          </div>

          <div style={styles.canvasLegend}>
            <span>🟧 Dashed orange line indicates printable placement zone.</span>
          </div>

          <button
            type="button"
            onClick={handleOpenConfirmation}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: '600' }}
          >
            🔍 Preview Final Design Snapshot
          </button>
        </div>

        {/* RIGHT: Customization Controls */}
        <div style={styles.controlsColumn}>
          
          {/* 1. Placement Selector */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>1. Select Imprint Placement</label>
            <div style={styles.placementButtons}>
              {availablePlacements.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlacement(p)}
                  style={{
                    ...styles.placementBtn,
                    ...(placement === p ? styles.placementBtnActive : styles.placementBtnInactive),
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
              <label style={styles.controlLabel}>2. Upload Company Logo or Graphic</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                PNG, JPG, SVG, PDF (Max 15MB)
              </span>
            </div>

            <div style={styles.uploadBox}>
              <input
                type="file"
                id="artworkUpload"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, application/pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="artworkUpload" style={styles.uploadLabel}>
                <span style={{ fontSize: '1.6rem', marginBottom: '4px' }}>📤</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                  {uploading
                    ? 'Processing & Uploading Artwork...'
                    : logoFile
                    ? `Change Artwork (${logoFile})`
                    : 'Click to Upload Artwork (PNG, JPG, SVG, PDF)'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Vector SVG or 300+ DPI transparent PNG recommended for crisp print
                </span>
              </label>
            </div>

            {uploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                ⚠️ {uploadError}
              </p>
            )}

            {logoUrl && (
              <div style={styles.uploadedInfo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{isPdf ? '📄 PDF' : '🖼️ Graphic'}:</span>
                  <strong>{logoFile}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logoImgRef.current = null;
                    setLogoUrl(null);
                    setLogoFile(null);
                    setIsPdf(false);
                    drawCanvas();
                  }}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 3. Logo Sizing & Positioning */}
          {(logoUrl || customText.trim()) && (
            <div style={styles.adjustmentsBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Position &amp; Scale Controls</span>
                <button
                  type="button"
                  onClick={handleResetPosition}
                  style={styles.resetBtn}
                >
                  Reset Position
                </button>
              </div>

              <div style={styles.sliderRow}>
                <label style={styles.sliderLabel}>Size: {scale}%</label>
                <input
                  type="range"
                  min="40"
                  max="160"
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
              3. Add Custom Text <span style={{ fontWeight: 'normal', color: 'var(--text-tertiary)' }}>(If no logo or employee name)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe / Team Lead"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="input-field"
              maxLength={40}
            />

            {customText.trim() && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Font Style</label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="input-field"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  >
                    <option value="Outfit">Modern Clean (Outfit)</option>
                    <option value="Arial">Bold Block (Arial)</option>
                    <option value="Georgia">Classic Serif (Georgia)</option>
                    <option value="Courier New">Monospace Tech (Courier)</option>
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
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Customization Instructions */}
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>
              4. Customization &amp; Print Instructions <span style={{ fontWeight: 'normal', color: 'var(--text-tertiary)' }}>(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Print logo 3.5 inches wide, use golden embroidery thread, maintain 2 inch distance from collar..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* CONFIRMATION PREVIEW MODAL */}
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Final Custom Design Preview</h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalImageWrapper}>
                <img
                  src={snapshotUrl}
                  alt="Customized Product Preview"
                  style={styles.modalImage}
                />
              </div>

              <div style={styles.modalSummary}>
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Product:</span>
                  <span>{product.name}</span>
                </div>
                {selectedColor && (
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Selected Color:</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: selectedColor,
                          border: '1px solid #ccc',
                        }}
                      />
                      {selectedColor}
                    </span>
                  </div>
                )}
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Imprint Placement:</span>
                  <strong>{placement}</strong>
                </div>
                {logoFile && (
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Artwork:</span>
                    <span>{isPdf ? '📄 PDF Document' : '🖼️ Graphic'} ({logoFile})</span>
                  </div>
                )}
                {customText.trim() && (
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Custom Text:</span>
                    <span>&ldquo;{customText}&rdquo; ({textFont})</span>
                  </div>
                )}
                {instructions.trim() && (
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Instructions:</span>
                    <span style={{ fontStyle: 'italic' }}>{instructions}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Edit Design
              </button>
              <button
                type="button"
                onClick={handleConfirmFinal}
                className="btn btn-accent"
                style={{ flex: 1.5 }}
              >
                ✓ Apply Design &amp; Order
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
    marginTop: '2.5rem',
    boxShadow: 'var(--shadow-sm)',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-color)',
  },
  customizerTitle: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  customizerSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  liveBadge: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '999px',
    border: '1px solid #a7f3d0',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
    maxWidth: '440px',
    aspectRatio: '1/1',
    borderRadius: 'var(--radius-md)',
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
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  colorBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: 'var(--text-primary)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid #cbd5e1',
  },
  canvasLegend: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
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
    gap: '0.35rem',
  },
  controlLabel: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  placementButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  placementBtn: {
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  placementBtnActive: {
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: '1px solid var(--accent-color)',
  },
  placementBtnInactive: {
    backgroundColor: 'white',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  },
  uploadBox: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    transition: 'border-color 0.2s',
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
    backgroundColor: '#f1f5f9',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginTop: '6px',
  },
  removeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  adjustmentsBox: {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  },
  resetBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--accent-color)',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.35rem',
  },
  sliderLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    width: '110px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '540px',
    width: '100%',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modalImageWrapper: {
    textAlign: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '280px',
    objectFit: 'contain',
    borderRadius: 'var(--radius-md)',
  },
  modalSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.85rem',
    backgroundColor: '#fafafa',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.25rem',
  },
};
