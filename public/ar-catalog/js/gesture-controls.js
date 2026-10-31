/* global AFRAME */
/**
 * gesture-controls – Modular Touch Rotate & Pinch Zoom for A-Frame
 */
AFRAME.registerComponent('gesture-controls', {
  schema: {
    minScale: { default: 0.35 },
    maxScale: { default: 2.2 },
    rotateSpeed: { default: 0.006 },
    zoomSpeed: { default: 0.003 },
    autoRotate: { default: true },
    autoRotateSpeed: { default: 0.008 },
  },

  init() {
    this.initialScale = { ...this.el.object3D.scale };
    this.initialRotation = { ...this.el.object3D.rotation };

    this.touchStartX = 0;
    this.prevDistance = 0;
    this.isDragging = false;
    this.autoRotateActive = this.data.autoRotate;

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);

    // Mouse fallback for desktop testing
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  },

  tick() {
    if (this.autoRotateActive && !this.isDragging) {
      this.el.object3D.rotation.y += this.data.autoRotateSpeed;
    }
  },

  toggleAutoRotate() {
    this.autoRotateActive = !this.autoRotateActive;
    return this.autoRotateActive;
  },

  zoomIn() {
    const cur = this.el.object3D.scale.x;
    const next = Math.min(cur + 0.15, this.data.maxScale);
    this.el.object3D.scale.set(next, next, next);
  },

  zoomOut() {
    const cur = this.el.object3D.scale.x;
    const next = Math.max(cur - 0.15, this.data.minScale);
    this.el.object3D.scale.set(next, next, next);
  },

  resetTransform() {
    this.el.object3D.scale.set(this.initialScale.x, this.initialScale.y, this.initialScale.z);
    this.el.object3D.rotation.set(this.initialRotation.x, this.initialRotation.y, this.initialRotation.z);
    this.autoRotateActive = true;
  },

  onTouchStart(e) {
    if (e.target.closest('#active-controls') || e.target.closest('.ar-hud-header')) return;

    if (e.touches.length === 1) {
      this.isDragging = true;
      this.autoRotateActive = false;
      this.touchStartX = e.touches[0].clientX;
    } else if (e.touches.length === 2) {
      this.prevDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  },

  onTouchMove(e) {
    if (e.target.closest('#active-controls') || e.target.closest('.ar-hud-header')) return;

    if (e.touches.length === 1 && this.isDragging) {
      e.preventDefault();
      const deltaX = e.touches[0].clientX - this.touchStartX;
      this.el.object3D.rotation.y += deltaX * this.data.rotateSpeed;
      this.touchStartX = e.touches[0].clientX;
    } else if (e.touches.length === 2 && this.prevDistance) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - this.prevDistance) * this.data.zoomSpeed;
      this.prevDistance = dist;

      const cur = this.el.object3D.scale.x;
      const next = Math.min(Math.max(cur + delta, this.data.minScale), this.data.maxScale);
      this.el.object3D.scale.set(next, next, next);
    }
  },

  onTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isDragging = false;
    }
  },

  onMouseDown(e) {
    if (e.target.closest('#active-controls') || e.target.closest('.ar-hud-header')) return;
    this.isDragging = true;
    this.autoRotateActive = false;
    this.touchStartX = e.clientX;
  },

  onMouseMove(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.touchStartX;
      this.el.object3D.rotation.y += deltaX * this.data.rotateSpeed;
      this.touchStartX = e.clientX;
    }
  },

  onMouseUp() {
    this.isDragging = false;
  },

  remove() {
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  },
});

