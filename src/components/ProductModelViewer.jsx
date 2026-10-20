import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';

function ProductModelViewer({ shoe, selectedPartId, onSelectPart, viewerRef, selectedColor }) {
  const internalViewerRef = useRef(null);
  const modelViewerRef = viewerRef ?? internalViewerRef;
  const [loadState, setLoadState] = useState('loading');
  const originalColorsRef = useRef(new Map());
  const originalTexturesRef = useRef(new Map());
  const textureCacheRef = useRef(new Map());
  const modelUrl = selectedColor?.modelUrl || shoe.model;

  // Reset cache material saat model yang ditampilkan berganti
  useEffect(() => {
    originalColorsRef.current.clear();
    originalTexturesRef.current.clear();
    textureCacheRef.current.clear();
  }, [shoe.id, modelUrl]);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return undefined;

    const applySelectedColor = async () => {
      try {
        if (!viewer.model || !viewer.model.materials) return;
        const materials = viewer.model.materials;

        // Simpan baseColorFactor & baseColorTexture asli tiap material bila belum dicatat
        materials.forEach((mat, idx) => {
          if (!mat.pbrMetallicRoughness) return;
          if (!originalColorsRef.current.has(idx)) {
            const factor = mat.pbrMetallicRoughness.baseColorFactor;
            originalColorsRef.current.set(idx, Array.isArray(factor) ? [...factor] : factor);
          }
          if (!originalTexturesRef.current.has(idx)) {
            const texture = mat.pbrMetallicRoughness.baseColorTexture?.texture ?? null;
            originalTexturesRef.current.set(idx, texture);
          }
        });

        if (selectedColor?.modelUrl) return;

        // 1. Jika varian memiliki textureUrl khusus (Dunk, Air Max, Jordan, Puma):
        let customTexture = null;
        if (selectedColor?.textureUrl) {
          if (textureCacheRef.current.has(selectedColor.textureUrl)) {
            customTexture = textureCacheRef.current.get(selectedColor.textureUrl);
          } else if (typeof viewer.createTexture === 'function') {
            try {
              customTexture = await viewer.createTexture(selectedColor.textureUrl);
              textureCacheRef.current.set(selectedColor.textureUrl, customTexture);
            } catch (texErr) {
              console.warn('[ModelViewer] Gagal membuat tekstur:', texErr);
            }
          }
        }

        // 2. Terapkan warna / tekstur terpilih ke material model 3D secara detail dan realistis
        materials.forEach((mat, idx) => {
          if (!mat.pbrMetallicRoughness) return;
          const matName = mat.name || '';

          if (selectedColor) {
            const materialColor = selectedColor.materialsByName?.[matName];
            if (materialColor) {
              mat.pbrMetallicRoughness.setBaseColorFactor(materialColor);
              return;
            }

            // Jika ada custom texture untuk model bertekstur
            if (customTexture && mat.pbrMetallicRoughness.baseColorTexture) {
              // Preserve separate sole materials when the model provides them.
              if (matName.includes('IMG_sole') || (matName.includes('sole') && !matName.includes('Scene_-_Root'))) {
                const soleColor = selectedColor.materials?.sole || '#ffffff';
                mat.pbrMetallicRoughness.setBaseColorFactor(soleColor);
              } else {
                mat.pbrMetallicRoughness.baseColorTexture.setTexture(customTexture);
                mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
              }
              return;
            }

            // Jika model multi-material PBR (seperti Nike Air Force 1 '07)
            const matConfig = selectedColor.materials;
            let targetColor = selectedColor.hex || selectedColor;

            if (matConfig) {
              if (matName.includes('Leather_2226')) {
                // Base leather (toe box, vamp & quarter panels)
                targetColor = matConfig.base || targetColor;
              } else if (matName.includes('Leather_Copy') || matName === 'Scene_-_Root_1_1.001') {
                // Swoosh dan heel tab overlay
                targetColor = matConfig.overlay || targetColor;
              } else if (matName.includes('Cotton_Twill_1463669')) {
                // Tali sepatu (laces)
                targetColor = matConfig.laces || matConfig.base || targetColor;
              } else if (matName.includes('Cotton') || matName.includes('Topstitch')) {
                // Lining dan jahitan
                targetColor = matConfig.accent || matConfig.base || targetColor;
              } else if (matName === 'Scene_-_Root_1_1' || matName.includes('sole') || matName.includes('IMG_sole')) {
                // Sol sepatu (midsole / outsole)
                targetColor = matConfig.sole || matConfig.base || targetColor;
              } else {
                targetColor = matConfig.overlay || matConfig.base || targetColor;
              }
            }

            mat.pbrMetallicRoughness.setBaseColorFactor(targetColor);
          } else {
            // Kembalikan warna awal
            const originalFactor = originalColorsRef.current.get(idx);
            if (originalFactor) {
              mat.pbrMetallicRoughness.setBaseColorFactor(originalFactor);
            }
            // Kembalikan tekstur awal
            const originalTex = originalTexturesRef.current.get(idx);
            if (originalTex && mat.pbrMetallicRoughness.baseColorTexture) {
              mat.pbrMetallicRoughness.baseColorTexture.setTexture(originalTex);
            }
          }
        });
      } catch (err) {
        console.warn('[ModelViewer] Gagal mengubah warna material:', err);
      }
    };

    const handleLoad = () => {
      setLoadState('loaded');
      applySelectedColor();
    };
    const handleError = () => setLoadState('error');

    if (viewer.loaded) {
      handleLoad();
    }
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    if (viewer.loaded) {
      applySelectedColor();
    }

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [modelViewerRef, shoe.id, selectedColor]);

  return (
    <>
      <model-viewer
        key={modelUrl}
        ref={modelViewerRef}
        class="product-model-viewer"
        src={modelUrl}
        alt={`Model 3D interaktif ${shoe.name}. Putar dengan menggeser; pilih penanda untuk membaca fungsi dan material.`}
        ar-placement="floor"
        camera-controls
        touch-action="pan-y"
        auto-rotate
        auto-rotate-delay="3000"
        rotation-per-second="12deg"
        shadow-intensity="0.8"
        exposure="1"
        environment-image="neutral"
        camera-orbit="35deg 72deg 115%"
        interaction-prompt="auto"
        loading="eager"
        reveal="auto"
        ar
        ar-modes="webxr scene-viewer quick-look"
        aria-describedby="viewer-load-status"
      >
        {shoe.parts.map((part) => (
          <button
            key={part.id}
            slot={`hotspot-${part.id}`}
            className={`product-hotspot ${selectedPartId === part.id ? 'is-active' : ''}`}
            style={{ '--hotspot-accent': shoe.accent }}
            data-position={part.position}
            data-normal={part.normal}
            data-visibility-attribute="visible"
            aria-label={`Pelajari ${part.name}`}
            aria-pressed={selectedPartId === part.id}
            onClick={() => onSelectPart(part.id)}
          >
            <span className="product-hotspot-dot" />
            <span className="product-hotspot-label">{part.name}</span>
          </button>
        ))}
      </model-viewer>
      {loadState !== 'loaded' && (
        <p
          className={`viewer-load-status ${loadState === 'error' ? 'is-error' : ''}`}
          id="viewer-load-status"
          role="status"
          aria-live="polite"
        >
          {loadState === 'error'
            ? 'Model 3D gagal dimuat. Periksa koneksi lalu muat ulang halaman.'
            : 'Memuat model 3D… Pemuatan pertama mungkin perlu waktu.'}
        </p>
      )}
    </>
  );
}

export default ProductModelViewer;
