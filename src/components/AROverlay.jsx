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

              <div className="edu-dot-nav">
                {shoePartsData.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`dot-step ${idx === currentIndex ? 'active' : ''}`}
                    aria-pressed={idx === currentIndex}
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

  return (
    <div className="ar-viewport">
      {/* ── TOP HEADER ── */}
      <header className="ar-header">
        <button className="ar-back-link" type="button" onClick={onBack}>
          ← AR SEPATU
        </button>

        <div className="ar-status-pill">
          <span className={`status-dot ${isTracking ? 'active' : 'searching'}`} />
          <span role="status" aria-live="polite">
            {isTracking ? (isModelReady ? 'Target dikenali · sepatu 3D aktif' : 'Target terkunci · memuat 3D…') : 'Mencari gambar target…'}
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
          <div className="viewfinder-text" role="status" aria-live="polite">Arahkan kamera ke gambar target</div>
          <div className="viewfinder-sub">Tampilkan seluruh kartu target di layar lain atau hasil cetak.</div>
        </div>
      )}

      {/* ── GESTURE HINT (Saat model aktif) ── */}
      {isTracking && !selectedPart && (
        <div className="ar-drag-hint">
          👆 Sentuh & geser layar untuk memutar sepatu · Tap titik untuk edukasi
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

      {/* ── BOTTOM DOCK CONTROLS & PARTS STRIP ── */}
      <footer className="ar-bottom-controls">
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
              <button className="zoom-btn" type="button" onClick={onZoomOut} title="Perkecil ukuran sepatu" aria-label="Perkecil ukuran">
                -
              </button>
              <span className="zoom-label">🔍 {Math.round(zoomLevel * 100)}%</span>
              <button className="zoom-btn" type="button" onClick={onZoomIn} title="Perbesar ukuran sepatu" aria-label="Perbesar ukuran">
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
            <button className="dock-btn" type="button" onClick={onResetView} title="Reset ukuran dan orientasi" aria-label="Reset tampilan sepatu">
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
              🎯 Gambar Target AR
            </h3>
            <p style={{ color: '#a0a0b0', fontSize: '0.84rem' }}>
              Tampilkan gambar ini di layar lain atau cetak, lalu arahkan kamera ke seluruh kartu:
            </p>

            <img
              src="/targets/shoe-qr.png"
              alt="Gambar target untuk AR Puma Suede"
              className="target-modal-img"
            />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <a
                href="/target.html"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                Buka Tab Penuh ↗
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
