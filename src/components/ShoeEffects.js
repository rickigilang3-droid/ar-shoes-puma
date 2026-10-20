import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
//  WARNA per bagian sepatu
// ─────────────────────────────────────────────────────────────
export const PART_COLORS = {
  upper:    0x4a90e2,  // biru
  midsole:  0xf59e0b,  // oranye
  outsole:  0x10b981,  // hijau
  insole:   0x8b5cf6,  // ungu
  tongue:   0x3b82f6,  // biru muda
  heel:     0xef4444,  // merah
};

const HIGHLIGHT_COLOR    = 0xffffff;
const HIGHLIGHT_EMISSIVE = 0x88ccff;

// ─────────────────────────────────────────────────────────────
//  ShoePartManager – mapping mesh ↔ bagian + highlight
// ─────────────────────────────────────────────────────────────
export class ShoePartManager {
  constructor() {
    /** Semua mesh terdaftar (untuk manipulasi global seperti ubah warna) */
    this.allMeshes    = [];
    /** Map<meshName → partId> */
    this.meshToPart   = new Map();
    /** Map<partId → THREE.Mesh[]> */
    this.partToMeshes = new Map();
    /** Semua material asli disimpan di sini untuk reset */
    this.originalMaterials = new Map();
    this.highlightStrength = new Map();
    this.currentHighlight  = null;

    /** Override warna global (THREE.Color | null) */
    this._colorOverride    = null;
    /** Kekuatan lerp override per mesh uuid (0→1) */
    this._overrideStrength = new Map();
    /** Target kekuatan: 1 = override aktif, 0 = kembali asli */
    this._overrideTarget   = 0;
  }

  /**
   * Terapkan override warna ke seluruh mesh sepatu.
   * @param {number|string} hexColor – hex int (0xff0000) atau string ('#ff0000')
   */
  applyColorOverride(hexColor) {
    this._colorOverride  = new THREE.Color(hexColor);
    this._overrideTarget = 1;
  }

  /** Kembalikan semua mesh ke warna material aslinya */
  resetColorOverride() {
    this._overrideTarget = 0;
  }

