import React, { useState } from 'react';
import './LandingPage.css';
import { shoePartsData } from '../data/shoeData';

/* ── Part accent colors ── */
const PART_CSS = {
  upper:   'var(--col-upper)',
  midsole: 'var(--col-midsole)',
  outsole: 'var(--col-outsole)',
  insole:  'var(--col-insole)',
  tongue:  'var(--col-tongue)',
  heel:    'var(--col-heel)',
};

/* ── Material Icon helper ── */
const Icon = ({ name, size = 20, fill = 0, className = '' }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}` }}
  >
    {name}
  </span>
);

function LandingPage({ onStartAR }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="lp">
      {/* ════════════════════════════════════════
          NAV
      ════════════════════════════════════════ */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          {/* Logo */}
          <a className="lp-logo" href="#overview">
            <svg className="lp-logo-mark" viewBox="0 0 24 9" fill="none">
              <path fill="currentColor" d="M24 0.5C14.7 4.1 6.8 6.5 0 7.8c3.2-1.9 6.2-4.1 9.1-6.7C6.5 2.1 3.5 3.8 0 5.4c8.4 2.8 17.5 1.5 24-4.9z" />
            </svg>
            <span className="lp-logo-text">AR // SHOES</span>
          </a>

          {/* Status chip */}
          <div className="lp-status-chip">
            <span className="lp-status-dot" />
            <span>WebAR AKTIF // TRACKING OK</span>
          </div>

          {/* Desktop nav */}
          <nav className="lp-nav-links">
            <a href="#overview">Overview</a>
            <a href="#cara-pakai">Cara Pakai</a>
            <a href="#scan-portal">Scan Portal</a>
            <a href="#lab-tech">Teknologi</a>
          </nav>

          {/* CTA */}
          <button className="lp-btn lp-btn-primary" onClick={onStartAR}>
            <Icon name="photo_camera" size={18} />
            Launch AR Scanner
          </button>

          {/* Mobile hamburger */}
          <button className="lp-hamburger" onClick={() => setNavOpen(v => !v)} aria-label="Menu">
            <Icon name={navOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="lp-nav-drawer">
            <a href="#overview" onClick={() => setNavOpen(false)}>Overview</a>
            <a href="#cara-pakai" onClick={() => setNavOpen(false)}>Cara Pakai</a>
            <a href="#scan-portal" onClick={() => setNavOpen(false)}>Scan Portal</a>
            <a href="#lab-tech" onClick={() => setNavOpen(false)}>Teknologi</a>
            <button className="lp-btn lp-btn-primary" style={{ marginTop: '.5rem' }} onClick={() => { setNavOpen(false); onStartAR(); }}>
              <Icon name="photo_camera" size={18} />
              Launch AR Scanner
            </button>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="lp-hero" id="overview">
        {/* Grid bg */}
        <div className="lp-grid-bg" />

        <div className="lp-hero-inner">
          {/* Left: copy */}
          <div className="lp-hero-copy">
            {/* Badge */}
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              <span className="lp-badge-label">WEBGL // MINDAR // READY</span>
              <span className="lp-badge-sep">|</span>
              <span className="lp-badge-sub">Puma Suede Classic AR</span>
            </div>

            <h1 className="lp-hero-h1">
              KENALI<br />
              PUMA SUEDE<br />
              <span className="lp-hero-accent">SECARA AR</span>
            </h1>

            <p className="lp-hero-sub">
              Scan gambar sepatu, lihat model 3D Puma Suede muncul di dunia nyata, 
              lalu tap setiap bagian untuk membaca informasi edukatif — langsung dari browser.
            </p>

            <div className="lp-hero-ctas">
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={onStartAR}>
                <Icon name="photo_camera" size={20} fill={1} />
                Mulai Scan AR
              </button>
              <a
                className="lp-btn lp-btn-outline lp-btn-lg"
                href="/target.html"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="qr_code" size={20} />
                Target QR
              </a>
            </div>

            {/* Stats row */}
            <div className="lp-hero-stats">
              <div className="lp-stat">
                <span className="lp-stat-val">6</span>
                <span className="lp-stat-lbl">Bagian Sepatu</span>
              </div>
              <div className="lp-stat-sep" />
              <div className="lp-stat">
                <span className="lp-stat-val">3D</span>
                <span className="lp-stat-lbl">Real-time Render</span>
              </div>
              <div className="lp-stat-sep" />
              <div className="lp-stat">
                <span className="lp-stat-val">0</span>
                <span className="lp-stat-lbl">Aplikasi Install</span>
              </div>
            </div>
          </div>

          {/* Right: HUD visual */}
          <div className="lp-hero-visual">
            {/* Glow */}
            <div className="lp-hud-glow" />

            {/* Phone shell */}
            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lp-phone-screen">
                {/* Top bar */}
                <div className="lp-phone-bar">
                  <span className="lp-phone-bar-left">
                    <span className="lp-phone-bar-dot" />
                    AR AKTIF
                  </span>
                  <span className="lp-phone-bar-right">
                    <Icon name="rotate_3d" size={12} />
                    Puma Suede
                  </span>
                </div>

                {/* AR canvas */}
                <div className="lp-phone-canvas">
                  <div className="lp-phone-grid" />
                  {/* Scan corners */}
                  <div className="lp-scan-frame">
                    <div className="lp-corner lp-corner-tl" />
                    <div className="lp-corner lp-corner-tr" />
                    <div className="lp-corner lp-corner-bl" />
                    <div className="lp-corner lp-corner-br" />
                  </div>
                  {/* Shoe emoji 3D stand-in */}
                  <span className="lp-shoe-float">👟</span>

                  {/* Annotation hotspots */}
                  <div className="lp-hotspot lp-hs-upper">
                    <div className="lp-hs-dot" style={{ '--hs-c': 'var(--col-upper)' }} />
                    <span className="lp-hs-label">Upper</span>
                  </div>
                  <div className="lp-hotspot lp-hs-mid">
                    <div className="lp-hs-dot" style={{ '--hs-c': 'var(--col-midsole)' }} />
                    <span className="lp-hs-label">Midsole</span>
                  </div>
                  <div className="lp-hotspot lp-hs-out">
                    <div className="lp-hs-dot" style={{ '--hs-c': 'var(--col-outsole)' }} />
                    <span className="lp-hs-label">Outsole</span>
                  </div>

                  {/* Info chip */}
                  <div className="lp-info-chip">
                    <strong>MIDSOLE</strong>
                    Bantalan tengah untuk menyerap benturan saat berjalan &amp; berlari.
                  </div>
                </div>

                {/* Bottom controls bar */}
                <div className="lp-phone-controls">
                  <span><Icon name="rotate_left" size={14} /> Putar</span>
                  <span><Icon name="zoom_in" size={14} /> Zoom</span>
                  <span><Icon name="touch_app" size={14} /> Tap</span>
                </div>
              </div>
            </div>

            {/* Floating HUD badges */}
            <div className="lp-hud-badge lp-hud-badge-1">
              <Icon name="sensors" size={14} fill={1} />
              <div>
                <div className="lp-hud-b-title">LiDAR TRACKING</div>
                <div className="lp-hud-b-val">LOCK // 98.4%</div>
              </div>
            </div>
            <div className="lp-hud-badge lp-hud-badge-2">
              <Icon name="view_in_ar" size={14} fill={1} />
              <div>
                <div className="lp-hud-b-title">WebAR PROJECTION</div>
                <div className="lp-hud-b-val">ACTIVE // 60FPS</div>
              </div>
            </div>

            {/* Rotation gimbal */}
            <div className="lp-gimbal">
              <div className="lp-gimbal-ring lp-gimbal-outer" />
              <div className="lp-gimbal-ring lp-gimbal-mid" />
              <div className="lp-gimbal-dot" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          QR SCAN PORTAL
      ════════════════════════════════════════ */}
      <section className="lp-section lp-section-alt" id="scan-portal">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-eyebrow">
              <Icon name="qr_code_scanner" size={14} />
              SCAN PORTAL
            </div>
            <h2 className="lp-section-h2">Cara Menggunakan<br />AR Shoes</h2>
            <p className="lp-section-sub">
              Tidak perlu install aplikasi. Cukup buka browser, scan gambar, dan eksplorasi.
            </p>
          </div>

          <div className="lp-portal-grid">
            {/* QR card */}
            <div className="lp-qr-card">
              <div className="lp-qr-laser" />
              <div className="lp-qr-corners">
                <div className="lp-qrc lp-qrc-tl" />
                <div className="lp-qrc lp-qrc-tr" />
                <div className="lp-qrc lp-qrc-bl" />
                <div className="lp-qrc lp-qrc-br" />
              </div>
              <img
                src="/targets/shoe-qr.png"
                alt="Scan target QR sepatu"
                className="lp-qr-img"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div className="lp-qr-overlay-text">
                <Icon name="qr_code" size={16} fill={1} />
                SCAN TARGET
              </div>
              <button className="lp-qr-sim-btn" onClick={() => setModalOpen(true)}>
                <Icon name="fullscreen" size={14} />
                Test Simulator
              </button>
            </div>

            {/* Steps */}
            <div className="lp-steps">
              {[
                {
                  n: '01', icon: 'qr_code_scanner', title: 'Scan Target',
                  desc: 'Arahkan kamera ke gambar target sepatu. MindAR mendeteksi marker dan mengunci posisi 3D.',
                  compat: ['Chrome', 'Safari', 'Edge'],
                },
                {
                  n: '02', icon: 'view_in_ar', title: 'Instant WebAR',
                  desc: 'Model Puma Suede 3D langsung muncul di atas gambar. Rotate dan zoom dengan gesture.',
                  compat: ['Android', 'iOS 15+', 'Desktop'],
                },
                {
                  n: '03', icon: 'touch_app', title: 'Project & Learn',
                  desc: 'Tap titik marker pada bagian sepatu — Upper, Midsole, Outsole, dll — untuk membaca info edukatif.',
                  compat: ['Upper', 'Midsole', 'Outsole', '+3'],
                },
              ].map(s => (
                <div className="lp-step" key={s.n}>
                  <div className="lp-step-num">
                    <Icon name={s.icon} size={18} fill={1} />
                  </div>
                  <div className="lp-step-body">
                    <div className="lp-step-title">
                      <span className="lp-step-n">{s.n}</span>
                      {s.title}
                    </div>
                    <p className="lp-step-desc">{s.desc}</p>
                    <div className="lp-compat-bar">
                      {s.compat.map(c => <span key={c} className="lp-compat-chip">{c}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          INNOVATION / TECH CARDS
      ════════════════════════════════════════ */}
      <section className="lp-section" id="lab-tech">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-eyebrow">
              <Icon name="science" size={14} />
              TEKNOLOGI
            </div>
            <h2 className="lp-section-h2">Inovasi dalam<br />AR Shoes Lab</h2>
            <p className="lp-section-sub">
              Dibangun dengan teknologi web terkini untuk pengalaman AR yang mulus di smartphone manapun.
            </p>
          </div>

          <div className="lp-tech-grid">
            {[
              {
                icon: 'straighten', iconFill: 1,
                tag: 'PRESISI',
                title: 'Skala 1:1\nReal-world',
                desc: 'Model 3D Puma Suede ditampilkan dengan skala proporsional menggunakan koordinat ruang nyata lewat MindAR image tracking.',
                stat: '< 2mm error',
              },
              {
                icon: 'track_changes', iconFill: 1,
                tag: 'TRACKING',
                title: 'Real-Time\nImage Lock',
                desc: 'Algoritma NFT (Natural Feature Tracking) MindAR.js mendeteksi dan mengunci posisi gambar secara real-time tanpa QR code khusus.',
                stat: '60 FPS stable',
              },
              {
                icon: 'touch_app', iconFill: 1,
                tag: 'INTERAKTIF',
                title: 'Highlight per\nBagian Sepatu',
                desc: 'Setiap komponen — Upper, Tongue, Insole, Midsole, Outsole, Heel — memiliki marker warna unik dan panel info tersendiri.',
                stat: '6 komponen',
              },
            ].map(card => (
              <div className="lp-tech-card" key={card.tag}>
                <div className="lp-tech-card-top">
                  <div className="lp-tech-icon">
                    <Icon name={card.icon} size={22} fill={card.iconFill} />
                  </div>
                  <span className="lp-tech-tag">{card.tag}</span>
                </div>
                <h3 className="lp-tech-title">{card.title}</h3>
                <p className="lp-tech-desc">{card.desc}</p>
                <div className="lp-tech-stat">
                  <Icon name="speed" size={12} fill={1} />
                  {card.stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SHOE PARTS SHOWCASE
      ════════════════════════════════════════ */}
      <section className="lp-section lp-section-alt" id="cara-pakai">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <div className="lp-eyebrow">
              <Icon name="school" size={14} />
              EDUKASI INTERAKTIF
            </div>
            <h2 className="lp-section-h2">6 Bagian Sepatu<br />yang Bisa Dijelajahi</h2>
            <p className="lp-section-sub">
              Tap setiap marker dalam mode AR untuk membaca fungsi, material, dan keunikan setiap bagian Puma Suede.
            </p>
          </div>

          <div className="lp-parts-grid">
            {shoePartsData.map(p => (
              <div
                key={p.id}
                className="lp-part-card"
                style={{ '--pc': PART_CSS[p.id] }}
              >
                <div className="lp-part-card-accent" />
                <div className="lp-part-header">
                  <div className="lp-part-dot" />
                  <span className="lp-part-emoji">{p.emoji}</span>
                  <span className="lp-part-name">{p.name}</span>
                </div>
                <p className="lp-part-func">{p.function}</p>
                <div className="lp-part-footer">
                  <Icon name="touch_app" size={12} />
                  Tap dalam AR
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════ */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-eyebrow">
            <span className="lp-badge-dot" />
            SIAP UNTUK DICOBA
          </div>
          <h2 className="lp-cta-h2">Mulai Pengalaman AR<br />Sekarang</h2>
          <p className="lp-cta-sub">
            Tidak perlu install. Tidak perlu daftar. Cukup buka browser dan mulai scan — 
            pengalaman belajar sepatu yang belum pernah ada sebelumnya.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={onStartAR}>
              <Icon name="photo_camera" size={20} fill={1} />
              Mulai Scan AR
            </button>
            <a className="lp-btn lp-btn-outline lp-btn-lg" href="/target.html" target="_blank" rel="noreferrer">
              <Icon name="open_in_new" size={18} />
              Lihat QR Target
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <a className="lp-logo" href="#overview">
              <svg className="lp-logo-mark" viewBox="0 0 24 9" fill="none">
                <path fill="currentColor" d="M24 0.5C14.7 4.1 6.8 6.5 0 7.8c3.2-1.9 6.2-4.1 9.1-6.7C6.5 2.1 3.5 3.8 0 5.4c8.4 2.8 17.5 1.5 24-4.9z" />
              </svg>
              <span className="lp-logo-text">AR // SHOES</span>
            </a>
            <span className="lp-footer-sub">Puma Suede AR Lab</span>
          </div>
          <div className="lp-footer-copy">
            © 2024 AR Shoes · Dibuat dengan React + MindAR.js + Three.js
          </div>
          <div className="lp-footer-tech">
            <span className="lp-compat-chip">React 19</span>
            <span className="lp-compat-chip">MindAR 1.2</span>
            <span className="lp-compat-chip">Three.js</span>
            <span className="lp-compat-chip">Vite</span>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════
          MODAL (QR Simulator)
      ════════════════════════════════════════ */}
      {modalOpen && (
        <div className="lp-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <div className="lp-eyebrow" style={{ marginBottom: 0 }}>
                <Icon name="view_in_ar" size={14} fill={1} />
                SIMULATOR — AR SCAN TARGET
              </div>
              <button className="lp-modal-close" onClick={() => setModalOpen(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="lp-modal-body">
              <p className="lp-modal-hint">
                Cetak atau tampilkan gambar ini di layar lain, lalu arahkan kamera AR untuk menguji.
              </p>
              <div className="lp-modal-qr-wrap">
                <img src="/targets/shoe-qr.png" alt="Target scan AR" className="lp-modal-qr-img" />
              </div>
              <div className="lp-modal-actions">
                <button className="lp-btn lp-btn-primary" onClick={() => { setModalOpen(false); onStartAR(); }}>
                  <Icon name="photo_camera" size={18} fill={1} />
                  Buka AR Scanner
                </button>
                <a className="lp-btn lp-btn-outline" href="/targets/shoe-qr.png" download>
                  <Icon name="download" size={18} />
                  Unduh Target
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
