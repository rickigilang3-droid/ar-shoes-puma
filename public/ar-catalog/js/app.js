document.addEventListener('DOMContentLoaded', () => {
  const marker = document.getElementById('shoe-marker');
  const shoeEntity = document.getElementById('shoe-entity');
  const trackingBadge = document.getElementById('tracking-badge');
  const trackingText = document.getElementById('tracking-text');
  const scanGuide = document.getElementById('scan-guide');
  const activeControls = document.getElementById('active-controls');
  const colorDots = document.querySelectorAll('.color-dot');
  const currentColorName = document.getElementById('current-color-name');

  const btnToggleRotate = document.getElementById('btn-toggle-rotate');
  const rotateStatus = document.getElementById('rotate-status');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnReset = document.getElementById('btn-reset');

  // Marker Found Handler
  marker.addEventListener('markerFound', () => {
    trackingBadge.className = 'tracking-pill active';
    trackingText.textContent = 'Target Dikenali ✓';
    scanGuide.style.display = 'none';
    activeControls.classList.remove('hidden');
  });

  // Marker Lost Handler
  marker.addEventListener('markerLost', () => {
    trackingBadge.className = 'tracking-pill searching';
    trackingText.textContent = 'Mencari marker target…';
    scanGuide.style.display = 'flex';
    activeControls.classList.add('hidden');
  });

  // Color Variants Selector
  colorDots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      colorDots.forEach((d) => d.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');

      const rawColor = target.getAttribute('data-color');
      const hexColor = rawColor === 'null' ? null : rawColor;
      const name = target.getAttribute('data-name') || 'Original';
      currentColorName.textContent = name;

      const customizer = shoeEntity.components['color-customizer'];
      if (customizer) {
        customizer.setColor(hexColor);
      }
    });
  });

  // Auto-Rotate Toggle
  btnToggleRotate.addEventListener('click', () => {
    const gesture = shoeEntity.components['gesture-controls'];
    if (gesture) {
      const active = gesture.toggleAutoRotate();
      rotateStatus.textContent = active ? 'ON' : 'OFF';
      rotateStatus.style.color = active ? '#10b981' : '#ef4444';
    }
  });

  // Zoom Buttons
  btnZoomIn.addEventListener('click', () => {
    const gesture = shoeEntity.components['gesture-controls'];
    if (gesture) gesture.zoomIn();
  });

  btnZoomOut.addEventListener('click', () => {
    const gesture = shoeEntity.components['gesture-controls'];
    if (gesture) gesture.zoomOut();
  });

  // Reset Button
  btnReset.addEventListener('click', () => {
    const gesture = shoeEntity.components['gesture-controls'];
    if (gesture) {
      gesture.resetTransform();
      rotateStatus.textContent = 'ON';
      rotateStatus.style.color = '#10b981';
    }
  });
});

