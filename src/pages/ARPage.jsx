import React, { Suspense, lazy, useState } from 'react';
import { AROverlay } from '../components/AROverlay';
import { shoePartsData } from '../data/shoeData';
import { shoes } from '../data/products';

const ARScene = lazy(() => import('../components/ARScene'));

/**
 * ARPage – Orchestrator AR Edukasi Sepatu Interaktif
 *
 * Alur:
 * 1. Pengguna membaca petunjuk, memilih sepatu (atau melanjutkan dari katalog)
 * 2. Kamera mencari gambar target sebelum model 3D ditampilkan
 * 3. Pengguna bisa memutar (drag/swipe), zoom (pinch/button), dan mengganti varian warna
 * 4. Pemilihan bagian membuka penjelasan terintegrasi di atas scene AR
 */
function ARPage({ onBack, initialShoeId }) {
  const [currentShoeId, setCurrentShoeId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return initialShoeId || params.get('shoe') || 'puma-suede';
  });

  const currentShoe =
    shoes.find((s) => s.id === currentShoeId) ||
    shoes.find((s) => s.id === 'puma-suede') ||
    shoes[0];

  const [hasStarted, setHasStarted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [showMarkers, setShowMarkers] = useState(true);
  const [shoeColor, setShoeColor] = useState(null); // null = warna asli GLB
  const canAccessCamera = window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);

  // Dipanggil saat raycaster menyentuh marker atau mesh sepatu
  const handlePartHit = ({ partId }) => {
    const part = shoePartsData.find((p) => p.id === partId) ?? shoePartsData[0];
    setSelectedPart(part);
  };

  const handleSelectPart = (part) => {
    setSelectedPart(part);
  };

  const handleClosePart = () => {
    setSelectedPart(null);
  };

  const handleToggleAutoRotate = () => {
    setIsAutoRotate((prev) => !prev);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.2).toFixed(1)), 2.2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.2).toFixed(1)), 0.6));
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setIsAutoRotate(true);
  };

  const handleToggleMarkers = () => {
    setShowMarkers((prev) => !prev);
  };

  const handleChangeColor = (hexOrNull) => {
    setShoeColor(hexOrNull);
  };

  const handleSelectShoe = (newShoeId) => {
    setCurrentShoeId(newShoeId);
    setShoeColor(null);
    setSelectedPart(null);
    setIsModelReady(false);
    setAttempt((prev) => prev + 1);
  };

  if (!hasStarted) {
    return (
      <main className="ar-intro">
        <button className="ar-intro-back" type="button" onClick={onBack}>
          ← Kembali ke koleksi
        </button>
        <section className="ar-intro-content" aria-labelledby="ar-intro-title">
          <div className="ar-intro-copy">
            <p className="store-eyebrow">PENGALAMAN AR · {currentShoe.name.toUpperCase()}</p>
            <h1 id="ar-intro-title">Siapkan kamera,<br /><em>lalu scan marker.</em></h1>
            <p className="ar-intro-description">
              Arahkan kamera ke gambar target 2D (marker) untuk memunculkan model 3D sepatu.
              Kamu dapat memutar model 360°, zoom, dan mengubah warna sepatu secara langsung di layar.
            </p>
            <ol className="ar-intro-steps">
              <li><span>01</span><p>Izinkan akses kamera saat diminta browser.</p></li>
              <li><span>02</span><p>Tampilkan seluruh kartu target di layar lain atau cetak.</p></li>
              <li><span>03</span><p>Arahkan kamera ke gambar dan tahan perangkat tetap stabil.</p></li>
            </ol>
            {!canAccessCamera && (
              <p className="ar-camera-requirement" role="alert">
                Kamera membutuhkan browser yang mendukung akses kamera dan koneksi aman HTTPS
                (localhost juga didukung).
              </p>
            )}
            <button
              className="ar-intro-start"
              type="button"
              disabled={!canAccessCamera}
              onClick={() => setHasStarted(true)}
            >
              Mulai scan target <span aria-hidden="true">↗</span>
            </button>
          </div>
          <figure className="ar-intro-target">
            <img src="/targets/shoe-qr.png" alt="Kartu gambar target AR" />
            <figcaption>
              Target gambar AR — tampilkan gambar ini secara utuh, bukan hanya kode QR.
              <a href="/target.html" target="_blank" rel="noreferrer">Buka target ukuran penuh ↗</a>
            </figcaption>
          </figure>
        </section>
      </main>
    );
  }

  return (
    <div className="ar-fullscreen">
      <Suspense
        fallback={
          <div className="ar-scene-loading" role="status" aria-live="polite">
            Menyiapkan kamera dan pemindai AR…
          </div>
        }
      >
        <ARScene
          key={`${attempt}-${currentShoe.id}`}
          modelSrc={currentShoe.model || '/models/puma_suede.glb'}
          targetSrc="/targets/shoe-qr.mind"
          selectedPartId={selectedPart?.id ?? null}
          isAutoRotate={isAutoRotate}
          zoomLevel={zoomLevel}
          showMarkers={showMarkers}
          shoeColor={shoeColor}
          onTrackingChange={setIsTracking}
          onModelReady={setIsModelReady}
          onPartHit={handlePartHit}
          onManualRotateActive={() => setIsAutoRotate(false)}
          onRetry={() => {
            setIsTracking(false);
            setIsModelReady(false);
            setAttempt((current) => current + 1);
          }}
        />
      </Suspense>

      {/* Futuristic Glass HUD Overlay: Kontrol 3D, Card Edukasi, Varian Warna, Status */}
      <AROverlay
        isTracking={isTracking}
        isModelReady={isModelReady}
        selectedPart={selectedPart}
        isAutoRotate={isAutoRotate}
        zoomLevel={zoomLevel}
        showMarkers={showMarkers}
        shoeColor={shoeColor}
        currentShoe={currentShoe}
        availableShoes={shoes}
        onSelectShoe={handleSelectShoe}
        onBack={onBack}
        onSelectPart={handleSelectPart}
        onClosePart={handleClosePart}
        onToggleAutoRotate={handleToggleAutoRotate}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onToggleMarkers={handleToggleMarkers}
        onChangeColor={handleChangeColor}
      />
    </div>
  );
}

export default ARPage;
