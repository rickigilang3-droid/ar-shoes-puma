import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import {
  ShoePartManager,
  ClickParticleSystem,
  createProceduralShoe,
  PART_COLORS,
} from './ShoeEffects.js';
import { AnnotationMarkerSystem, MARKER_LOCAL_POSITIONS } from './MarkerSystem.js';


function ARScene({
  modelSrc,
  targetSrc,
  selectedPartId,
  isAutoRotate = true,
  zoomLevel = 1.0,
  showMarkers = true,
  shoeColor = null,          // ← null = warna asli GLB, string/hex = override
  onTrackingChange,
  onModelReady,
  onPartHit,
  onManualRotateActive,
  onRetry,
}) {
  const containerRef    = useRef(null);
  const mindARRef       = useRef(null);
  const rendererRef     = useRef(null);
  const partManagerRef  = useRef(null);
  const particlesRef    = useRef(null);
  const markersRef      = useRef(null);
  const anchorRef       = useRef(null);
  const shoeContainerRef = useRef(null);
  const shoeRootRef     = useRef(null);

  const selectedRef     = useRef(selectedPartId);
  const isAutoRotateRef = useRef(isAutoRotate);
  const showMarkersRef  = useRef(showMarkers);
  const zoomTargetRef   = useRef(zoomLevel);
  const shoeColorRef    = useRef(shoeColor);

  const [status, setStatus]     = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Sinkronisasi refs
  useEffect(() => {
    selectedRef.current = selectedPartId;
    partManagerRef.current?.highlight(selectedPartId ?? null);
  }, [selectedPartId]);

  useEffect(() => {
    isAutoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  useEffect(() => {
    showMarkersRef.current = showMarkers;
    if (markersRef.current && anchorRef.current?.group?.visible) {
      markersRef.current.setVisible(showMarkers);
    }
  }, [showMarkers]);

  // Handle dynamic Zoom level
  useEffect(() => {
    zoomTargetRef.current = zoomLevel;
  }, [zoomLevel]);

  // ── Sinkronisasi warna override ke ShoePartManager ──
  useEffect(() => {
    shoeColorRef.current = shoeColor;
    if (!partManagerRef.current) return;
    if (shoeColor) {
      partManagerRef.current.applyColorOverride(shoeColor);
    } else {
      partManagerRef.current.resetColorOverride();
    }
  }, [shoeColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('error');
      setErrorMsg('Kamera memerlukan izin akses dan koneksi aman. Pastikan browser mengizinkan kamera.');
      return;
    }

    let cancelled = false;
    let evCleanup = null;

    const init = async () => {
      try {
        const cameraPermission = await navigator.permissions?.query({ name: 'camera' }).catch(() => null);
        if (cameraPermission?.state === 'denied') {
          throw new Error('Izin kamera untuk situs ini diblokir. Buka pengaturan browser, izinkan Kamera, lalu muat ulang.');
        }

        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: targetSrc,
          maxTrack: 1,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
        });

        mindARRef.current = mindarThree;
        const { renderer, scene, camera } = mindarThree;
        rendererRef.current = renderer;

        // ── Pencahayaan ──
        scene.add(new THREE.AmbientLight(0xffffff, 1.6));

        // Headlight melekat ke kamera agar model selalu terang dari sudut pandang manapun
        const cameraLight = new THREE.DirectionalLight(0xffffff, 2.2);
        cameraLight.position.set(0, 0, 1);
        camera.add(cameraLight);
        scene.add(camera);

        // Lampu pengisi atas
        const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
        topLight.position.set(0, 4, 3);
        scene.add(topLight);

        // ── Anchor Image Target ──
        const anchor = mindarThree.addAnchor(0);
        anchorRef.current = anchor;

        // ── Container Khusus Sepatu ──
        // Semua rotasi dan zoom diaplikasikan ke shoeContainer
        const shoeContainer = new THREE.Group();
        shoeContainer.name = 'ShoeContainer';
        anchor.group.add(shoeContainer);
        shoeContainerRef.current = shoeContainer;

        // ── System Partikel & Manager ──
        const partManager = new ShoePartManager();
        const particles   = new ClickParticleSystem(scene);
        const markers     = new AnnotationMarkerSystem(scene, shoeContainer);
        partManagerRef.current = partManager;
        particlesRef.current   = particles;
        markersRef.current     = markers;

        // ── Tracking Events ──
        anchor.onTargetFound = () => {
          if (!cancelled) {
            setStatus('ready');
            if (showMarkersRef.current) markers.setVisible(true);
            onTrackingChange?.(true);
          }
        };

        anchor.onTargetLost = () => {
          if (!cancelled) {
            markers.setVisible(false);
            onTrackingChange?.(false);
          }
        };

        // ── Load 3D Model ──
        let shoeRoot = null;
        let isRealModel = false;

        try {
          const gltf = await new Promise((res, rej) =>
            new GLTFLoader().load(modelSrc, res, undefined, rej)
          );
          shoeRoot = gltf.scene;
          isRealModel = true;
          partManager.registerGLBModel(shoeRoot);
        } catch (err) {
          console.warn('[AR] Fallback ke model prosedural:', err);
          shoeRoot = createProceduralShoe();
          partManager.registerProceduralModel(shoeRoot);
        }

        if (shoeColorRef.current) {
          partManager.applyColorOverride(shoeColorRef.current);
        }

        shoeRootRef.current = shoeRoot;

        // ── Orientasi & Positioning Presisi di Depan Kartu Target ──
        if (isRealModel) {
          // Model sneaker Puma Suede: panjang ada di sumbu Z
          // Putar 90 derajat di sumbu Y agar profil samping sepatu membentang horizontal (sumbu X)
          shoeRoot.rotation.y = Math.PI / 2;
          shoeRoot.rotation.x = 0.08; // sedikit condong ke depan agar bagian atas terlihat jelas
          shoeRoot.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(shoeRoot);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y);

          // Skala agar ukuran sepatu proporsional (~75% lebar kartu target)
          const targetScale = 0.72 / maxDim;
          shoeRoot.scale.setScalar(targetScale);
          shoeRoot.updateMatrixWorld(true);

          const scaledBox = new THREE.Box3().setFromObject(shoeRoot);
          const center = scaledBox.getCenter(new THREE.Vector3());

          // Posisikan:
          // X: tepat di tengah (0)
          // Y: tepat di tengah (0)
          // Z: POSITIF (+0.10) agar sepatu melayang anggun DI DEPAN KARTU, tidak terbenam!
          shoeRoot.position.x = -center.x;
          shoeRoot.position.y = -center.y;
          shoeRoot.position.z = -scaledBox.min.z + 0.10;
        } else {
          // Model prosedural
          shoeRoot.rotation.x = -Math.PI / 12;
          const box = new THREE.Box3().setFromObject(shoeRoot);
          const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y);
          const scale = 0.55 / maxDim;
          shoeRoot.scale.setScalar(scale);
          const center = box.getCenter(new THREE.Vector3());
          shoeRoot.position.set(-center.x * scale, -center.y * scale, 0.08);
        }

        shoeContainer.add(shoeRoot);
        onModelReady?.(true);

        // ── Buat Marker Anotasi 3D Menempel di shoeContainer ──
        markers.build(MARKER_LOCAL_POSITIONS);
        markers.setVisible(showMarkersRef.current && anchor.group.visible);

        // ── Mulai MindAR ──
        await mindarThree.start();
        if (cancelled) return;
        setStatus('ready');

        let targetRotationX = shoeContainer.rotation.x;
        let targetRotationY = shoeContainer.rotation.y;
        let autoRotationSpeed = 0;
        let pinchStartScale = zoomTargetRef.current;

        // ── Render Loop ──
        const clock = new THREE.Clock();
        renderer.setAnimationLoop(() => {
          if (cancelled) return;
          const delta = clock.getDelta();
          const smoothing = 1 - Math.exp(-14 * delta);

          // Auto-rotate sepatu di sekeliling sumbu Y tengah
          const targetAutoSpeed = isAutoRotateRef.current && !selectedRef.current ? 0.48 : 0;
          autoRotationSpeed += (targetAutoSpeed - autoRotationSpeed) * (1 - Math.exp(-5 * delta));
          targetRotationY += autoRotationSpeed * delta;

          shoeContainer.rotation.x += (targetRotationX - shoeContainer.rotation.x) * smoothing;
          shoeContainer.rotation.y += (targetRotationY - shoeContainer.rotation.y) * smoothing;
          const targetScale = zoomTargetRef.current;
          const currentScale = shoeContainer.scale.x;
          shoeContainer.scale.setScalar(currentScale + (targetScale - currentScale) * smoothing);

          partManager.update(delta);
          if (showMarkersRef.current) {
            markers.update(delta, selectedRef.current);
          }

          particles.update(delta);
          renderer.render(scene, camera);
        });

        // ── Interaksi Sentuh: Drag to Rotate & Tap to Select ──
        const raycaster = new THREE.Raycaster();
        const mouse     = new THREE.Vector2();

        let isPointerDown = false;
        let startX = 0;
        let startY = 0;
        let hasMoved = false;
        let initialPinchDist = null;
        let pinchStarted = false;

        const onPointerDown = (evt) => {
          if (!anchor.group.visible) return;
          const touch = evt.touches ? evt.touches[0] : evt;
          isPointerDown = true;
          startX = touch.clientX;
          startY = touch.clientY;
          hasMoved = false;

          if (evt.touches && evt.touches.length === 2) {
            const dx = evt.touches[0].clientX - evt.touches[1].clientX;
            const dy = evt.touches[0].clientY - evt.touches[1].clientY;
            initialPinchDist = Math.hypot(dx, dy);
            pinchStartScale = zoomTargetRef.current;
            pinchStarted = false;
          }
        };

        const onPointerMove = (evt) => {
          if (!isPointerDown || !shoeContainer || !anchor.group.visible) return;

          // Pinch zoom 2 jari
          if (evt.touches && evt.touches.length === 2 && initialPinchDist) {
            const dx = evt.touches[0].clientX - evt.touches[1].clientX;
            const dy = evt.touches[0].clientY - evt.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (!pinchStarted) {
              onManualRotateActive?.(true);
              pinchStarted = true;
            }
            zoomTargetRef.current = Math.min(Math.max(pinchStartScale * (dist / initialPinchDist), 0.4), 2.5);
            hasMoved = true;
            return;
          }

          const touch = evt.touches ? evt.touches[0] : evt;
          const deltaX = touch.clientX - startX;
          const deltaY = touch.clientY - startY;

          // Drag deteksi jika gerak > 6px
          if (Math.hypot(deltaX, deltaY) > 6) {
            if (!hasMoved) onManualRotateActive?.(true);
            hasMoved = true;

            targetRotationY += deltaX * 0.012;
            targetRotationX = Math.max(Math.min(targetRotationX + deltaY * 0.008, 0.9), -0.9);

            startX = touch.clientX;
            startY = touch.clientY;
          }
        };

        const onPointerUp = (evt) => {
          if (!isPointerDown) return;
          isPointerDown = false;
          initialPinchDist = null;

          // TAP (Bukan Drag) → Raycast ke marker atau mesh sepatu
          if (!hasMoved && anchor.group.visible) {
            const touch = evt.changedTouches ? evt.changedTouches[0] : evt;
            const clientX = touch.clientX;
            const clientY = touch.clientY;

            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((clientY - rect.top) / rect.height) * -2 + 1;

            raycaster.setFromCamera(mouse, camera);

            // 1. Cek Marker Titik Terlebih Dahulu (Prioritas)
            const markerTargets = markers.getRaycastTargets();
            const markerHits = raycaster.intersectObjects(markerTargets, false);

            if (markerHits.length > 0) {
              const partId = markerHits[0].object.userData.partId;
              const color  = PART_COLORS[partId] ?? 0xe94560;
              particles.spawn(markerHits[0].point, color);
              onPartHit?.({ partId, screenX: clientX, screenY: clientY });
              return;
            }

            // 2. Cek Klik pada Mesh Sepatu
            const meshHits = raycaster.intersectObjects(shoeContainer.children, true);
            const shoeHit  = meshHits.find((h) => !h.object.userData.isMarker);

            if (shoeHit) {
              // Jika model single-mesh (Puma Suede), tebak bagian berdasarkan posisi lokal sentuhan:
              let partId = partManager.getPartFromIntersect(shoeHit);
              if (!partId || partId === 'upper') {
                const localPoint = shoeContainer.worldToLocal(shoeHit.point.clone());
                if (localPoint.y < -0.09) {
                  partId = 'outsole';
                } else if (localPoint.y < -0.05) {
                  partId = 'midsole';
                } else if (localPoint.x > 0.14) {
                  partId = 'heel';
                } else if (localPoint.y > 0.08 && localPoint.x < 0.05) {
                  partId = 'tongue';
                } else {
                  partId = 'upper';
                }
              }

              const color = PART_COLORS[partId] ?? 0xe94560;
              particles.spawn(shoeHit.point, color);
              onPartHit?.({ partId, screenX: clientX, screenY: clientY });
            }
          }
        };

        const dom = renderer.domElement;
        const previousTouchAction = dom.style.touchAction;
        dom.style.touchAction = 'none';
        dom.addEventListener('mousedown',  onPointerDown);
        dom.addEventListener('mousemove',  onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dom.addEventListener('touchstart', onPointerDown, { passive: true });
        dom.addEventListener('touchmove',  onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        evCleanup = () => {
          dom.style.touchAction = previousTouchAction;
          dom.removeEventListener('mousedown',  onPointerDown);
          dom.removeEventListener('mousemove',  onPointerMove);
          window.removeEventListener('mouseup', onPointerUp);

          dom.removeEventListener('touchstart', onPointerDown);
          dom.removeEventListener('touchmove',  onPointerMove);
          window.removeEventListener('touchend', onPointerUp);
        };

      } catch (err) {
        if (!cancelled) {
          console.error('[AR Error]', err);
          setStatus('error');
          let msg = err.message || 'Gagal mengaktifkan kamera AR.';
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission') || err.message?.includes('denied')) {
            msg = 'Akses kamera ditolak. Izinkan izin kamera di browser untuk melanjutkan.';
          } else if (err.name === 'NotFoundError' || err.message?.includes('device not found')) {
            msg = 'Tidak ada perangkat kamera yang terdeteksi di perangkat Anda.';
          }
          setErrorMsg(msg);
          onTrackingChange?.(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      evCleanup?.();
      particlesRef.current?.clear();
      markersRef.current?.dispose();
      if (mindARRef.current) {
        try {
          mindARRef.current.stop();
          rendererRef.current?.setAnimationLoop(null);
        } catch (_) {}
        mindARRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelSrc, targetSrc]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Loading Screen */}
      {status === 'loading' && (
        <div style={OVERLAY_STYLE}>
          <div style={SPINNER_STYLE} />
          <p style={{ color: '#fff', marginTop: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>
            Menyiapkan Kamera AR & Objek 3D...
          </p>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            Pastikan memberikan izin akses kamera
          </span>
        </div>
      )}

      {/* Error Screen */}
      {status === 'error' && (
        <div style={{ ...OVERLAY_STYLE, padding: '2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '3.2rem', marginBottom: '1rem' }}>⚠️</span>
          <h3 style={{ color: '#e94560', marginBottom: '0.6rem', fontSize: '1.25rem' }}>
            Kamera AR Tidak Dapat Dimulai
          </h3>
          <p style={{ color: '#a0a0b0', maxWidth: '380px', lineHeight: 1.6, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </p>
          <button
            onClick={onRetry}
            className="btn btn-primary"
            style={{ fontSize: '0.88rem', padding: '0.65rem 1.4rem' }}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}
    </div>
  );
}

const OVERLAY_STYLE = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(8,12,20,0.92)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20,
  flexDirection: 'column',
};

const SPINNER_STYLE = {
  width: '50px',
  height: '50px',
  border: '3.5px solid rgba(255,255,255,0.1)',
  borderTop: '3.5px solid #e94560',
  borderRadius: '50%',
  animation: 'arSpin 1s linear infinite',
};

if (!document.getElementById('ar-spin-style')) {
  const s = document.createElement('style');
  s.id = 'ar-spin-style';
  s.textContent = `@keyframes arSpin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}

export default ARScene;
