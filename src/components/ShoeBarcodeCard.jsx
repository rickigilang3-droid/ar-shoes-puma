import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getBarcodeInfo } from '../data/productBarcodes';

function ShoeBarcodeCard({ shoe, onUnlock3D, onOpenScanner }) {
  const barcode = getBarcodeInfo(shoe.id);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'barcode'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreenQR, setIsFullscreenQR] = useState(false);

  // Target direct URL to unlock 3D model
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${origin}/shoe/${shoe.id}?view=3d`;

  // Generate real scannable QR Code image
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrUrl, {
      width: 260,
      margin: 1.5,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('[QRCode error]', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(qrUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

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
        <span className="barcode-status-pill">BARCODE & QR AKTIF</span>
      </div>

      {/* Tabs to toggle between QR Code 3D & Barcode SKU */}
      <div className="barcode-card-tab-nav">
        <button
          type="button"
          className={`barcode-tab-btn ${activeTab === 'qr' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          <span>📱 QR Code 3D</span>
          <small>Scan via HP</small>
        </button>
        <button
          type="button"
          className={`barcode-tab-btn ${activeTab === 'barcode' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('barcode')}
        >
          <span>🏷️ Barcode SKU</span>
          <small>Code 128</small>
        </button>
      </div>

      {/* Display Box */}
      {activeTab === 'qr' ? (
        <div className="shoe-qr-box">
          <div className="shoe-qr-image-wrapper">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code 3D untuk ${shoe.name}`}
                className="shoe-qr-real-image"
                onClick={() => setIsFullscreenQR(true)}
                title="Klik untuk memperbesar QR Code"
              />
            ) : (
              <div className="shoe-qr-placeholder">Membuat QR Code…</div>
            )}
            <span className="shoe-qr-scan-hint">Arahkan kamera HP ke sini untuk buka Model 3D</span>
          </div>

          <div className="shoe-qr-tools">
            <button
              type="button"
              className="btn-qr-tool"
              onClick={() => setIsFullscreenQR(true)}
              title="Perbesar QR Code ke layar penuh"
            >
              🔍 Perbesar QR
            </button>
            <button
              type="button"
              className="btn-qr-tool"
              onClick={handleCopyLink}
              title="Salin tautan ke clipboard"
            >
              {copied ? '✓ Link Tersalin!' : '📋 Salin Link 3D'}
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`qrcode-3d-${shoe.id}.png`}
                className="btn-qr-tool"
                title="Unduh file gambar QR Code"
              >
                📥 Unduh QR
              </a>
            )}
          </div>
        </div>
      ) : (
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
      )}

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

      {/* Action Buttons */}
      <div className="shoe-barcode-actions">
        <button
          type="button"
          className="btn-unlock-3d"
          onClick={onUnlock3D}
          title="Buka tampilan model 3D sepatu ini di layar"
        >
          <span className="btn-icon">✨</span>
          <span>Buka Model 3D Langsung</span>
        </button>

        <button
          type="button"
          className="btn-scan-barcode"
          onClick={onOpenScanner}
          title="Buka kamera untuk scan barcode / QR sepatu"
        >
          <span className="btn-icon">📷</span>
          <span>Scan via Kamera</span>
        </button>
      </div>

      <div className="shoe-barcode-footer-note">
        <small>
          💡 <strong>Tips:</strong> Anda bisa mengarahkan kamera HP ke QR Code di atas untuk membuka model 3D secara instan di HP, atau klik tombol <em>Buka Model 3D Langsung</em>.
        </small>
      </div>

      {/* Fullscreen QR Modal */}
      {isFullscreenQR && (
        <div className="qr-fullscreen-modal-backdrop" onClick={() => setIsFullscreenQR(false)}>
          <div className="qr-fullscreen-card" onClick={(e) => e.stopPropagation()}>
            <div className="qr-fullscreen-header">
              <div>
                <span className="barcode-chip-tag">SCAN VIA HP</span>
                <h3>{shoe.name}</h3>
              </div>
              <button
                type="button"
                className="qr-fullscreen-close"
                onClick={() => setIsFullscreenQR(false)}
              >
                ✕
              </button>
            </div>
            <div className="qr-fullscreen-img-box">
              {qrDataUrl && <img src={qrDataUrl} alt={`QR Code ${shoe.name}`} />}
            </div>
            <p className="qr-fullscreen-desc">
              Arahkan kamera HP (Google Lens / Kamera iPhone) ke QR Code di atas untuk membuka <strong>Model 3D {shoe.name}</strong> secara instan.
            </p>
            <div className="qr-fullscreen-actions">
              <button
                type="button"
                className="store-button store-button-dark"
                onClick={handleCopyLink}
              >
                {copied ? '✓ Link Tersalin!' : '📋 Salin Tautan'}
              </button>
              <button
                type="button"
                className="store-button store-button-light"
                onClick={() => setIsFullscreenQR(false)}
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

export default ShoeBarcodeCard;
