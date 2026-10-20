import React, { useEffect, useRef, useState } from 'react';
import ProductModelViewer from '../components/ProductModelViewer';
import ShoeEducationFacts from '../components/ShoeEducationFacts';
import './ShoeStore.css';
import { shoes } from '../data/products';

function ShoeDetailPage({ shoe, onBack, onCompare, onAddToCart }) {
  const [selectedPartId, setSelectedPartId] = useState(shoe.parts[0]?.id ?? null);
  const [selectedColor, setSelectedColor] = useState(() => shoe.modelColors?.[0] ?? null);
  const selectedPart = shoe.parts.find((part) => part.id === selectedPartId);
  const shoeNumber = String(shoes.findIndex((item) => item.id === shoe.id) + 1).padStart(2, '0');
  const comparisonShoe = shoes.find((item) => item.id !== shoe.id);
  const layoutRef = useRef(null);
  const viewerRef = useRef(null);
  const infoCardRef = useRef(null);
  const [connector, setConnector] = useState(null);

  useEffect(() => {
    setSelectedPartId(shoe.parts[0]?.id ?? null);
    setSelectedColor(shoe.modelColors?.[0] ?? null);
  }, [shoe.id, shoe.parts, shoe.modelColors]);

  useEffect(() => {
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
        if (!hotspot) {
          setConnector(null);
          return;
        }

        const hotspotMarker = hotspot.querySelector('.product-hotspot-dot') ?? hotspot;
        const hotspotBounds = hotspotMarker.getBoundingClientRect();
        const cardBounds = infoCard.getBoundingClientRect();
        const layoutBounds = layout.getBoundingClientRect();
        if (
          hotspotBounds.width === 0 ||
          hotspotBounds.height === 0 ||
          hotspot.dataset.visible === 'false' ||
          hotspot.getAttribute('data-visible') === 'false' ||
          (() => { try { const op = window.getComputedStyle(hotspot).opacity; return op && parseFloat(op) < 0.1; } catch { return false; } })()
        ) {
          setConnector(null);
          return;
        }

        setConnector({
          startX: hotspotBounds.left + hotspotBounds.width / 2 - layoutBounds.left,
          startY: hotspotBounds.top + hotspotBounds.height / 2 - layoutBounds.top,
          endX: cardBounds.left - layoutBounds.left,
          endY: cardBounds.top + 34 - layoutBounds.top,
        });
      });
    };

    updateConnector();
    viewer.addEventListener('camera-change', updateConnector);
    viewer.addEventListener('load', updateConnector);
    window.addEventListener('resize', updateConnector);
    window.addEventListener('scroll', updateConnector, true);
    const resizeObserver = new ResizeObserver(updateConnector);
    resizeObserver.observe(layout);
    resizeObserver.observe(infoCard);

    return () => {
      cancelAnimationFrame(animationFrame);
      viewer.removeEventListener('camera-change', updateConnector);
      viewer.removeEventListener('load', updateConnector);
      window.removeEventListener('resize', updateConnector);
      window.removeEventListener('scroll', updateConnector, true);
      resizeObserver.disconnect();
    };
  }, [selectedPartId, shoe.id]);

  const brandName = shoe.brand || (shoe.name.toUpperCase().startsWith('PUMA') ? 'PUMA' : 'NIKE');
  const brandInitial = brandName[0];

  return (
    <main className="shoe-store shoe-detail-page">
      <header className="store-header">
        <button className="store-back-link" onClick={onBack}>← <span>Koleksi</span></button>
        <a className="store-wordmark" href="/" onClick={(event) => { event.preventDefault(); onBack(); }}>
          <span className="store-mark" aria-hidden="true">{brandInitial}</span>
          <span>{brandName} <small>AR STUDIO</small></span>
        </a>
        <span className="store-detail-counter">{shoeNumber} / {String(shoes.length).padStart(2, '0')}</span>
      </header>

      <section className="shoe-detail-layout" ref={layoutRef}>
        {connector && (
          <svg className="shoe-education-connector" aria-hidden="true">
            <path
              d={`M ${connector.startX} ${connector.startY} C ${connector.startX + 48} ${connector.startY}, ${connector.endX - 48} ${connector.endY}, ${connector.endX} ${connector.endY}`}
            />
            <circle cx={connector.startX} cy={connector.startY} r="4" />
          </svg>
        )}
        <div className="shoe-viewer-column">
          <div className="shoe-detail-heading">
            <p className="store-eyebrow">{shoe.category} / INTERACTIVE 3D</p>
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

          <div className="shoe-viewer-shell" style={{ '--shoe-accent': shoe.accent }}>
            <div className="viewer-topline">
              <span>DRAG TO ROTATE</span>
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
            infoCardRef={infoCardRef}
          />
        </div>
      </section>

      <footer className="store-footer">
        <span>{brandName} AR STUDIO</span>
        <button onClick={onBack}>← KEMBALI KE KOLEKSI</button>
      </footer>
    </main>
  );
}

export default ShoeDetailPage;
