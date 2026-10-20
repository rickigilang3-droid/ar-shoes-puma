import React, { useEffect, useRef, useState } from 'react';

let modelViewerRegistration;

function registerModelViewer() {
  if (!modelViewerRegistration) {
    modelViewerRegistration = import('@google/model-viewer');
  }
  return modelViewerRegistration;
}

function ProductModelPreview({
  shoe,
  className = '',
  loading = 'lazy',
  interactive = false,
  deferred = false,
  passive = false,
  selectedColor = null,
}) {
  const [requested, setRequested] = useState(!deferred);
  const [status, setStatus] = useState(() =>
    deferred ? 'deferred' : customElements.get('model-viewer') ? 'ready' : 'loading',
  );
  const modelViewerRef = useRef(null);
  const [modelLoadState, setModelLoadState] = useState('loading');
  const originalColorsRef = useRef(new Map());
  const originalTexturesRef = useRef(new Map());
  const textureCacheRef = useRef(new Map());
  const modelUrl = selectedColor?.modelUrl || shoe.model;

  useEffect(() => {
    originalColorsRef.current.clear();
    originalTexturesRef.current.clear();
    textureCacheRef.current.clear();
  }, [shoe.id, modelUrl]);

  useEffect(() => {
    if (!requested || status !== 'loading') return undefined;

    let active = true;
    registerModelViewer()
      .then(() => {
        if (active) setStatus('ready');
      })
      .catch((error) => {
        console.error(`[3D preview error: ${shoe.id}]`, error);
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [requested, shoe.id, status]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    const viewer = modelViewerRef.current;
    if (!viewer) return undefined;

    const applySelectedColor = async () => {
      try {
        if (!viewer.model || !viewer.model.materials) return;
        const materials = viewer.model.materials;
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

        let customTexture = null;
        if (selectedColor?.textureUrl) {
          if (textureCacheRef.current.has(selectedColor.textureUrl)) {
            customTexture = textureCacheRef.current.get(selectedColor.textureUrl);
          } else if (typeof viewer.createTexture === 'function') {
            try {
              customTexture = await viewer.createTexture(selectedColor.textureUrl);
              textureCacheRef.current.set(selectedColor.textureUrl, customTexture);
            } catch (texErr) {
              console.warn('[ModelPreview] Gagal membuat tekstur:', texErr);
            }
          }
        }

        materials.forEach((mat, idx) => {
          if (!mat.pbrMetallicRoughness) return;
          const matName = mat.name || '';

          if (selectedColor) {
            const materialColor = selectedColor.materialsByName?.[matName];
            if (materialColor) {
              mat.pbrMetallicRoughness.setBaseColorFactor(materialColor);
              return;
            }

            if (customTexture && mat.pbrMetallicRoughness.baseColorTexture) {
              if (matName.includes('IMG_sole') || (matName.includes('sole') && !matName.includes('Scene_-_Root'))) {
                const soleColor = selectedColor.materials?.sole || '#ffffff';
                mat.pbrMetallicRoughness.setBaseColorFactor(soleColor);
              } else {
                mat.pbrMetallicRoughness.baseColorTexture.setTexture(customTexture);
                mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
              }
              return;
            }

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
            const originalFactor = originalColorsRef.current.get(idx);
            if (originalFactor) {
              mat.pbrMetallicRoughness.setBaseColorFactor(originalFactor);
            }
            const originalTex = originalTexturesRef.current.get(idx);
            if (originalTex && mat.pbrMetallicRoughness.baseColorTexture) {
              mat.pbrMetallicRoughness.baseColorTexture.setTexture(originalTex);
            }
          }
        });
      } catch (err) {
        console.warn('[ModelPreview] Gagal mengubah warna material:', err);
      }
    };

    const handleLoad = () => {
      setModelLoadState('loaded');
      applySelectedColor();
    };
    const handleError = () => setModelLoadState('error');

    if (viewer.loaded) handleLoad();
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    if (viewer.loaded) applySelectedColor();

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [shoe.id, status, selectedColor]);

  const requestPreview = () => {
    setRequested(true);
    setStatus(customElements.get('model-viewer') ? 'ready' : 'loading');
  };

  if (status === 'deferred') {
    if (passive) {
      return (
        <div className={`shoe-preview-poster ${className}`} role="img" aria-label={`Preview 3D ${shoe.name} dimuat setelah membuka detail`}>
          <span aria-hidden="true">3D</span>
          <small>Preview tersedia di detail</small>
        </div>
      );
    }

    return (
      <button className={`shoe-preview-load ${className}`} type="button" onClick={requestPreview}>
        <span aria-hidden="true">↻</span>
        Muat preview 3D
        <small>Model hanya diunduh setelah diminta</small>
      </button>
    );
  }

  if (status === 'error') {
    return <span className="shoe-art-status">Preview 3D gagal dimuat</span>;
  }

  if (status === 'loading') {
    return <span className="shoe-art-status">Menyiapkan model 3D…</span>;
  }

  return (
    <>
      <model-viewer
        key={modelUrl}
        ref={modelViewerRef}
        class={`shoe-catalog-model ${className}`.trim()}
        src={modelUrl}
        alt={`Preview model 3D ${shoe.name}`}
        camera-orbit="35deg 72deg 115%"
        camera-controls={interactive}
        auto-rotate
        rotation-per-second="18deg"
        shadow-intensity="0.8"
        exposure="1"
        environment-image="neutral"
        interaction-prompt="none"
        loading={loading}
        reveal="auto"
      />
      {modelLoadState !== 'loaded' && (
        <span
          className={`shoe-preview-load-state ${modelLoadState === 'error' ? 'is-error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {modelLoadState === 'error' ? 'Preview gagal dimuat. Periksa koneksi.' : 'Memuat model 3D…'}
        </span>
      )}
    </>
  );
}

export default ProductModelPreview;
