import React, { useEffect, useRef, useState } from 'react';
import './AROverlay.css';
import { shoePartsData } from '../data/shoeData';

const PART_COLORS = {
  upper:   '#4a90e2',
  midsole: '#f59e0b',
  outsole: '#10b981',
  insole:  '#8b5cf6',
  tongue:  '#38bdf8',
  heel:    '#ef4444',
};

const DEFAULT_COLOR_PRESETS = [
  { name: 'Hitam Obsidian', hex: '#18181b' },
  { name: 'Putih Murni', hex: '#f8fafc' },
  { name: 'Merah Crimson', hex: '#dc2626' },
  { name: 'Biru Royal', hex: '#2563eb' },
  { name: 'Hijau Emerald', hex: '#15803d' },
  { name: 'Kuning Amber', hex: '#d97706' },
];

/**
 * Integrated3DEduCard – Card Edukasi Terintegrasi di Atas Objek 3D
 * Muncul saat user tap titik marker atau bagian sepatu 3D.
 */
export function Integrated3DEduCard({ part, onClose, onNavigate }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!part) return null;

  const currentIndex = shoePartsData.findIndex((p) => p.id === part.id);
  const total = shoePartsData.length;
  const partColor = PART_COLORS[part.id] ?? '#e94560';

  const goPrev = () => onNavigate(shoePartsData[(currentIndex - 1 + total) % total]);
  const goNext = () => onNavigate(shoePartsData[(currentIndex + 1) % total]);

  return (
    <div
      className="edu-card-container"
      style={{
        '--part-accent': partColor,
        '--card-glow': `${partColor}33`,
      }}
    >
      <div className={`edu-card ${isExpanded ? 'expanded' : 'compact'}`}>
        {/* Header Bagian */}
        <div className="edu-card-top">
          <div className="edu-part-title" style={{ color: partColor }}>
            <span style={{ fontSize: '1.2rem' }}>{part.emoji}</span>
            <span>{part.name.toUpperCase()}</span>
          </div>
          <button className="edu-close-btn" type="button" onClick={onClose} aria-label="Tutup informasi">
            ✕
          </button>
        </div>

        <div className="edu-function-box">
          <div className="edu-function-label">Fungsi</div>
          <div className="edu-function-text">{part.function}</div>
        </div>

        <button
          className="edu-details-toggle"
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded ? 'Ringkas' : 'Info lengkap'}
          <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
        </button>

        {isExpanded && (
          <div className="edu-details">
            <div className="edu-meta-row">
              <span className="edu-meta-badge">
                Material: <strong>{part.material}</strong>
              </span>
            </div>

            <p className="edu-description-text">{part.description}</p>
            <p className="edu-model-note">
              Penanda menunjukkan area perkiraan; model 3D ini berupa satu mesh, bukan komponen terpisah.
            </p>

            <div className="edu-card-footer">
              <button className="edu-nav-arrow" type="button" onClick={goPrev}>
                ◀ Sebelumnya
              </button>

              <div className="edu-step-dots">
                {shoePartsData.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`step-dot ${idx === currentIndex ? 'active' : ''}`}
                    style={idx === currentIndex ? { background: partColor } : {}}
                    onClick={() => onNavigate(p)}
                    title={p.name}
                    aria-label={`Tampilkan ${p.name}`}
                    aria-current={idx === currentIndex ? 'step' : undefined}
                  />
                ))}
              </div>

              <button className="edu-nav-arrow" type="button" onClick={goNext}>
                Berikutnya ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * AROverlay – HUD Interaktif Kamera AR Sepatu
 */
