# Interactive WebAR Sneaker Experience (Modular Architecture)

Implementasi frontend modular untuk katalog sepatu interaktif berbasis Web Augmented Reality (AR) menggunakan marker 2D.

## 1. Alur Interaksi
1. **Pendeteksian Gambar (Marker Tracking):**
   Kamera ponsel mendeteksi marker gambar 2D (Hiro Marker atau kartu target sepatu berkontras tinggi).
2. **Kemunculan Objek 3D:**
   Saat marker terkunci, model 3D sepatu (`.glb`) langsung muncul di atas marker.
3. **Kontrol Interaktif:**
   - **Putar (Rotate):** Geser 1 jari di layar atau aktifkan Auto-Rotate.
   - **Zoom:** Cubit 2 jari (pinch-to-zoom) atau tekan tombol `+` / `−`.
   - **Ganti Warna:** Tekan tombol varian warna untuk mengganti material mesh sepatu secara langsung tanpa reload.

## 2. Struktur Modul
- `index.html`: A-Frame Scene & AR.js anchor.
- `css/ar-style.css`: Antarmuka Glassmorphism HUD responsif.
- `js/gesture-controls.js`: Modul gestur sentuh (Swipe Rotate, Pinch Zoom).
- `js/color-variant.js`: Modul penelusuran GLTF mesh dan penggantian warna material.
- `js/app.js`: Pengendali event tracking (`markerFound` / `markerLost`).

## 3. Optimasi Format Aset & Marker
- **Format:** Gunakan format `.glb` terkompresi DRACO untuk menjaga ukuran file tetap di bawah 3 MB.
- **Marker:** Gunakan gambar dengan kontras tinggi (>60%) dan kepadatan titik fitur tajam (*Harris corners*) agar pelacakan tidak mudah lepas (*tracking loss*).
