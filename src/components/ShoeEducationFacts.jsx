import React, { useState } from 'react';
import { formatPrice } from '../data/products';

function getColorwayDescription(color) {
  if (!color) return '';
  if (color.description) return color.description;

  const marketLabel = color.marketName ? `Referensi: ${color.marketName}. ` : '';

  if (color.modelUrl) {
    return `${marketLabel}Edisi model 3D khusus dengan tekstur material autentik.`;
  }
  if (color.textureUrl) {
    return `${marketLabel}Tekstur material presisi tinggi untuk varian warna ini.`;
  }
  if (color.materialsByName || color.materials) {
    return `${marketLabel}Kombinasi warna upper, overlay, tali, dan sol disesuaikan secara proporsional.`;
  }
  return `${marketLabel}Warna dan tekstur mengikuti tampilan resmi model terpilih.`;
}

function ShoeEducationFacts({
  shoe,
  selectedColor,
  onSelectColor,
  selectedPart,
  selectedPartId,
  onSelectPart,
  onAddToCart,
  onBuyNow,
  infoCardRef,
  selectedPartTitleRef,
}) {
  const [activeTab, setActiveTab] = useState('part'); // 'part' | 'guide' | 'specs'
  const [selectedSize, setSelectedSize] = useState(null);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const handleAddToCart = () => {
    if (!shoe.price) return;
    setIsAddedFeedback(true);
    onAddToCart?.(activeSize, selectedColor);
    setTimeout(() => setIsAddedFeedback(false), 2200);
  };

  const handleBuyNow = () => {
    if (!shoe.price) return;
    onBuyNow?.(activeSize, selectedColor);
  };

  const priceFormatted = shoe.price ? formatPrice(shoe.price) : 'Belum tersedia';
  const colorwayDescription = getColorwayDescription(selectedColor);
  const activeSize = selectedSize?.shoeId === shoe.id
    ? selectedSize.size
    : shoe.sizeOptions?.[4] ?? shoe.sizeOptions?.[0] ?? null;

  return (
    <aside className="shoe-facts-sidebar" aria-label={`Edukasi dan detail produk ${shoe.name}`}>
      {/* 1. Header & Single Clear Price + Release Year */}
      <div className="shoe-sidebar-pricing">
        <div className="shoe-price-main">
          <span className="shoe-price-label">
            {shoe.priceDetails ? 'HARGA RESMI INDONESIA' : shoe.price ? 'HARGA REFERENSI KATALOG' : 'HARGA BELUM TERSEDIA'}
          </span>
          {!shoe.priceDetails && <div className="shoe-price-value">{priceFormatted}</div>}
        </div>
        <div className="shoe-market-badge">
          <div className="shoe-badge-row">
            <span className="shoe-market-pill">PASAR INDONESIA</span>
            {shoe.releaseYear && (
              <span className="shoe-release-pill">RILIS {shoe.releaseYear}</span>
            )}
          </div>
          <small>
            {shoe.priceNote
              ? shoe.priceNote
              : shoe.priceDetails
              ? 'Harga dalam rupiah; cek sumber resmi untuk harga terbaru.'
              : shoe.price
                ? 'Bukan jaminan harga terkini di toko.'
                : 'Harga tidak tercantum pada aset model.'}
          </small>
        </div>
      </div>
      {shoe.priceDetails ? (
        <div className="shoe-official-prices" aria-label={`Harga resmi ${shoe.name}`}>
          <div>
            <span>HARGA RESMI INDONESIA SAAT INI</span>
            <p>{shoe.priceDetails.currentIndonesia}</p>
          </div>
          <div>
            <span>HARGA RILIS RESMI DI INDONESIA</span>
            <p>{shoe.priceDetails.releaseIndonesia}</p>
          </div>
          {shoe.priceDetails.sourceUrl && (
            <a href={shoe.priceDetails.sourceUrl} target="_blank" rel="noreferrer">
              {shoe.priceDetails.sourceLabel || 'Buka sumber resmi'} ↗
            </a>
          )}
        </div>
      ) : !shoe.price && (
        <p className="shoe-metadata-explanation">
          Halaman ini untuk edukasi, bukan listing jual. Harga perlu dicocokkan dengan nama model, SKU/colorway, kondisi barang, wilayah, dan waktu pembelian.
        </p>
      )}

      {/* 2. Colorway Selector */}
      <div className="shoe-sidebar-section shoe-color-section">
        <div className="shoe-section-head">
          <span className="shoe-section-title">WARNA / COLORWAY</span>
          <span className="shoe-section-selected">{selectedColor?.name || 'Default'}</span>
        </div>
        <div className="shoe-colors-compact" role="radiogroup" aria-label="Pilih varian warna">
          {shoe.modelColors.map((color) => {
            const isSelected = Boolean(
              selectedColor && (
                selectedColor === color ||
                selectedColor.name === color.name ||
                selectedColor.hex === color.hex
              )
            );
            const swatchBg = color.accentHex && color.accentHex !== color.hex
              ? `linear-gradient(135deg, ${color.hex} 50%, ${color.accentHex} 50%)`
              : color.hex;

            return (
              <button
                key={color.name}
                type="button"
                className={`shoe-swatch-chip ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectColor?.(color)}
                aria-checked={isSelected}
                role="radio"
                title={`${color.name}${color.marketName ? ` (${color.marketName})` : ''}`}
              >
                <span className="shoe-swatch-circle" style={{ background: swatchBg }} />
                <span className="shoe-swatch-name">{color.name.split(' (')[0]}</span>
                {isSelected && <span className="shoe-swatch-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
        {colorwayDescription && <p className="shoe-model-color-note">{colorwayDescription}</p>}
      </div>

      {/* 3. Indonesian Market Size (EU & CM) */}
      <div className="shoe-sidebar-section shoe-size-section">
        <div className="shoe-section-head">
          <span className="shoe-section-title">
            {shoe.sizeOptions?.length ? 'REFERENSI UKURAN EU & CM' : 'PANDUAN UKURAN'}
          </span>
          <span className="shoe-section-selected">
            {activeSize ? `EU ${activeSize.eu} · ${activeSize.cm} cm` : 'Belum tersedia'}
          </span>
        </div>
        {shoe.sizeOptions?.length ? (
          <div className="shoe-sizes-grid" role="group" aria-label="Pilih ukuran sepatu">
            {shoe.sizeOptions.map((size) => {
              const isSelected = activeSize?.eu === size.eu;
              return (
                <button
                  key={size.eu}
                  type="button"
                  className={`shoe-size-pill ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedSize({ shoeId: shoe.id, size })}
                  aria-pressed={isSelected}
                  title={`Ukuran EU ${size.eu} (Panjang kaki ${size.cm} cm)`}
                >
                  <span className="shoe-size-eu">{size.eu}</span>
                  <span className="shoe-size-cm">{size.cm} cm</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="shoe-metadata-explanation">
            File 3D tidak memuat label ukuran atau skala kaki yang terverifikasi.
          </p>
        )}

        <div className="shoe-size-helper-row">
          <button
            type="button"
            className="shoe-size-guide-toggle"
            onClick={() => setShowSizeGuide(!showSizeGuide)}
            aria-expanded={showSizeGuide}
          >
            <span aria-hidden="true">📏</span>
            <span>{showSizeGuide ? 'Tutup panduan ukuran' : 'Panduan ukur kaki & tips size'}</span>
            <span className="shoe-guide-chevron" aria-hidden="true">{showSizeGuide ? '▲' : '▼'}</span>
          </button>
          {shoe.sizeChartUrl && (
            <a className="shoe-size-chart-link" href={shoe.sizeChartUrl} target="_blank" rel="noreferrer">
              Size chart resmi merek ↗
            </a>
          )}
        </div>

        {showSizeGuide && (
          <div className="shoe-size-guide-drawer">
            <p><strong>Tips Pengukuran:</strong> Ukur telapak kaki dari ujung tumit hingga ujung jari terpanjang saat berdiri tegak. Gunakan angka centimeter (cm) terpanjang dan cocokkan dengan pilihan EU di atas.</p>
            <small>{shoe.sizeNote || 'Ukuran pada katalog adalah standar pasar Indonesia.'}</small>
          </div>
        )}
      </div>

      {/* 4. Luxury Action & Purchase Card */}
      <div className="shoe-purchase-card" style={{ '--card-accent': shoe.accent || '#d5ff3f' }}>
        <div className="shoe-purchase-summary">
          <div className="shoe-purchase-meta">
            <span className="shoe-purchase-tag">PILIHAN AKTIF</span>
            <div className="shoe-purchase-selection">
              <span className="shoe-selection-size-badge">
                {activeSize ? `EU ${activeSize.eu} · ${activeSize.cm} cm` : 'Pilih Ukuran'}
              </span>
              <span className="shoe-purchase-dot">•</span>
              <span className="shoe-selection-color-name">
                {selectedColor?.name?.split(' (')[0] || 'Default'}
              </span>
            </div>
          </div>
          <div className="shoe-purchase-price">
            <span className="shoe-purchase-price-label">HARGA SATUAN</span>
            <div className="shoe-purchase-price-val">{priceFormatted}</div>
          </div>
        </div>

        <div className="shoe-purchase-actions">
          <button
            className={`shoe-btn-add-cart ${isAddedFeedback ? 'is-success' : ''}`}
            type="button"
            onClick={handleAddToCart}
            disabled={!shoe.price}
            aria-live="polite"
          >
            {isAddedFeedback ? (
              <>
                <span className="shoe-action-check" aria-hidden="true">✓</span>
                <span className="shoe-btn-label">Berhasil Ditambahkan!</span>
              </>
            ) : (
              <>
                <svg className="shoe-action-bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="shoe-btn-label">Tambahkan ke Keranjang</span>
                <span className="shoe-btn-accent-plus" aria-hidden="true">＋</span>
              </>
            )}
          </button>

          <button
            className="shoe-btn-buy-now"
            type="button"
            onClick={handleBuyNow}
            disabled={!shoe.price}
            title="Langsung menuju proses pengiriman dan pembayaran"
          >
            <span className="shoe-btn-bolt" aria-hidden="true">⚡</span>
            <span className="shoe-btn-label">Beli Sekarang</span>
          </button>
        </div>

        {/* Studio Guarantee & Feature Pills */}
        <div className="shoe-trust-grid">
          <div className="shoe-trust-pill">
            <span className="shoe-trust-icon" aria-hidden="true">🛡️</span>
            <span>Original 3D Spec</span>
          </div>
          <div className="shoe-trust-pill">
            <span className="shoe-trust-icon" aria-hidden="true">📦</span>
            <span>Bebas Ongkir Seluruh RI</span>
          </div>
          <div className="shoe-trust-pill">
            <span className="shoe-trust-icon" aria-hidden="true">🔄</span>
            <span>Garansi Ukuran Pas</span>
          </div>
        </div>

        
      </div>

      {/* 4. Tab Navigation (Detail Bagian | Panduan Edukasi | Spesifikasi) */}
      <div className="shoe-tabs-nav" role="tablist" aria-label="Navigasi edukasi">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'part'}
          className={`shoe-tab-btn ${activeTab === 'part' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('part')}
        >
          <span>01</span> DETAIL BAGIAN
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'guide'}
          className={`shoe-tab-btn ${activeTab === 'guide' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <span>02</span> EDUKASI SILUET
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'specs'}
          className={`shoe-tab-btn ${activeTab === 'specs' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          <span>03</span> SPESIFIKASI
        </button>
      </div>

      {/* 5. Tab Content Panel */}
      <div className="shoe-tab-content-wrap" ref={infoCardRef}>
        {/* Tab 1: Detail Bagian (Hotspot & Part Navigator) */}
        {activeTab === 'part' && (
          <div className="shoe-tab-pane is-active" role="tabpanel">
            <div className="shoe-pane-header">
              <span className="store-eyebrow">PILIH BAGIAN SEPATU ({shoe.parts.length} BAGIAN)</span>
              <h3 ref={selectedPartTitleRef}>{selectedPart?.name ?? 'Pilih bagian sepatu'}</h3>
              <p className="shoe-part-education-hint">
                Pilih bagian untuk melihat fungsi, bahan, dan ciri visualnya.
              </p>
            </div>

            {/* Quick Part Chip Selector - Agar pembeli langsung tahu ada bagian apa aja */}
            <div
              className="shoe-parts-pill-nav"
              role="group"
              aria-label="Daftar semua bagian sepatu"
              style={{ '--accent': shoe.accent }}
            >
              {shoe.parts.map((part, index) => {
                const isCurrent = (selectedPart?.id === part.id || selectedPartId === part.id);
                return (
                  <button
                    key={part.id}
                    type="button"
                    className={`shoe-part-pill-btn ${isCurrent ? 'is-active' : ''}`}
                    onClick={() => onSelectPart?.(part.id)}
                    aria-pressed={isCurrent}
                    title={`Lihat detail ${part.name}`}
                  >
                    <span className="shoe-part-pill-num">0{index + 1}</span>
                    <span className="shoe-part-pill-name">{part.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedPart ? (
              <div
                key={selectedPart.id}
                className="shoe-part-data-grid"
                aria-live="polite"
                style={{ '--part-accent': shoe.accent }}
              >
                <div className="shoe-part-data-item">
                  <span className="shoe-data-label">FUNGSI UTAMA</span>
                  <p>{selectedPart.function}</p>
                </div>
                <div className="shoe-part-data-item">
                  <span className="shoe-data-label">MATERIAL & BAHAN</span>
                  <p>{selectedPart.material}</p>
                </div>
                <div className="shoe-part-data-item shoe-part-observation">
                  <span className="shoe-data-label">CIRI KHAS & CARA CEK</span>
                  <p>{selectedPart.description}</p>
                </div>
                <p className="shoe-part-source-note">
                  Bahan dan konstruksi internal dapat berbeda menurut varian; model 3D hanya menunjukkan detail yang tampak.
                </p>
              </div>
            ) : (
              <p className="shoe-tab-placeholder">
                Pilih salah satu tombol bagian di atas atau sentuh titik hotspot pada model 3D untuk melihat fungsi dan detail materialnya.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Panduan Edukasi 3 Poin */}
        {activeTab === 'guide' && (
          <div
            className="shoe-tab-pane is-active shoe-guide-pane"
            role="tabpanel"
            style={{ '--story-accent': shoe.accent }}
          >
            <div className="shoe-pane-header">
              <span className="store-eyebrow">PANDUAN MENGAMATI DESAIN</span>
              <h3>Amati siluet {shoe.name}</h3>
            </div>
            {shoe.releaseYear && (
              <div className="shoe-guide-release-note">
                <span className="shoe-guide-release-badge">TAHUN REFERENSI</span>
                <p>Tahun yang dicantumkan untuk model ini: <strong>{shoe.releaseYear}</strong>. Tahun referensi bukan bukti keaslian suatu varian.</p>
              </div>
            )}
            <ol className="shoe-compact-guide-list" aria-label={`Panduan mengamati ${shoe.name}`}>
              {shoe.learningGuide.map((step, idx) => (
                <li key={step.title} className="shoe-compact-guide-item">
                  <span className="shoe-guide-badge">0{idx + 1}</span>
                  <div className="shoe-guide-story-card">
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tab 3: Spesifikasi */}
        {activeTab === 'specs' && (
          <div
            className="shoe-tab-pane is-active shoe-specs-pane"
            role="tabpanel"
            style={{ '--spec-accent': shoe.accent }}
          >
            <div className="shoe-pane-header">
              <span className="store-eyebrow">TENTANG SILUET</span>
              <h3>Ringkasan produk</h3>
            </div>
            <p className="shoe-specs-intro">{shoe.description}</p>
            {shoe.specsSourceUrl && (
              <a
                className="shoe-spec-source-link"
                href={shoe.specsSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Referensi lini resmi {shoe.brand} ↗
              </a>
            )}
            <dl className="shoe-specs-compact-dl" aria-label={`Spesifikasi ${shoe.name}`}>
              {shoe.specs.map(([label, val]) => (
                <div key={label} className="shoe-spec-row">
                  <dt>{label}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </aside>
  );
}

export default ShoeEducationFacts;
