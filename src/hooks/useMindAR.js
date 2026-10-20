import { useEffect, useRef, useState } from 'react';

/**
 * useMindAR - Custom hook untuk integrasi MindAR.js dengan React
 *
 * MindAR di-load via CDN (window.MINDAR), sehingga tidak perlu npm install.
 * Hook ini me-manage lifecycle MindAR: start, tracking events, stop.
 *
 * @param {string} targetSrc - Path ke file .mind (image target)
 * @param {HTMLElement} containerRef - Ref ke container div untuk AR
 * @returns {{ isTracking, isLoading, error, stop }}
 */
export function useMindAR(targetSrc, containerRef) {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mindARRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Cek apakah MindAR sudah di-load via CDN
    if (typeof window.MINDAR === 'undefined' && typeof window.MindARThree === 'undefined') {
      setError('MindAR belum tersedia. Pastikan koneksi internet aktif untuk load CDN.');
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const init = async () => {
      try {
        // MindARThree tersedia dari CDN mindar-image-three.prod.js
        const MindARThree = window.MindARThree;

        if (!MindARThree) {
          throw new Error('MindARThree tidak tersedia di window. Periksa CDN script di index.html.');
        }

        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: targetSrc,
          maxTrack: 1,
          uiLoading: 'no',  // kita handle loading sendiri
          uiScanning: 'no', // kita handle UI sendiri
          uiError: 'no',
        });

        mindARRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

        // Buat anchor untuk image target index 0
        const anchor = mindarThree.addAnchor(0);

        // Event: target ditemukan
        anchor.onTargetFound = () => {
          if (!cancelled) setIsTracking(true);
        };

        // Event: target hilang
        anchor.onTargetLost = () => {
          if (!cancelled) setIsTracking(false);
        };

        await mindarThree.start();

        if (!cancelled) {
          setIsLoading(false);

          // Render loop
          renderer.setAnimationLoop(() => {
            mindarThree.update();
            renderer.render(scene, camera);
          });
        }

        return { mindarThree, anchor, renderer, scene, camera };
      } catch (err) {
        if (!cancelled) {
          setIsLoading(false);
          setError(err.message || 'Gagal memulai AR. Pastikan kamera diizinkan.');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (mindARRef.current) {
        try {
          mindARRef.current.stop();
        } catch (_) {
          // ignore stop errors
        }
        mindARRef.current = null;
      }
    };
  }, [targetSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = () => {
    if (mindARRef.current) {
      mindARRef.current.stop();
      mindARRef.current = null;
    }
  };

  return { isTracking, isLoading, error, stop };
}
