import React, { useState } from 'react';
import { getBarcodeInfo } from '../data/productBarcodes';

function ShoeBarcodeCard({ shoe, onUnlock3D, onOpenScanner }) {
  const barcode = getBarcodeInfo(shoe.id);
  const [showFullQR, setShowFullQR] = useState(false);

  // SVG representation of Code 128 Barcode bars
  const barcodeBars = [
    3, 1, 1, 2, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 2, 1,
    1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1, 2, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 2, 2, 1,
  ];

  return (
    <div className="shoe-barcode-card">
      <div className="shoe-barcode-head">
        <div className="shoe-barcode-brand">
          <span className="barcode-chip-tag">OFFICIAL SKU</span>
          <strong>{barcode.sku}</strong>
        </div>
        <span className="barcode-status-pill">BARCODE TERDAFTAR</span>
      </div>

      {/* SVG Barcode Graphic */}
      <div className="shoe-barcode-graphic-box">
        <svg className="shoe-barcode-svg" viewBox="0 0 260 70" preserveAspectRatio="none">
          <g fill="#0f172a">
            {barcodeBars.map((width, idx) => {
              const xPos = idx * 4;
              return <rect key={idx} x={xPos} y="0" width={width} height="52" />;
            })}
          </g>
          <text
            x="130"
            y="66"
            textAnchor="middle"
            fill="#0f172a"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="2"
            fontWeight="bold"
          >
            {barcode.barcodeNumber}
          </text>
        </svg>
      </div>

      <div className="shoe-barcode-details">
        <div>
          <span className="shoe-barcode-label">Siluet:</span>
          <strong>{shoe.name}</strong>
        </div>
        <div>
          <span className="shoe-barcode-label">Varian:</span>
          <span>{barcode.colorway}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="shoe-barcode-actions">
        <button
          type="button"
          className="btn-unlock-3d"
          onClick={onUnlock3D}
          title="Tampilkan model 3D sepatu ini di layar"
        >
          <span className="btn-icon">✨</span>
          <span>Aktifkan Model 3D Sekarang</span>
        </button>

        <button
          type="button"
          className="btn-scan-barcode"
          onClick={onOpenScanner}
          title="Pindai barcode sepatu menggunakan kamera HP"
        >
          <span className="btn-icon">📷</span>
          <span>Scan via Kamera</span>
        </button>
      </div>

      <div className="shoe-barcode-footer-note">
        <small>
          💡 <strong>Tips:</strong> Secara bawaan, Anda melihat foto produk 2D biasa. Tekan tombol di atas atau arahkan kamera ke barcode untuk memunculkan model 3D sepatu.
        </small>
      </div>
    </div>
  );
}

export default ShoeBarcodeCard;
