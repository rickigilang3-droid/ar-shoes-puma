import React, { useEffect, useRef, useState } from 'react';
import ProductModelViewer from '../components/ProductModelViewer';
import ShoeEducationFacts from '../components/ShoeEducationFacts';
import ShoeBarcodeCard from '../components/ShoeBarcodeCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import './ShoeStore.css';
import { shoes } from '../data/products';

function ShoeDetailPage({ shoe, onBack, onCompare, onAddToCart, onBuyNow, onStartAR }) {
  // Mode tampilan: 'photo' (Default gambar produk biasa 2D) atau '3d' (Model 3D interaktif yang terbuka setelah scan barcode)
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === '3d' ? '3d' : 'photo';
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState(shoe.parts[0]?.id ?? null);
  const [selectedColor, setSelectedColor] = useState(() => shoe.modelColors?.[0] ?? null);
  const selectedPart = shoe.parts.find((part) => part.id === selectedPartId);
  const shoeNumber = String(shoes.findIndex((item) => item.id === shoe.id) + 1).padStart(2, '0');
  const comparisonShoe = shoes.find((item) => item.id !== shoe.id);
  const layoutRef = useRef(null);
  const viewerRef = useRef(null);
  const infoCardRef = useRef(null);
  const selectedPartTitleRef = useRef(null);
  const [connector, setConnector] = useState(null);

  useEffect(() => {
    setSelectedPartId(shoe.parts[0]?.id ?? null);
    setSelectedColor(shoe.modelColors?.[0] ?? null);
  }, [shoe.id, shoe.parts, shoe.modelColors]);

  // Sync connector line when 3D viewer is active
  useEffect(() => {
    if (viewMode !== '3d') {
      setConnector(null);
      return undefined;
    }

    const layout = layoutRef.current;
    const viewer = viewerRef.current;
    const infoCard = infoCardRef.current;
    if (!layout || !viewer || !infoCard || !selectedPartId) {
      setConnector(null);
      return undefined;
    }

    let animationFrame;
    const updateConnector = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const hotspot = [...viewer.children].find(
          (element) => element.slot === `hotspot-${selectedPartId}`,
        );
        const selectedPartTitle = selectedPartTitleRef.current;
        if (!hotspot || !selectedPartTitle) {
          setConnector(null);
          return;
        }

        const hotspotMarker = hotspot.querySelector('.product-hotspot-dot') ?? hotspot;
        const hotspotBounds = hotspotMarker.getBoundingClientRect();
        const titleBounds = selectedPartTitle.getBoundingClientRect();
        const layoutBounds = layout.getBoundingClientRect();
        if (
          hotspotBounds.width === 0 ||
          hotspotBounds.height === 0 ||
          titleBounds.width === 0 ||
          titleBounds.height === 0
        ) {
          setConnector(null);
          return;
        }

        setConnector({
          startX: hotspotBounds.left + hotspotBounds.width / 2 - layoutBounds.left,
          startY: hotspotBounds.top + hotspotBounds.height / 2 - layoutBounds.top,
          endX: titleBounds.left - layoutBounds.left - 10,
          endY: titleBounds.top + titleBounds.height / 2 - layoutBounds.top,
        });
      });
    };

    updateConnector();
    const resizeObserver = new ResizeObserver(updateConnector);
    resizeObserver.observe(layout);
    resizeObserver.observe(infoCard);
    const contentObserver = new MutationObserver(updateConnector);
    contentObserver.observe(infoCard, { childList: true, subtree: true });

    viewer.addEventListener('camera-change', updateConnector);
    viewer.addEventListener('load', updateConnector);
    window.addEventListener('resize', updateConnector);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      contentObserver.disconnect();
      viewer.removeEventListener('camera-change', updateConnector);
      viewer.removeEventListener('load', updateConnector);
      window.removeEventListener('resize', updateConnector);
    };
  }, [selectedPartId, shoe.id, viewMode]);

  const brandName = shoe.brand || (shoe.name.toUpperCase().startsWith('PUMA') ? 'PUMA' : 'NIKE');
  const brandInitial = brandName[0];
  const connectorCurve = connector ? Math.min((connector.endX - connector.startX) * 0.45, 120) : 0;
  const connectorPath = connector
    ? `M ${connector.startX} ${connector.startY} C ${connector.startX + connectorCurve} ${connector.startY}, ${connector.endX - connectorCurve} ${connector.endY}, ${connector.endX} ${connector.endY}`
    : '';

  return (
    <main className="shoe-store shoe-detail-page">
      <header className="store-header">
        <button className="store-back-link" onClick={onBack}>← <span>Koleksi</span></button>
        <a className="store-wordmark" href="/" onClick={(event) => { event.preventDefault(); onBack(); }}>
          <span className="store-mark" aria-hidden="true">{brandInitial}</span>
          <span>{brandName} <small>AR STUDIO</small></span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="store-header-scanner-btn"
            type="button"
            onClick={() => setIsScannerOpen(true)}
            title="Buka kamera untuk scan barcode sepatu"
          >
            <span className="scanner-icon" aria-hidden="true">📷</span>
            <span>Scan Barcode</span>
          </button>
          <button
            className="store-header-ar detail-ar-button"
            type="button"
            onClick={() => onStartAR?.(shoe.id)}
            title="Lihat model 3D sepatu ini di kamera AR"
          >
            <span className="ar-icon" aria-hidden="true">◉</span>
            <span>Mode AR</span>
          </button>
          <span className="store-detail-counter">{shoeNumber} / {String(shoes.length).padStart(2, '0')}</span>
        </div>
      </header>

      <section className="shoe-detail-layout" ref={layoutRef}>
        {connector && (
          <svg
            className="shoe-education-connector"
            style={{ '--shoe-accent': shoe.accent }}
            aria-hidden="true"
          >
            <path className="shoe-education-connector-outline" d={connectorPath} />
            <path className="shoe-education-connector-line" d={connectorPath} />
            <circle className="shoe-education-connector-start" cx={connector.startX} cy={connector.startY} r="5" />
            <circle className="shoe-education-connector-end" cx={connector.endX} cy={connector.endY} r="4" />
          </svg>
        )}
        <div className="shoe-viewer-column">
          <div className="shoe-detail-heading">
            <p className="store-eyebrow">
              {shoe.category} / {viewMode === '3d' ? 'INTERACTIVE 3D UNLOCKED' : 'KATALOG PRODUK'}
            </p>
            <h1>{shoe.name}<span>.</span></h1>
            <p>{shoe.tagline}</p>
            {comparisonShoe && (
              <button
                className="store-button store-button-dark shoe-compare-action"
                type="button"
                onClick={() => onCompare(shoe.id, comparisonShoe.id)}
              >
                Bandingkan dengan {comparisonShoe.name}
              </button>
            )}
          </div>

          {/* VIEW MODE CONTAINER */}
          {viewMode === 'photo' ? (
            /* 1. DEFAULT: GAMBAR PRODUK BIASA (2D) */
            <div className="shoe-photo-stage" style={{ '--shoe-accent': shoe.accent }}>
              <div className="shoe-photo-top-bar">
                <span className="shoe-mode-badge photo">
                  <span className="badge-dot" /> FOTO PRODUK RESMI (2D)
                </span>
                <button
                  type="button"
                  className="btn-switch-to-3d"
                  onClick={() => setViewMode('3d')}
                  title="Aktifkan Model 3D Sepatu Ini"
                >
                  <span>📦 Buka Model 3D</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              {/* Gambar 2D Utama */}
              <div className="shoe-photo-frame">
                <img
                  src={shoe.image}
                  alt={`Foto ${shoe.name}`}
                  className="shoe-detail-main-photo"
                />
              </div>

              {/* Kartu Barcode Sepatu (Scan untuk Memunculkan 3D) */}
              <ShoeBarcodeCard
                shoe={shoe}
                onUnlock3D={() => setViewMode('3d')}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            </div>
          ) : (
            /* 2. MODE 3D INTERAKTIF (TERBUKA SETELAH SCAN BARCODE / DIKLIK) */
            <>
              {/* Tab Switcher Bar */}
              <div className="shoe-view-mode-bar">
                <button
                  type="button"
                  className="view-mode-tab"
                  onClick={() => setViewMode('photo')}
                  title="Kembali ke tampilan foto 2D biasa"
                >
                  🖼️ Kembali ke Foto 2D
                </button>
                <button
                  type="button"
                  className="view-mode-tab active"
                  title="Sedang menampilkan Model 3D"
                >
                  📦 Model 3D Aktif ✓
                </button>
                <button
                  type="button"
                  className="view-mode-tab tab-scanner"
                  onClick={() => setIsScannerOpen(true)}
                  title="Pindai barcode sepatu lain"
                >
                  📷 Scan Barcode Lain
                </button>
              </div>

              <div className="shoe-viewer-shell" style={{ '--shoe-accent': shoe.accent }}>
                <div className="viewer-topline">
                  <span>DRAG TO ROTATE 360°</span>
                  <span>01 — 0{shoe.parts.length} HOTSPOTS</span>
                </div>
                <ProductModelViewer
                  shoe={shoe}
                  selectedPartId={selectedPartId}
                  onSelectPart={setSelectedPartId}
                  viewerRef={viewerRef}
                  selectedColor={selectedColor}
                />
                <div className="viewer-hint">
                  Putar / zoom model · pilih hotspot atau tombol bagian
                  {shoe.id === 'nike-dunk-low' && selectedColor && ` · ${selectedColor.name}`}
                </div>
              </div>

              <div className="shoe-part-strip" role="group" aria-label="Pilih bagian sepatu">
                {shoe.parts.map((part, index) => (
                  <button
                    key={part.id}
                    className={`shoe-part-chip ${selectedPartId === part.id ? 'is-active' : ''}`}
                    style={{ '--shoe-accent': shoe.accent }}
                    aria-pressed={selectedPartId === part.id}
                    onClick={() => setSelectedPartId(part.id)}
                  >
                    <span>0{index + 1}</span>
                    {part.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="shoe-info-column">
          <ShoeEducationFacts
            key={shoe.id}
            shoe={shoe}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            selectedPart={selectedPart}
            selectedPartId={selectedPartId}
            onSelectPart={setSelectedPartId}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            infoCardRef={infoCardRef}
            selectedPartTitleRef={selectedPartTitleRef}
          />
        </div>
      </section>

      <footer className="store-footer">
        <span>{brandName} AR STUDIO</span>
        <button onClick={onBack}>← KEMBALI KE KOLEKSI</button>
      </footer>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedShoeId) => {
          if (scannedShoeId === shoe.id) {
            setViewMode('3d');
          } else {
            window.location.href = `/shoe/${encodeURIComponent(scannedShoeId)}?view=3d`;
          }
        }}
      />
    </main>
  );
}

export default ShoeDetailPage;