export function AROverlay({
  isTracking,
  isModelReady,
  selectedPart,
  isAutoRotate,
  zoomLevel,
  showMarkers,
  shoeColor,
  currentShoe,
  availableShoes = [],
  onSelectShoe,
  onBack,
  onSelectPart,
  onClosePart,
  onToggleAutoRotate,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleMarkers,
  onChangeColor,
}) {
  const [showTargetModal, setShowTargetModal] = useState(false);
  const targetModalRef = useRef(null);

  useEffect(() => {
    if (!showTargetModal) return undefined;

    const previousFocus = document.activeElement;
    const firstAction = targetModalRef.current?.querySelector('a, button');
    firstAction?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowTargetModal(false);
      if (event.key !== 'Tab') return;
      const actions = targetModalRef.current?.querySelectorAll('a[href], button:not(:disabled)');
      if (!actions?.length) return;
      const first = actions[0];
      const last = actions[actions.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [showTargetModal]);

  // Siapkan palet warna berdasarkan model sepatu yang aktif
  const colorPalette =
    currentShoe?.modelColors && currentShoe.modelColors.length > 0
      ? [
          ...currentShoe.modelColors.map((c) => ({
            name: c.name || c.marketName || 'Varian Model',
            hex: c.hex,
          })),
          ...DEFAULT_COLOR_PRESETS.filter(
            (d) =>
              !currentShoe.modelColors.some(
                (c) => c.hex?.toLowerCase() === d.hex.toLowerCase()
              )
          ),
        ]
      : DEFAULT_COLOR_PRESETS;

  return (
    <div className="ar-viewport">
      {/* ── TOP HEADER ── */}
      <header className="ar-header">
        <button className="ar-back-link" type="button" onClick={onBack}>
          ← {currentShoe?.brand || 'AR'} KATALOG
        </button>

        {/* Model Selector Dropdown */}
        {availableShoes.length > 0 && (
          <div className="ar-shoe-switcher">
            <select
              className="ar-shoe-select"
              value={currentShoe?.id || ''}
              onChange={(e) => onSelectShoe?.(e.target.value)}
              title="Ganti model sepatu di AR"
              aria-label="Pilih model sepatu"
            >
              {availableShoes.map((shoe) => (
                <option key={shoe.id} value={shoe.id}>
                  👟 {shoe.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ar-status-pill">
          <span className={`status-dot ${isTracking ? 'active' : 'searching'}`} />
          <span role="status" aria-live="polite">
            {isTracking
              ? isModelReady
                ? 'Target terdeteksi · 3D aktif'
                : 'Target terkunci · memuat 3D…'
              : 'Arahkan ke gambar target'}
          </span>
        </div>

        <button
          className="target-help-btn"
          type="button"
          onClick={() => setShowTargetModal(true)}
          title="Lihat gambar target yang perlu di-scan"
        >
          🎯 Target
        </button>
      </header>

      {/* ── VIEWFINDER SCANNER (Hanya saat mencari gambar target) ── */}
      {!isTracking && (
        <div className="ar-viewfinder">
          <div className="viewfinder-box">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <div className="laser-scan-line" />
          </div>
          <div className="viewfinder-text" role="status" aria-live="polite">
            Arahkan kamera ke gambar marker target
          </div>
          <div className="viewfinder-sub">
            Tampilkan seluruh kartu target di layar laptop/HP lain atau cetak.
          </div>
        </div>
      )}

      {/* ── GESTURE HINT (Saat model aktif) ── */}
      {isTracking && !selectedPart && (
        <div className="ar-drag-hint">
          👆 Geser 1 jari untuk memutar · Cubit 2 jari (pinch) untuk zoom · Tap warna di bawah
        </div>
      )}

      {/* ── INTEGRATED 3D EDUCATION CARD ── */}
      {selectedPart && (
        <Integrated3DEduCard
          key={selectedPart.id}
          part={selectedPart}
          onClose={onClosePart}
          onNavigate={onSelectPart}
        />
      )}

      {/* ── BOTTOM DOCK CONTROLS & COLOR/PARTS STRIP ── */}
      <footer className="ar-bottom-controls">
        {/* Floating Color Variant Customizer (Muncul saat tracking aktif) */}
        {isTracking && (
          <div className="ar-color-palette-bar" role="group" aria-label="Pilihan Varian Warna Sepatu">
            <span className="ar-palette-label">🎨 WARNA:</span>
            <div className="ar-color-dots">
              {/* Tombol Warna Asli / Default */}
              <button
                type="button"
                className={`ar-color-dot ${shoeColor === null ? 'active' : ''}`}
                onClick={() => onChangeColor(null)}
                title="Warna Asli Model (Default GLB)"
                aria-label="Warna Asli Model"
              >
                <span className="dot-original-swatch">👟</span>
                <span className="ar-dot-tooltip">Asli</span>
              </button>

              {/* Tombol Varian Warna */}
              {colorPalette.slice(0, 7).map((color) => {
                const isActive = shoeColor?.toLowerCase() === color.hex?.toLowerCase();
                return (
                  <button
                    key={color.name + color.hex}
                    type="button"
                    className={`ar-color-dot ${isActive ? 'active' : ''}`}
                    style={{ '--dot-color': color.hex }}
                    onClick={() => onChangeColor(color.hex)}
                    title={`Ganti warna ke ${color.name}`}
                    aria-label={`Warna ${color.name}`}
                  >
                    <span className="ar-dot-tooltip">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Parts Quick-Select Pills (Muncul saat tracking aktif) */}
        {isTracking && (
          <div className="parts-scroll-strip" role="group" aria-label="Pilih bagian sepatu untuk informasi">
            {shoePartsData.map((part) => {
              const color = PART_COLORS[part.id] ?? '#e94560';
              const isActive = selectedPart?.id === part.id;
              return (
                <button
                  key={part.id}
                  className={`part-pill-btn ${isActive ? 'active' : ''}`}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`Pilih bagian ${part.name}`}
                  style={{
                    '--pill-color': color,
                    '--pill-glow': `${color}66`,
                  }}
                  onClick={() => onSelectPart(part)}
                >
                  <span style={{ fontSize: '1rem' }}>{part.emoji}</span>
                  <span>{part.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3D Control Dock: 🔄 Putar & 🔍 Zoom */}
        {isTracking && (
          <div className="dock-3d-controls">
            {/* Tombol Putar */}
            <button
              className={`dock-btn ${isAutoRotate ? 'active' : ''}`}
              type="button"
              aria-pressed={isAutoRotate}
              onClick={onToggleAutoRotate}
              title="Toggle Rotasi Otomatis Sepatu"
            >
              <span>🔄 Putar</span>
              <span className="dock-badge">{isAutoRotate ? 'AUTO' : 'MANUAL'}</span>
            </button>

            {/* Tombol Zoom */}
            <div className="zoom-group">
              <button
                className="zoom-btn"
                type="button"
                onClick={onZoomOut}
                title="Perkecil ukuran sepatu"
                aria-label="Perkecil ukuran"
              >
                -
              </button>
              <span className="zoom-label">🔍 {Math.round(zoomLevel * 100)}%</span>
              <button
                className="zoom-btn"
                type="button"
                onClick={onZoomIn}
                title="Perbesar ukuran sepatu"
                aria-label="Perbesar ukuran"
              >
                +
              </button>
            </div>

            {/* Toggle Titik Marker */}
            <button
              className={`dock-btn ${showMarkers ? 'active' : ''}`}
              type="button"
              aria-pressed={showMarkers}
              onClick={onToggleMarkers}
              title="Tampilkan / Sembunyikan Titik Marker"
            >
              <span>📍 Titik</span>
            </button>

            {/* Reset Posisi */}
            <button
              className="dock-btn"
              type="button"
              onClick={onResetView}
              title="Reset ukuran dan rotasi tampilan"
              aria-label="Reset tampilan sepatu"
            >
              <span>⟲</span>
            </button>
          </div>
        )}
      </footer>

      {/* ── MODAL PREVIEW GAMBAR TARGET ── */}
      {showTargetModal && (
        <div className="target-modal-overlay" onClick={() => setShowTargetModal(false)}>
          <div
            className="target-modal"
            ref={targetModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="target-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="target-modal-title" style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.4rem' }}>
              🎯 Gambar Target Marker AR
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.84rem' }}>
              Arahkan kamera ke gambar di bawah untuk memunculkan <strong>{currentShoe?.name}</strong>.
              Tampilkan di layar perangkat lain atau cetak:
            </p>

            <img
              src="/targets/shoe-qr.png"
              alt="Gambar target marker 2D AR"
              className="target-modal-img"
            />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/target.html"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                Buka Tab Penuh ↗
              </a>

              <a
                href="/ar-catalog/index.html"
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  fontSize: '0.82rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                Versi A-Frame / AR.js ↗
              </a>

              <button
                className="btn btn-ghost"
                type="button"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                onClick={() => setShowTargetModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility alias
export const ARControls = AROverlay;
export const EducationPanel = Integrated3DEduCard;
