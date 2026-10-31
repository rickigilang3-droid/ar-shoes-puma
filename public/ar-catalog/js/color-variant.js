/* global AFRAME, THREE */
/**
 * color-customizer – Traverses 3D GLTF meshes and modifies material colors safely
 */
AFRAME.registerComponent('color-customizer', {
  schema: {
    targetMesh: { default: '' }, // empty = targets main meshes
  },

  init() {
    this.originalMaterials = new Map(); // mesh.uuid -> original Color clone
    this.activeMeshes = [];

    this.el.addEventListener('model-loaded', () => {
      const root = this.el.getObject3D('mesh');
      if (!root) return;

      root.traverse((node) => {
        if (node.isMesh && node.material) {
          // Clone material to avoid modifying shared references
          if (!Array.isArray(node.material)) {
            node.material = node.material.clone();
            this.originalMaterials.set(node.uuid, node.material.color.clone());
            this.activeMeshes.push(node);
          } else {
            node.material = node.material.map((mat) => {
              const cloned = mat.clone();
              this.originalMaterials.set(cloned.uuid, cloned.color.clone());
              return cloned;
            });
            this.activeMeshes.push(node);
          }
        }
      });
    });
  },

  setColor(hexOrNull) {
    if (!this.activeMeshes.length) return;

    if (!hexOrNull) {
      // Restore original materials
      this.activeMeshes.forEach((mesh) => {
        if (!Array.isArray(mesh.material)) {
          const orig = this.originalMaterials.get(mesh.uuid);
          if (orig) mesh.material.color.copy(orig);
          mesh.material.needsUpdate = true;
        } else {
          mesh.material.forEach((mat) => {
            const orig = this.originalMaterials.get(mat.uuid);
            if (orig) mat.color.copy(orig);
            mat.needsUpdate = true;
          });
        }
      });
    } else {
      const newColor = new THREE.Color(hexOrNull);
      this.activeMeshes.forEach((mesh) => {
        if (!Array.isArray(mesh.material)) {
          mesh.material.color.set(newColor);
          mesh.material.needsUpdate = true;
        } else {
          mesh.material.forEach((mat) => {
            mat.color.set(newColor);
            mat.needsUpdate = true;
          });
        }
      });
    }
  },
});

