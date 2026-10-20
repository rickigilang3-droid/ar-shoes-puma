import React, { useState } from 'react';
import './ShoeStore.css';
import { formatPrice, shoes } from '../data/products';

function ShoeCatalogPage({ onOpenShoe, onStartAR, onCompare }) {
  const [compareIds, setCompareIds] = useState([]);

  const toggleCompare = (shoeId) => {
    setCompareIds((current) => {
      if (current.includes(shoeId)) return current.filter((id) => id !== shoeId);
      if (current.length >= 2) return current;
      return [...current, shoeId];
    });
  };

  return (
    <main className="shoe-store shoe-catalog-page">
      <header className="store-header catalog-header">
        <a className="store-wordmark" href="/">
          <span className="store-mark" aria-hidden="true">N</span>
          <span>AR SOLE <small>STUDIO</small></span>
        </a>
        <nav className="store-header-nav catalog-header-nav" aria-label="Navigasi utama">
          <a className="catalog-nav-link" href="#collection">Koleksi</a>
          <a className="catalog-nav-link" href="#experience">Pengalaman</a>
          <button className="store-header-ar catalog-ar-button" type="button" onClick={onStartAR}>
            <span aria-hidden="true">◉</span> Coba demo AR
          </button>
        </nav>
      </header>

      <section className="catalog-hero" aria-labelledby="catalog-hero-title">
        <div className="catalog-hero-copy">
          <p className="store-eyebrow"><span className="catalog-live-dot" /> AR SHOES STUDIO · 2026</p>
          <h1 id="catalog-hero-title">Setiap detail<br />punya <em>cerita.</em></h1>
          <p className="catalog-hero-description">
            Pilih siluet dan kenali konstruksi serta teknologi sepatu. Jelajahi model 3D di halaman detail.
          </p>
          <div className="catalog-hero-actions">
            <a className="catalog-primary-link" href="#collection">
              Jelajahi koleksi <span aria-hidden="true">↘</span>
            </a>
            <button className="catalog-text-button" type="button" onClick={onStartAR}>
              Buka pengalaman AR <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="catalog-hero-note">
            <span className="catalog-note-mark" aria-hidden="true">01</span>
            <p>Pilih siluet. Temukan konstruksi. Pahami karakter setiap sepatu.</p>
          </div>
        </div>

        <div className="catalog-hero-art">
          <span className="catalog-hero-shoe-badge">SILUET UTAMA · NIKE AF1 '07</span>
          <img
            className="catalog-hero-shoe-image"
            src="/images/nike-air-force-1.png"
            alt="Nike Air Force 1 '07 Triple White"
          />
        </div>
      </section>

      <section className="catalog-experience" id="experience" aria-label="Fitur pengalaman">
        <div><strong>{String(shoes.length).padStart(2, '0')}</strong><span>pilihan siluet</span></div>
        <div><strong>360°</strong><span>jelajahi model 3D</span></div>
        <div><strong>AR</strong><span>lihat melalui kamera</span></div>
        <p>BUKAN SEKADAR MELIHAT.<br />MENGERTI SETIAP BAGIAN.</p>
      </section>

      <section className="store-collection" id="collection">
        <div className="store-section-heading catalog-section-heading">
          <div>
            <p className="store-eyebrow">DARI COURT KE JALANAN</p>
            <h2>Pilih cerita<br className="catalog-heading-break" /> yang ingin kamu kenali<span>.</span></h2>
            <p className="catalog-section-description">
              Setiap model punya konstruksi dan karakter berbeda. Pilih satu untuk mulai melihat lebih dekat.
            </p>
          </div>
          <span className="store-count catalog-count">{String(shoes.length).padStart(2, '0')} MODEL<br />DALAM KOLEKSI</span>
        </div>

        <div className="store-product-grid catalog-product-grid">
          {shoes.map((shoe, index) => (
            <article className="store-product-card" key={shoe.id}>
              <button
                className="store-product-open catalog-product-open"
                onClick={() => onOpenShoe(shoe.id)}
                aria-label={`Buka detail ${shoe.name}`}
              >
                <div className={`shoe-art shoe-art-${index + 1}`} style={{ '--shoe-accent': shoe.accent }}>
                  <span className="shoe-art-index">MODEL 0{index + 1}</span>
                  <span className="shoe-art-caption">LIHAT DETAIL <span aria-hidden="true">↗</span></span>
                  <img
                    className="catalog-product-image"
                    src={shoe.image}
                    alt={`Foto ${shoe.name}`}
                    loading="lazy"
                  />
                </div>
                <div className="store-card-copy">
                  <div className="store-card-category">{shoe.category}</div>
                  <div className="store-card-title-row">
                    <div>
                      <h3>{shoe.name}</h3>
                      <p>{shoe.tagline}</p>
                    </div>
                  </div>
                  <div className="catalog-product-meta">
                    <span>{shoe.specs[0][1]}</span>
                    <span>
                      {shoe.sizeOptions?.length
                        ? `Ukuran ${shoe.sizeRange}`
                        : 'Panduan ukuran belum tersedia dari aset'}
                    </span>
                  </div>
                  <div className="catalog-product-bottom">
                    <span className="catalog-product-price">
                      {shoe.priceDetails
                        ? 'Status harga resmi Indonesia'
                        : shoe.price
                          ? 'Harga referensi'
                          : 'Harga belum tersedia'}
                      {shoe.price && <strong>{formatPrice(shoe.price)}</strong>}
                      {(shoe.priceDetails || shoe.priceNote || !shoe.price) && (
                        <small>
                          {shoe.priceNote ? 'Harga referensi, bukan harga resmi SKU' : 'Lihat sumber dan penjelasan di detail produk'}
                        </small>
                      )}
                    </span>
                    <ul className="store-card-colors" aria-label={`Warna pada model digital ${shoe.name}`}>
                      {shoe.modelColors.map((color) => (
                        <li key={color.name}>
                          <span
                            className="shoe-color-swatch"
                            style={{ '--swatch-color': color.hex }}
                            title={color.name}
                          />
                          <span className="store-card-color-name">{color.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
              <button
                className={`store-compare-toggle catalog-compare-toggle ${compareIds.includes(shoe.id) ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={compareIds.includes(shoe.id)}
                disabled={!compareIds.includes(shoe.id) && compareIds.length >= 2}
                onClick={() => toggleCompare(shoe.id)}
              >
                <span aria-hidden="true">{compareIds.includes(shoe.id) ? '✓' : '+'}</span>
                {compareIds.includes(shoe.id) ? 'Dipilih untuk dibandingkan' : 'Pilih untuk dibandingkan'}
              </button>
            </article>
          ))}
        </div>
        {compareIds.length > 0 && (
          <div className="store-compare-bar" aria-live="polite">
            <p>
              {compareIds.length === 2
                ? 'Dua model siap dibandingkan.'
                : 'Pilih satu model lagi untuk mulai membandingkan.'}
            </p>
            <div>
              <button
                className="store-compare-clear"
                type="button"
                onClick={() => setCompareIds([])}
              >
                Hapus pilihan
              </button>
              <button
                className="store-button store-button-dark"
                type="button"
                disabled={compareIds.length !== 2}
                onClick={() => onCompare(compareIds[0], compareIds[1])}
              >
                Bandingkan model
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="store-footer catalog-footer">
        <span>AR SOLE STUDIO</span>
        <span>EXPLORE THE FORM · UNDERSTAND THE DETAILS</span>
        <a href="#collection">KEMBALI KE KOLEKSI ↑</a>
      </footer>
    </main>
  );
}

export default ShoeCatalogPage;
