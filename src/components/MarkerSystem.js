import * as THREE from 'three';
import { PART_COLORS } from './ShoeEffects.js';

// ─────────────────────────────────────────────────────────────
//  Posisi marker 3D per bagian sepatu (koordinat relatif anchor)
//  Disesuaikan agar pas melayang di setiap komponen sepatu Puma Suede.
// ─────────────────────────────────────────────────────────────
export const MARKER_LOCAL_POSITIONS = {
  upper:   new THREE.Vector3(-0.06,  0.09, 0.20),
  midsole: new THREE.Vector3( 0.00, -0.07, 0.19),
  outsole: new THREE.Vector3(-0.12, -0.12, 0.18),
  insole:  new THREE.Vector3( 0.08,  0.05, 0.19),
  tongue:  new THREE.Vector3( 0.02,  0.13, 0.21),
  heel:    new THREE.Vector3( 0.22,  0.03, 0.18),
};

// ─────────────────────────────────────────────────────────────
//  AnnotationMarkerSystem
//  Membuat dan menganimasi titik-titik glowing marker 3D
//  di atas model sepatu, setiap titik representasi satu bagian.
// ─────────────────────────────────────────────────────────────
export class AnnotationMarkerSystem {
  constructor(scene, targetParent) {
    this.scene        = scene;
    this.targetParent = targetParent;
    this.markers      = [];   // { mesh, ringMesh, partId, baseY }
    this.clock        = 0;
    this._created     = false;
  }

  /** Buat semua marker dan tambahkan ke targetParent */
  build(positions = MARKER_LOCAL_POSITIONS) {
    if (this._created) return;
    this._created = true;

    Object.entries(positions).forEach(([partId, localPos]) => {
      const color = PART_COLORS[partId] ?? 0xffffff;

      // ── Core glowing bead (ukuran proporsional dan jelas terlihat di HP) ──
      const geo = new THREE.SphereGeometry(0.018, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        transparent: true,
        opacity: 0.95,
      });
      const dot = new THREE.Mesh(geo, mat);
      dot.position.copy(localPos);
      dot.renderOrder = 20;
      dot.userData = { partId, isMarker: true };

      // ── Pulsing ring (gelombang melingkar) ──
      const ringGeo = new THREE.RingGeometry(0.026, 0.036, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(localPos);
      ring.renderOrder = 19;

      // ── Glow halo (pijar cahaya lembut) ──
      const haloGeo = new THREE.SphereGeometry(0.04, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(localPos);
      halo.renderOrder = 18;

      this.targetParent.add(dot, ring, halo);
      this.markers.push({ dot, ring, halo, mat, ringMat, haloMat, partId, baseY: localPos.y, color, highlight: 0 });
    });
  }

  /** Animasikan semua marker — panggil di animation loop */
  update(delta, selectedPartId) {
    this.clock += delta;
    const t = this.clock;

    this.markers.forEach((marker) => {
      const { dot, ring, halo, mat, ringMat, haloMat, partId, baseY } = marker;
      const isSelected = partId === selectedPartId;
      marker.highlight += ((isSelected ? 1 : 0) - marker.highlight) * (1 - Math.exp(-12 * delta));
      const highlight = marker.highlight;

      // Efek melayang naik turun lembut
      dot.position.y  = baseY + Math.sin(t * 2.2 + partId.length) * 0.005;
      ring.position.y = dot.position.y;
      halo.position.y = dot.position.y;

      // Gelombang cincin berdenyut
      const ringT   = (t % 1.6) / 1.6;
      const ringScl = 1 + ringT * 1.5;
      ring.scale.set(ringScl, ringScl, 1);
      ringMat.opacity = (1 - highlight) * (1 - ringT) * 0.65 + highlight * 0.95;

      // Highlight saat bagian dipilih
      mat.opacity     = 0.9 + highlight * 0.1;
      haloMat.opacity = 0.18 + highlight * 0.27;
      const idleHaloScale = 1 + Math.sin(t * 3) * 0.12;
      const haloScl   = idleHaloScale + (1.6 - idleHaloScale) * highlight;
      halo.scale.setScalar(haloScl);
      dot.scale.setScalar(1 + highlight * 0.35);
    });
  }

  /** Sembunyikan / tampilkan semua marker */
  setVisible(visible) {
    this.markers.forEach(({ dot, ring, halo }) => {
      dot.visible  = visible;
      ring.visible = visible;
      halo.visible = visible;
    });
  }

  /** Kembalikan daftar mesh yang bisa di-raycast (hanya dot) */
  getRaycastTargets() {
    return this.markers.map(({ dot }) => dot);
  }

  dispose() {
    this.markers.forEach(({ dot, ring, halo, mat, ringMat, haloMat }) => {
      [dot, ring, halo].forEach((m) => this.targetParent.remove(m));
      try { mat.dispose(); ringMat.dispose(); haloMat.dispose(); } catch(_) {}
    });
    this.markers = [];
    this._created = false;
  }
}
