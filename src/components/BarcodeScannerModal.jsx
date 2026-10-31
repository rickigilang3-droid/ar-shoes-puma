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

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
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
    setCameraError(null);
    setIsProcessing(false);
    setPhotoScanning(false);
    setScanMessage('');

    let active = true;

    async function startCamera() {
      // Check if navigator.mediaDevices is supported (requires HTTPS or localhost on mobile)
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!active) return;
        setHasCamera(false);
        setCameraError(
          'Browser HP membatasi live video stream tanpa HTTPS. Gunakan tombol "Buka Kamera HP" di bawah untuk memotret barcode langsung.'
        );
        return;
      }

      try {
        let stream;
        try {
          // Attempt back camera first
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          // Fallback to basic video constraint
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
          setHasCamera(true);
          startScanningLoop();
        }
      } catch (err) {
        if (!active) return;
        setHasCamera(false);
        if (err.name === 'NotAllowedError') {
          setCameraError('Izin akses kamera ditolak di browser. Gunakan tombol "Buka Kamera HP" di bawah.');
        } else {
          setCameraError(err.message || 'Kamera belum dapat dibuka.');
        }
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
            setScanMessage('✓ Barcode ditemukan!');
            handleCodeDetected(detected);
          } else {
            setScanMessage('⚠️ Barcode / QR belum terdeteksi pada foto. Pastikan gambar jelas dan coba lagi.');
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
      {/* Hidden native camera capture & gallery inputs */}
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
        {/* Header */}
        <div className="barcode-modal-header">
          <div>
            <span className="barcode-modal-tag">BARCODE SCANNER 3D</span>
            <h3 id="barcode-modal-title">Pindai Barcode / QR Produk</h3>
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
          {hasCamera && !cameraError && (
            <div className="barcode-scanner-hud">
              <div className="barcode-scan-bracket tl" />
              <div className="barcode-scan-bracket tr" />
              <div className="barcode-scan-bracket bl" />
              <div className="barcode-scan-bracket br" />
              <div className="barcode-laser-beam" />
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

          {/* Fallback / Camera Notice on Mobile HTTP */}
          {cameraError && (
            <div className="barcode-camera-notice">
              <span className="camera-notice-icon">📷</span>
              <p className="camera-notice-text">{cameraError}</p>
              <button
                type="button"
                className="btn-take-photo-primary"
                onClick={() => nativeCameraInputRef.current?.click()}
              >
                <span>📸 Buka Kamera HP Sekarang</span>
              </button>
            </div>
          )}

          {/* Photo scanning loading state */}
          {photoScanning && (
            <div className="barcode-scanning-overlay">
              <div className="barcode-spinner" />
              <p>Menganalisis foto…</p>
            </div>
          )}
        </div>

        {/* Scan Message / Tip */}
        {scanMessage && (
          <div className="barcode-status-banner">
            <p>{scanMessage}</p>
          </div>
        )}

        {/* Mobile Camera & Gallery Action Buttons */}
        <div className="barcode-native-actions">
          <button
            type="button"
            className="btn-native-action primary"
            onClick={() => nativeCameraInputRef.current?.click()}
            title="Buka kamera HP untuk memotret barcode langsung"
          >
            <span>📸 Ambil Foto Barcode</span>
          </button>
          <button
            type="button"
            className="btn-native-action secondary"
            onClick={() => galleryInputRef.current?.click()}
            title="Pilih gambar barcode dari galeri"
          >
            <span>🖼️ Pilih dari Galeri</span>
          </button>
        </div>

        {/* Instructional text */}
        <div className="barcode-instruction-text">
          <p>
            Arahkan kamera ke <strong>QR Code atau Barcode</strong> sepatu untuk membuka model 3D interaktif.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScannerModal;
