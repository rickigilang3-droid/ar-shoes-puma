AFRAME.registerComponent('fit-shoe', {
  schema: {
    targetSize: { type: 'number', default: 0.34 },
    lift: { type: 'number', default: 0.015 },
  },
  init() {
    this.el.addEventListener('model-loaded', () => {
      const model = this.el.getObject3D('mesh');
      if (!model) return;

      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const dimensions = bounds.getSize(new THREE.Vector3());
      const longestSide = Math.max(dimensions.x, dimensions.y, dimensions.z);
      if (!Number.isFinite(longestSide) || longestSide <= 0) return;

      const factor = this.data.targetSize / longestSide;
      const center = bounds.getCenter(new THREE.Vector3());
      model.scale.setScalar(factor);
      model.position.set(
        -center.x * factor,
        -bounds.min.y * factor + this.data.lift,
        -center.z * factor
      );
      model.updateMatrixWorld(true);
    });
  },
});

AFRAME.registerComponent('shoe-controls', {
  init() {
    this.baseRotation = this.el.object3D.rotation.y;
    this.zoom = 1;
    this.materialColors = [];

    this.el.addEventListener('model-loaded', () => this.prepareMaterials());
  },
  prepareMaterials() {
    const model = this.el.getObject3D('mesh');
    if (!model) return;

    model.traverse((node) => {
      if (!node.isMesh || !node.material) return;

      const sourceMaterials = Array.isArray(node.material) ? node.material : [node.material];
      const clonedMaterials = sourceMaterials.map((material) => material.clone());
      node.material = Array.isArray(node.material) ? clonedMaterials : clonedMaterials[0];
      clonedMaterials.forEach((material) => {
        if (material.color) this.materialColors.push({ material, original: material.color.clone() });
      });
    });

    document.querySelectorAll('[data-model-control]').forEach((button) => {
      button.disabled = false;
    });
  },
  rotate(degrees) {
    this.el.object3D.rotation.y += THREE.MathUtils.degToRad(degrees);
  },
  setZoom(amount) {
    this.zoom = THREE.MathUtils.clamp(this.zoom + amount, 0.6, 1.8);
    this.el.object3D.scale.setScalar(this.zoom);
    document.querySelector('#zoom-readout').textContent = `${Math.round(this.zoom * 100)}%`;
  },
  setColor(color) {
    this.materialColors.forEach(({ material }) => material.color.set(color));
    this.el.object3D.traverse((node) => {
      if (node.isMesh) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => { material.needsUpdate = true; });
      }
    });
  },
  resetColor() {
    this.materialColors.forEach(({ material, original }) => material.color.copy(original));
  },
  reset() {
    this.el.object3D.rotation.y = this.baseRotation;
    this.zoom = 1;
    this.el.object3D.scale.setScalar(1);
    document.querySelector('#zoom-readout').textContent = '100%';
    this.resetColor();
    document.querySelectorAll('.swatch').forEach((swatch) => swatch.setAttribute('aria-pressed', 'false'));
  },
});

window.addEventListener('DOMContentLoaded', () => {
  const status = document.querySelector('#tracking-status');
  const target = document.querySelector('#shoe-target');
  const scene = document.querySelector('a-scene');
  const controls = document.querySelector('.controls');
  const shoe = document.querySelector('#shoe-model-entity');

  const setStatus = (message, state) => {
    status.textContent = message;
    status.dataset.state = state;
  };

  target.addEventListener('markerFound', () => setStatus('Target terdeteksi · sepatu 3D aktif', 'tracking'));
  target.addEventListener('markerLost', () => setStatus('Target hilang · arahkan kamera ke gambar', 'searching'));
  scene.addEventListener('arjs-video-error', () => {
    setStatus('Kamera gagal dibuka · periksa izin kamera dan koneksi HTTPS', 'error');
  });
  shoe.addEventListener('model-error', () => setStatus('Model gagal dimuat · periksa file GLB', 'error'));

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;

    const controller = shoe.components['shoe-controls'];
    if (!controller) return;

    switch (button.dataset.action) {
      case 'rotate-left': controller.rotate(-15); break;
      case 'rotate-right': controller.rotate(15); break;
      case 'zoom-out': controller.setZoom(-0.1); break;
      case 'zoom-in': controller.setZoom(0.1); break;
      case 'reset': controller.reset(); break;
      default:
        if (button.dataset.color) {
          controller.setColor(button.dataset.color);
          document.querySelectorAll('.swatch').forEach((swatch) => {
            swatch.setAttribute('aria-pressed', String(swatch === button));
          });
        }
    }
  });
});