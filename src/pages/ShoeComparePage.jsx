import React, { useState } from 'react';
import ProductModelPreview from '../components/ProductModelPreview';
import { formatPrice, shoes } from '../data/products';
import './ShoeStore.css';

function CompareShoe({ shoe }) {
  const [showModel, setShowModel] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  return (
    <article className="compare-shoe">
      <div className="compare-preview-shell" style={{ '--shoe-accent': shoe.accent }}>
        {showModel ? (
          <ProductModelPreview
            shoe={shoe}
            className="compare-model"
            interactive
            loading="eager"
            selectedColor={selectedColor}
          />
        ) : (
          <button
            className="compare-preview-prompt"
            type="button"
            aria-expanded={false}
            onClick={() => setShowModel(true)}
          >
            <span aria-hidden="true">↻</span>
            Muat preview 3D
            <small>Model dimuat hanya saat diminta</small>
          </button>
        )}
      </div>
      <p className="store-eyebrow">{shoe.category}</p>
      <h2>{shoe.name}</h2>
      <p className="compare-tagline">{shoe.tagline}</p>
      <div className="compare-color-palette">
        <h3>Warna pada model digital</h3>
        <ul aria-label={`Palet warna model digital ${shoe.name}`}>
          {shoe.modelColors.map((color) => {
            const isSelected = Boolean(
              selectedColor && (
                selectedColor === color ||
                selectedColor.name === color.name ||
                selectedColor.hex === color.hex ||
                selectedColor === color.hex
              )
            );
            const swatchBg = color.accentHex && color.accentHex !== color.hex
              ? `linear-gradient(135deg, ${color.hex} 50%, ${color.accentHex} 50%)`
              : color.hex;

            return (
              <li key={color.name}>
                <button
                  type="button"
                  className={`shoe-color-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setShowModel(true);
                    setSelectedColor(isSelected ? null : color);
                  }}
                  aria-pressed={isSelected}
                  title={`Ganti warna ke ${color.name}${color.marketName ? ` (${color.marketName})` : ''}`}
                >
                  <span
                    className="shoe-color-swatch"
                    style={{ background: swatchBg, '--swatch-color': color.hex }}
                  />
                  <span className="shoe-color-info">
                    <span className="shoe-color-name">{color.name}</span>
                    {color.marketName && (
                      <span className="shoe-color-sku">{color.marketName}</span>
                    )}
                  </span>
                  {isSelected && <span className="shoe-color-check" aria-hidden="true">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function ShoeComparePage({ leftShoe, rightShoe, onBack, onSelectPair }) {
  const comparisonLabels = [
    ...new Set([...leftShoe.specs, ...rightShoe.specs].map(([label]) => label)),
  ];

  const changeShoe = (side, id) => {
    if (side === 'left') onSelectPair(id, rightShoe.id);
    else onSelectPair(leftShoe.id, id);
  };

  return (
    <main className="shoe-store shoe-compare-page">
      <header className="store-header">
        <button className="store-back-link" type="button" onClick={onBack}>
          ← <span>Koleksi</span>
        </button>
        <a className="store-wordmark" href="/" onClick={(event) => { event.preventDefault(); onBack(); }}>
          <span className="store-mark" aria-hidden="true">N</span>
          <span>AR SOLE <small>STUDIO</small></span>
        </a>
        <span className="store-detail-counter">BANDINGKAN</span>
      </header>

      <section className="compare-heading">
        <p className="store-eyebrow">SIDE BY SIDE</p>
        <h1>Temukan bedanya<span>.</span></h1>
        <p>Pilih preview 3D kalau ingin memutar model. File besar dimuat hanya setelah diminta.</p>
        <p className="compare-price-note">
          Harga di tabel adalah rentang ilustrasi untuk edukasi, bukan harga resmi atau real-time.
        </p>
      </section>

      <section className="compare-products" aria-label="Model yang dibandingkan">
        {[['left', leftShoe, rightShoe], ['right', rightShoe, leftShoe]].map(
          ([side, shoe, otherShoe]) => (
            <div className="compare-product-column" key={side}>
              <label className="compare-select-label" htmlFor={`compare-${side}`}>
                Model {side === 'left' ? 'pertama' : 'kedua'}
              </label>
              <select
                id={`compare-${side}`}
                value={shoe.id}
                onChange={(event) => changeShoe(side, event.target.value)}
              >
                {shoes.filter((item) => item.id !== otherShoe.id).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <CompareShoe key={shoe.id} shoe={shoe} />
            </div>
          ),
        )}
      </section>

      <section className="compare-specs" aria-labelledby="compare-specs-title">
        <h2 id="compare-specs-title">Spesifikasi & karakteristik</h2>
        <div className="compare-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Detail</th>
                <th scope="col">{leftShoe.name}</th>
                <th scope="col">{rightShoe.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Harga Resmi</th>
                <td>{leftShoe.price ? formatPrice(leftShoe.price) : 'Belum ditentukan'}</td>
                <td>{rightShoe.price ? formatPrice(rightShoe.price) : 'Belum ditentukan'}</td>
              </tr>
              <tr>
                <th scope="row">Rentang ukuran contoh</th>
                <td>{leftShoe.sizeRange}<br /><small>{leftShoe.sizeNote}</small></td>
                <td>{rightShoe.sizeRange}<br /><small>{rightShoe.sizeNote}</small></td>
              </tr>
              <tr>
                <th scope="row">Warna pada model digital</th>
                <td>{leftShoe.modelColors.map((color) => color.name).join(', ')}</td>
                <td>{rightShoe.modelColors.map((color) => color.name).join(', ')}</td>
              </tr>
              <tr>
                <th scope="row">Gambaran</th>
                <td>{leftShoe.description}</td>
                <td>{rightShoe.description}</td>
              </tr>
              {comparisonLabels.map((label) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{leftShoe.specs.find(([itemLabel]) => itemLabel === label)?.[1] ?? '—'}</td>
                  <td>{rightShoe.specs.find(([itemLabel]) => itemLabel === label)?.[1] ?? '—'}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Bagian edukasi</th>
                <td>{leftShoe.parts.length} hotspot bagian</td>
                <td>{rightShoe.parts.length} hotspot bagian</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="store-footer">
        <span>NIKE AR STUDIO</span>
        <button type="button" onClick={onBack}>← KEMBALI KE KOLEKSI</button>
      </footer>
    </main>
  );
}

export default ShoeComparePage;