  /**
   * Daftarkan seluruh mesh dari scene ke sistem part
   * Nama mesh dalam GLB jika mengandung nama part akan dipetakan ke part tersebut.
   * Jika single-mesh (seperti Object_0 pada Puma Suede), tetap didaftarkan ke allMeshes.
   */
  registerGLBModel(scene) {
    const partKeys = Object.keys(PART_COLORS);

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      // Kloning material agar tiap mesh punya material independen
      obj.material = obj.material.clone();
      this.allMeshes.push(obj);
      this.originalMaterials.set(obj.uuid, obj.material.clone());
      this.highlightStrength.set(obj.uuid, 0);
      this._overrideStrength.set(obj.uuid, 0);

      const nameLC = obj.name.toLowerCase();
      const matched = partKeys.find((k) => nameLC.includes(k));
      if (matched) {
        this.meshToPart.set(obj.name, matched);
        if (!this.partToMeshes.has(matched)) this.partToMeshes.set(matched, []);
        this.partToMeshes.get(matched).push(obj);
      }
    });
  }

  /**
   * Daftarkan ProceduralShoe (berisi Group bernama sesuai part)
   */
  registerProceduralModel(group) {
    group.children.forEach((child) => {
      const partId = child.userData.partId;
      if (!partId) return;

      child.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.material = obj.material.clone();
        this.allMeshes.push(obj);
        this.originalMaterials.set(obj.uuid, obj.material.clone());
        this.highlightStrength.set(obj.uuid, 0);
        this._overrideStrength.set(obj.uuid, 0);

        this.meshToPart.set(obj.name, partId);
        if (!this.partToMeshes.has(partId)) this.partToMeshes.set(partId, []);
        this.partToMeshes.get(partId).push(obj);
      });
    });
  }

  /** Highlight satu bagian, reset bagian sebelumnya */
  highlight(partId) {
    this.currentHighlight = partId && this.partToMeshes.has(partId) ? partId : null;
  }

  update(delta) {
    const smoothing = 1 - Math.exp(-10 * delta);

    this.allMeshes.forEach((mesh) => {
      const original = this.originalMaterials.get(mesh.uuid);
      if (!original || !mesh.material?.color || !original.color) return;

      // ── 1. Hitung kekuatan override warna global ──
      const ovCurrent = this._overrideStrength.get(mesh.uuid) ?? 0;
      const ovStrength = ovCurrent + (this._overrideTarget - ovCurrent) * smoothing;
      this._overrideStrength.set(mesh.uuid, ovStrength);

      // Warna basis = lerp antara original → override color
      const baseColor = original.color.clone();
      if (this._colorOverride && ovStrength > 0.001) {
        baseColor.lerp(this._colorOverride, ovStrength);
      }

      // ── 2. Hitung kekuatan highlight bagian yang dipilih ──
      const partId = this.meshToPart.get(mesh.name);
      const hlCurrent = this.highlightStrength.get(mesh.uuid) ?? 0;
      const hlTarget  = (partId && this.currentHighlight === partId) ? 1 : 0;
      const hlStrength = hlCurrent + (hlTarget - hlCurrent) * smoothing;
      this.highlightStrength.set(mesh.uuid, hlStrength);

      // Warna akhir = lerp baseColor → HIGHLIGHT_COLOR
      mesh.material.color.copy(baseColor).lerp(new THREE.Color(HIGHLIGHT_COLOR), hlStrength);

      if (mesh.material.emissive && original.emissive) {
        mesh.material.emissive.copy(original.emissive).lerp(new THREE.Color(HIGHLIGHT_EMISSIVE), hlStrength);
        mesh.material.emissiveIntensity = original.emissiveIntensity + (1.2 - original.emissiveIntensity) * hlStrength;
      }
    });
  }

  /** Reset semua material ke aslinya */
  resetAll() {
    this.highlight(null);
  }

  /** Temukan partId dari mesh yang di-intersect */
  getPartFromIntersect(intersect) {
    let obj = intersect.object;
    while (obj) {
      if (obj.name && this.meshToPart.has(obj.name)) {
        return this.meshToPart.get(obj.name);
      }
      obj = obj.parent;
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
//  ProceduralShoe – model sepatu dari geometri Three.js
//  Digunakan sebagai fallback jika GLB tidak tersedia
//  Setiap part punya nama agar highlight berfungsi
// ─────────────────────────────────────────────────────────────
export function createProceduralShoe() {
  const root = new THREE.Group();
  root.name  = 'ProceduralShoe';

  const parts = [
    // [ partId, geometry, material color, position, rotation? ]
    {
      partId: 'outsole',
      geo:    new THREE.BoxGeometry(0.22, 0.018, 0.09),
      color:  PART_COLORS.outsole,
      pos:    [0, -0.044, 0],
    },
    {
      partId: 'midsole',
      geo:    new THREE.BoxGeometry(0.20, 0.022, 0.083),
      color:  PART_COLORS.midsole,
      pos:    [0, -0.022, 0],
    },
    {
      partId: 'insole',
      geo:    new THREE.BoxGeometry(0.185, 0.006, 0.076),
      color:  PART_COLORS.insole,
      pos:    [0, -0.0, 0],
    },
    {
      // Upper — bentuk trapesoid kasar dari CylinderGeometry
      partId: 'upper',
      geo:    new THREE.CylinderGeometry(0.045, 0.058, 0.065, 8),
      color:  PART_COLORS.upper,
      pos:    [0, 0.03, 0],
    },
    {
      // Tongue
      partId: 'tongue',
      geo:    new THREE.BoxGeometry(0.04, 0.06, 0.005),
      color:  PART_COLORS.tongue,
      pos:    [0, 0.04, -0.04],
    },
    {
      // Heel counter (bagian belakang)
      partId: 'heel',
      geo:    new THREE.CylinderGeometry(0.025, 0.035, 0.055, 6),
      color:  PART_COLORS.heel,
      pos:    [0, 0.02, 0.04],
    },
  ];

  parts.forEach(({ partId, geo, color, pos }) => {
    const mat  = new THREE.MeshPhongMaterial({
      color,
      shininess: 60,
      specular:  new THREE.Color(0x444444),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name  = `${partId}_mesh`;
    mesh.position.set(...pos);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;

    const group        = new THREE.Group();
    group.name         = `${partId}_group`;
    group.userData.partId = partId;
    group.add(mesh);
    root.add(group);
  });

  return root;
}

// ─────────────────────────────────────────────────────────────
//  ParticleSystem – animasi partikel + glow ring saat klik
// ─────────────────────────────────────────────────────────────
export class ClickParticleSystem {
  constructor(scene) {
    this.scene    = scene;
    this.active   = []; // array of { points, ring, clock, mat, ringMat }
  }

  /**
   * Spawn burst partikel + expanding ring di titik klik
   * @param {THREE.Vector3} position  - posisi world di anchor
   * @param {number}        colorHex  - warna partikel (hex int)
   */
  spawn(position, colorHex = 0xe94560) {
    const COUNT = 40;

    // ── Partikel ──
    const positions = new Float32Array(COUNT * 3);
    const velocities = [];
    const color = new THREE.Color(colorHex);

    for (let i = 0; i < COUNT; i++) {
      // semua mulai dari titik klik
      positions[i * 3]     = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // kecepatan acak ke segala arah (hemisphere ke atas)
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI * 0.6; // hemisphere atas
      const speed = 0.003 + Math.random() * 0.006;
      velocities.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
        )
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color:        colorHex,
      size:         0.008,
      transparent:  true,
      opacity:      1.0,
      depthTest:    false,
      sizeAttenuation: true,
      blending:     THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    // ── Expanding ring (glow) ──
    const ringGeo = new THREE.RingGeometry(0.001, 0.012, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity:     0.9,
      side:        THREE.DoubleSide,
      depthTest:   false,
      blending:    THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    // Orientasikan ring sejajar dengan kamera / horizontal
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    // ── Glow sphere (cahaya di titik) ──
    const glowGeo = new THREE.SphereGeometry(0.014, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color:       colorHex,
      transparent: true,
      opacity:     0.5,
      depthTest:   false,
      blending:    THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(position);
    this.scene.add(glow);

    this.active.push({
      points,
      ring,
      glow,
      geo,
      mat,
      ringMat,
      glowMat,
      velocities,
      clock:     0,
      duration:  0.8, // detik
      positions,
    });
  }

  /**
   * Update setiap frame – panggil di animation loop
   * @param {number} delta - detik sejak frame terakhir
   */
  update(delta) {
    this.active = this.active.filter(({ points, ring, glow, geo, mat, ringMat, glowMat,
                                        velocities, positions, duration }, _, arr) => {
      points.clock = (points.clock || 0) + delta;
      const t = points.clock / duration;

      if (t >= 1) {
        // Bersihkan dari scene
        this.scene.remove(points);
        this.scene.remove(ring);
        this.scene.remove(glow);
        geo.dispose(); mat.dispose(); ringMat.dispose(); glowMat.dispose();
        return false;
      }

      // Gerakkan partikel
      const pos = geo.attributes.position;
      for (let i = 0; i < velocities.length; i++) {
        pos.array[i * 3]     += velocities[i].x;
        pos.array[i * 3 + 1] += velocities[i].y - 0.0001; // gravity
        pos.array[i * 3 + 2] += velocities[i].z;
      }
      pos.needsUpdate = true;

      // Fade out partikel
      mat.opacity = 1 - t;

      // Expand ring
      const ringScale = 1 + t * 12;
      ring.scale.set(ringScale, ringScale, 1);
      ringMat.opacity = (1 - t) * 0.9;

      // Fade glow
      const glowScale = 1 + t * 4;
      glow.scale.setScalar(glowScale);
      glowMat.opacity = (1 - t) * 0.4;

      return true;
    });
  }

  /** Hapus semua partikel aktif */
  clear() {
    this.active.forEach(({ points, ring, glow, mat, ringMat, glowMat, geo }) => {
      this.scene.remove(points);
      this.scene.remove(ring);
      this.scene.remove(glow);
      try { geo.dispose(); mat.dispose(); ringMat.dispose(); glowMat.dispose(); } catch (_) {}
    });
    this.active = [];
  }
}
