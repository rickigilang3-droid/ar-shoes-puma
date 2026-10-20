import React, { useState } from 'react';
import { formatPrice } from '../data/products';

function getColorwayDescription(color) {
  if (!color) return '';
  if (color.description) return color.description;

  const marketLabel = color.marketName ? `Referensi nama colorway: ${color.marketName}. ` : '';
  const isSimulation = color.name.toLowerCase().includes('simulasi');

  if (color.modelUrl) {
    return `${marketLabel}Menggunakan model 3D dan tekstur yang tersedia pada aset untuk pilihan ini.`;
  }
  if (color.textureUrl) {
    return `${marketLabel}Pratinjau memakai file tekstur khusus untuk warna ini, bukan sekadar mengganti satu warna pada seluruh sepatu.`;
  }
  if (color.materialsByName) {
    return `${marketLabel}${isSimulation ? 'Ini simulasi digital: warna utama diterapkan pada material model dan aksen sol disesuaikan terpisah. Hasilnya bukan SKU atau foto produk resmi.' : 'Warna diterapkan pada material model yang tersedia.'}`;
  }
  if (color.materials) {
    return `${marketLabel}${isSimulation ? 'Ini simulasi digital dengan warna upper, panel overlay, tali, dan sol yang diatur terpisah; bukan SKU atau foto produk resmi.' : 'Warna panel upper, overlay, tali, dan sol dipetakan terpisah pada pratinjau.'}`;
  }
  if (isSimulation) {
    return `${marketLabel}Ini simulasi tint pada material bertekstur yang sama, sehingga warna upper, detail, dan sol bisa ikut berubah. Bukan SKU atau foto produk resmi.`;
  }
  return `${marketLabel}Warna dan tekstur mengikuti tampilan aset model yang dipilih.`;
}

function ShoeEducationFacts({
  shoe,
  selectedColor,
  onSelectColor,
  selectedPart,
  selectedPartId,
  onSelectPart,
  onAddToCart,
  infoCardRef,
}) {
  const [activeTab, setActiveTab] = useState('part'); // 'part' | 'guide' | 'specs'
  const [selectedSize, setSelectedSize] = useState(null);

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
            File 3D tidak memuat label ukuran atau skala kaki yang terverifikasi. Jangan menebak ukuran dari tampilan model.
          </p>
        )}
        <p className="shoe-metadata-explanation">
          {shoe.sizeNote || 'Ukuran pada katalog adalah panduan. Cocokkan label sepatu dan size chart resmi untuk model yang tepat.'}
          {shoe.sizeOptions?.length && ' Angka cm adalah panjang kaki pada chart merek, bukan panjang insole atau jaminan stok ukuran.'}
        </p>
        <p className="shoe-metadata-explanation">
          Untuk memilih ukuran, ukur kedua kaki saat berdiri dari tumit ke ujung jari terpanjang; gunakan ukuran kaki yang lebih panjang, lalu cocokkan dengan size chart model dan wilayah yang tepat.
        </p>
        {shoe.sizeChartUrl && (
          <a className="shoe-size-chart-link" href={shoe.sizeChartUrl} target="_blank" rel="noreferrer">
            Lihat panduan ukuran resmi merek ↗
          </a>
        )}
        <button
          className="store-button store-button-dark shoe-add-to-cart"
          type="button"
          onClick={() => onAddToCart?.(activeSize, selectedColor)}
          disabled={!shoe.price}
        >
          Tambahkan ke keranjang <span aria-hidden="true">＋</span>
        </button>
        <p className="shoe-cart-demo-note">
          Keranjang dan checkout hanya simulasi; belum ada transaksi atau pembayaran.
        </p>
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
              <h3>{selectedPart?.name ?? 'Pilih bagian sepatu'}</h3>
            </div>

            {/* Quick Part Chip Selector - Agar pembeli langsung tahu ada bagian apa aja */}
            <div className="shoe-parts-pill-nav" role="tablist" aria-label="Daftar semua bagian sepatu">
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
              <div className="shoe-part-data-grid">
                <div className="shoe-part-data-item">
                  <span className="shoe-data-label">FUNGSI UTAMA</span>
                  <p>{selectedPart.function}</p>
                </div>
                <div className="shoe-part-data-item">
                  <span className="shoe-data-label">MATERIAL & BAHAN</span>
                  <p>{selectedPart.material}</p>
                </div>
                <div className="shoe-part-data-item">
                  <span className="shoe-data-label">CIRI KHAS & CARA CEK</span>
                  <p>{selectedPart.description}</p>
                </div>
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
          <div className="shoe-tab-pane is-active" role="tabpanel">
            <div className="shoe-pane-header">
              <span className="store-eyebrow">CARA MENGENALI KEASLIAN</span>
              <h3>3 Ciri Khas Siluet {shoe.name}</h3>
            </div>
            {shoe.releaseYear && (
              <div className="shoe-guide-release-note">
                <span className="shoe-guide-release-badge">SEJARAH RILIS</span>
                <p>Siluet ini pertama kali dirilis pada tahun <strong>{shoe.releaseYear}</strong> dan menjadi salah satu siluet paling berpengaruh.</p>
              </div>
            )}
            <ol className="shoe-compact-guide-list">
              {shoe.learningGuide.map((step, idx) => (
                <li key={step.title} className="shoe-compact-guide-item">
                  <span className="shoe-guide-badge">0{idx + 1}</span>
                  <div>
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
          <div className="shoe-tab-pane is-active" role="tabpanel">
            <div className="shoe-pane-header">
              <span className="store-eyebrow">TENTANG SILUET</span>
              <h3>Karakteristik Desain</h3>
            </div>
            <p className="shoe-specs-intro">{shoe.description}</p>
            <dl className="shoe-specs-compact-dl">
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
