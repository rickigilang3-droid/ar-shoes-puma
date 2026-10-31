import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { shoes } from '../data/products';
import { PRODUCT_BARCODES } from '../data/productBarcodes';

function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [detectedShoe, setDetectedShoe] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setDetectedShoe(null);
    setCameraError(null);
    setIsProcessing(false);

    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Kamera tidak didukung pada browser ini.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          startScanningLoop();
        }
      } catch (err) {
        if (!active) return;
        setHasCamera(false);
        setCameraError(err.message || 'Izin kamera belum diberikan.');
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Continuous frame scanning loop
  const startScanningLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return; // stop loop on success
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleCodeDetected = (rawCode) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Identify shoe from URL or raw text or barcode
    let matchedShoe = null;

    // Check if it's a URL like /shoe/nike-air-force-1
    const matchShoePath = rawCode.match(/\/shoe\/([^/?#]+)/);
    if (matchShoePath) {
      const id = decodeURIComponent(matchShoePath[1]);
      matchedShoe = shoes.find((s) => s.id === id);
    }

    // Check by SKU or barcode number
    if (!matchedShoe) {
      for (const [shoeId, info] of Object.entries(PRODUCT_BARCODES)) {
        if (rawCode.includes(info.sku) || rawCode.includes(info.barcodeNumber) || rawCode.includes(shoeId)) {
          matchedShoe = shoes.find((s) => s.id === shoeId);
          break;
        }
      }
    }

    // Fallback: match by partial name or default to first shoe
    if (!matchedShoe) {
      matchedShoe = shoes.find((s) => rawCode.toLowerCase().includes(s.id.toLowerCase())) || shoes[0];
    }

    setDetectedShoe(matchedShoe);

    // Audio/haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setTimeout(() => {
      onScanSuccess(matchedShoe.id);
      onClose();
    }, 1100);
  };

  const handleSelectQuickBarcode = (shoeId) => {
    const matched = shoes.find((s) => s.id === shoeId) || shoes[0];
    setDetectedShoe(matched);
    setIsProcessing(true);
    setTimeout(() => {
      onScanSuccess(matched.id);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="barcode-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="barcode-modal-title">
      <div className="barcode-modal-card">
        {/* Header */}
        <div className="barcode-modal-header">
          <div>
            <span className="barcode-modal-tag">BARCODE SCANNER 3D</span>
            <h3 id="barcode-modal-title">Pindai Barcode Produk</h3>
          </div>
          <button type="button" className="barcode-modal-close" onClick={onClose} aria-label="Tutup pemindai barcode">
            ✕
          </button>
        </div>

        {/* Viewfinder Video Area */}
        <div className="barcode-scanner-viewport">
          <video ref={videoRef} className="barcode-video-feed" playsInline muted autoPlay />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanner Overlay HUD */}
          <div className="barcode-scanner-hud">
            <div className="barcode-scan-bracket tl" />
            <div className="barcode-scan-bracket tr" />
            <div className="barcode-scan-bracket bl" />
            <div className="barcode-scan-bracket br" />
            <div className="barcode-laser-beam" />
          </div>

          {/* Success Overlay when detected */}
          {detectedShoe && (
            <div className="barcode-success-overlay">
              <span className="barcode-success-icon">✓</span>
              <h4>{detectedShoe.name}</h4>
              <p>Barcode Cocok! Membuka Model 3D…</p>
            </div>
          )}

          {/* Fallback if camera error */}
          {cameraError && (
            <div className="barcode-camera-notice">
              <span>📷</span>
              <p>{cameraError}</p>
              <small>Anda tetap dapat memilih barcode sepatu di bawah ini untuk menguji coba.</small>
            </div>
          )}
        </div>

        {/* Instructional text */}
        <div className="barcode-instruction-text">
          <p>
            Arahkan kamera ke <strong>Barcode atau QR Code</strong> sepatu untuk memunculkan model 3D interaktif secara langsung.
          </p>
        </div>

        {/* Quick Barcode Selector (Untuk pengujian cepat di browser/laptop) */}
        <div className="barcode-quick-select-box">
          <span className="barcode-quick-title">⚡ Uji Coba Cepat Pilihan Barcode Produk:</span>
          <div className="barcode-quick-list">
            {shoes.map((shoe) => (
              <button
                key={shoe.id}
                type="button"
                className="barcode-quick-pill"
                onClick={() => handleSelectQuickBarcode(shoe.id)}
              >
                <span>👟 {shoe.name}</span>
                <small>{PRODUCT_BARCODES[shoe.id]?.sku || 'SKU'}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScannerModal;
