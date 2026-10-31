import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { shoes } from '../data/products';
import { PRODUCT_BARCODES } from '../data/productBarcodes';

function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [isLiveActive, setIsLiveActive] = useState(false);
  const [detectedShoe, setDetectedShoe] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoScanning, setPhotoScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setDetectedShoe(null);
    setIsProcessing(false);
    setPhotoScanning(false);
    setScanMessage('');
    setIsLiveActive(false);

    let active = true;

    async function startCamera() {
      // Check if navigator.mediaDevices is supported (requires HTTPS or localhost on mobile)
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!active) return;
        setIsLiveActive(false);
        return;
      }

      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setIsLiveActive(true);
          startScanningLoop();
        }
      } catch (err) {
        if (!active) return;
        setIsLiveActive(false);
        console.warn('[Camera live stream unavailable, using native snapshot capture]:', err.message);
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
    setIsLiveActive(false);
  };

  // Continuous frame scanning loop for live video
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

  // Decode code string into shoe object
  const handleCodeDetected = (rawCode) => {
    if (isProcessing) return;
    setIsProcessing(true);

    let matchedShoe = null;

    // 1. Check if it's a URL like /shoe/nike-air-force-1 or contains ?view=3d
    const matchShoePath = rawCode.match(/\/shoe\/([^/?#]+)/);
    if (matchShoePath) {
      const id = decodeURIComponent(matchShoePath[1]);
      matchedShoe = shoes.find((s) => s.id === id);
    }

    // 2. Check by SKU, Barcode Number, or ID
    if (!matchedShoe) {
      for (const [shoeId, info] of Object.entries(PRODUCT_BARCODES)) {
        if (
          rawCode.includes(info.sku) ||
          rawCode.includes(info.barcodeNumber) ||
          rawCode.includes(shoeId)
        ) {
          matchedShoe = shoes.find((s) => s.id === shoeId);
          break;
        }
      }
    }

    // 3. Fallback: match by partial name or default to first shoe
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
    }, 1000);
  };

  // Handle photo capture from Native Camera or Gallery
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoScanning(true);
    setScanMessage('Menganalisis foto barcode…');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          let detected = null;

          // 1. Try BarcodeDetector API if available (Chrome Android)
          if ('BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'],
              });
              const detectedCodes = await detector.detect(img);
              if (detectedCodes && detectedCodes.length > 0 && detectedCodes[0].rawValue) {
                detected = detectedCodes[0].rawValue;
              }
            } catch (err) {
              console.warn('[BarcodeDetector warning]', err);
            }
          }

          // 2. Fallback to jsQR
          if (!detected) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (qr && qr.data) {
              detected = qr.data;
            }
          }

          setPhotoScanning(false);

          if (detected) {
            setScanMessage('✓ Barcode terverifikasi!');
            handleCodeDetected(detected);
          } else {
            setScanMessage('⚠️ Barcode / QR belum terdeteksi. Pastikan kode berada di tengah foto dan tidak buram.');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setPhotoScanning(false);
      setScanMessage('Gagal memproses foto: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="barcode-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="barcode-modal-title">
      {/* Hidden file inputs: one for native camera, one for gallery */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />

      <div className="barcode-modal-card">
        {/* Modal Header */}
        <div className="barcode-modal-header">
          <div className="barcode-header-info">
            <span className="barcode-modal-tag">AUTHENTICATION SCANNER</span>
            <h3 id="barcode-modal-title">Pindai Barcode / QR Produk</h3>
            <p className="barcode-modal-subtitle">
              Pindai kode fisik untuk membuka Model 3D interaktif 360°
            </p>
          </div>
          <button type="button" className="barcode-modal-close" onClick={onClose} aria-label="Tutup pemindai barcode">
            ✕
          </button>
        </div>

        {/* Viewfinder Main Stage */}
        <div className="barcode-scanner-viewport">
          <video
            ref={videoRef}
            className={`barcode-video-feed ${isLiveActive ? 'is-live' : ''}`}
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Mode 1: Live Stream HUD with Laser Sweep */}
          {isLiveActive && (
            <div className="barcode-scanner-hud">
              <div className="barcode-scan-bracket tl" />
              <div className="barcode-scan-bracket tr" />
              <div className="barcode-scan-bracket bl" />
              <div className="barcode-scan-bracket br" />
              <div className="barcode-laser-beam" />
              <span className="barcode-live-hud-badge">LIVE SCANNING</span>
            </div>
          )}

          {/* Mode 2: Native Camera Hub (when live stream is inactive / mobile HTTP) */}
          {!isLiveActive && (
            <div className="barcode-native-hub">
              <div className="barcode-hub-target-box">
                <div className="barcode-hub-bracket tl" />
                <div className="barcode-hub-bracket tr" />
                <div className="barcode-hub-bracket bl" />
                <div className="barcode-hub-bracket br" />
                <div className="barcode-hub-center-icon">
                  <span className="hub-camera-emoji" aria-hidden="true">📷</span>
                </div>
              </div>
              <h4>Arahkan Kamera ke Barcode / QR</h4>
              <p>Ambil foto barcode atau QR sepatu untuk membuka model 3D secara instan.</p>
            </div>
          )}

          {/* Success Overlay when detected */}
          {detectedShoe && (
            <div className="barcode-success-overlay">
              <span className="barcode-success-icon">✓</span>
              <h4>{detectedShoe.name}</h4>
              <p>Barcode Cocok! Membuka Model 3D…</p>
            </div>
          )}

          {/* Photo scanning loading state */}
          {photoScanning && (
            <div className="barcode-scanning-overlay">
              <div className="barcode-spinner" />
              <p>Menganalisis barcode dari foto…</p>
            </div>
          )}
        </div>

        {/* Scan Status / Warning Banner */}
        {scanMessage && (
          <div className="barcode-status-banner">
            <p>{scanMessage}</p>
          </div>
        )}

        {/* Primary Action Buttons (Sleek, No Duplicates) */}
        <div className="barcode-action-group">
          <button
            type="button"
            className="btn-scanner-primary"
            onClick={() => nativeCameraInputRef.current?.click()}
            title="Buka kamera HP untuk memotret barcode langsung"
          >
            <span className="btn-action-icon" aria-hidden="true">📸</span>
            <div className="btn-action-text">
              <strong>Ambil Foto Barcode</strong>
              <small>Gunakan kamera HP langsung</small>
            </div>
          </button>

          <button
            type="button"
            className="btn-scanner-secondary"
            onClick={() => galleryInputRef.current?.click()}
            title="Pilih gambar atau screenshot dari galeri"
          >
            <span className="btn-action-icon" aria-hidden="true">🖼️</span>
            <div className="btn-action-text">
              <strong>Pilih dari Galeri</strong>
              <small>Unggah file foto / screenshot</small>
            </div>
          </button>
        </div>

        {/* Guided Steps Footer */}
        <div className="barcode-guided-footer">
          <div className="guided-step-item">
            <span className="guided-step-num">1</span>
            <span>Jepret QR Code di layar / label sepatu</span>
          </div>
          <span className="guided-step-arrow" aria-hidden="true">→</span>
          <div className="guided-step-item">
            <span className="guided-step-num">2</span>
            <span>Model 3D 360° otomatis terbuka</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScannerModal;
