# AR Shoes 👟

Aplikasi **Augmented Reality edukasi sepatu** berbasis web.
Scan gambar sepatu → muncul model 3D → klik bagian → edukasi!

## Tech Stack

| Bagian          | Teknologi             |
| --------------- | --------------------- |
| Bahasa utama    | **JavaScript**        |
| Markup          | **HTML5**             |
| Styling         | **CSS3**              |
| Framework web   | **React.js + Vite**   |
| AR              | **MindAR.js (CDN)**   |
| 3D              | **Three.js (npm)**    |
| Format model    | **GLB / GLTF**        |
| Package manager | **Node.js + npm**     |

## Struktur Folder

```
AR Shoes/
├── public/
│   ├── models/
│   │   └── shoe.glb          ← Taruh model 3D sepatu di sini
│   └── targets/
│       └── shoe.mind         ← File image target MindAR
├── src/
│   ├── components/
│   │   ├── ARScene.jsx       ← Komponen AR (MindAR + Three.js)
│   │   └── AROverlay.jsx     ← UI overlay (controls + education panel)
│   ├── data/
│   │   └── shoeData.js       ← Data edukasi bagian sepatu
│   ├── hooks/
│   │   └── useMindAR.js      ← Custom hook MindAR
│   ├── pages/
│   │   ├── LandingPage.jsx   ← Halaman utama
│   │   └── ARPage.jsx        ← Halaman AR experience
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── index.html                ← CDN MindAR.js di-load di sini
```

## Setup & Jalankan

```bash
npm install
npm run dev
```

Dev server bisa diakses dari HP di jaringan WiFi yang sama (gunakan HTTPS):
```
https://<IP-komputer-kamu>:5173
```

## Cara Membuat Image Target (.mind)

1. Buka **[MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)**
2. Upload gambar sepatu (JPG/PNG, minimal 300x300px, kontras tinggi)
3. Download file `.mind` yang dihasilkan
4. Untuk demo AR, taruh file di `public/targets/shoe-qr.mind`; gambar target yang ditampilkan tersedia di `public/targets/shoe-qr.png`

## Cara Mendapatkan Model 3D Sepatu (.glb)

- **Sketchfab**: https://sketchfab.com/search?q=shoe&type=models (filter: Free + Downloadable)
- Export dalam format **GLB**
- Taruh di `public/models/shoe.glb`

> **Catatan**: Tanpa file `.glb`, scene AR akan menampilkan kotak merah sebagai placeholder.
> Tanpa file `.mind`, kamera akan terus scanning tanpa menemukan target.

## Fitur

- Landing page dengan animasi
- Katalog 3D interaktif dengan preview dimuat saat diminta
- Perbandingan spesifikasi dua model sepatu
- Hotspot edukasi yang dapat dipilih dengan fungsi dan material tiap bagian
- Panduan pengenalan khusus tiap model dengan ciri visual dan teknologi utamanya
- Panduan edukasi kisaran harga, rentang ukuran, dan palet warna model digital
- Demo AR PUMA Suede melalui MindAR image tracking di `/ar`
- Instruksi scan target ditampilkan sebelum kamera diminta
- Kamera AR memerlukan HTTPS atau localhost dan izin kamera browser
- Model 3D GLB dengan auto-rotate
- Panel edukasi slide-up per bagian sepatu
- Navigasi antar bagian (prev/next)
- Status tracking realtime
- Fallback jika model belum ada
- Responsive (mobile-first)

Melihat model 3D di katalog tidak memerlukan scan atau izin kamera. Scan gambar target
hanya diperlukan untuk membuka demo AR MindAR. File model sepatu dapat berukuran besar;
preview katalog dan perbandingan 3D dimuat secara eksplisit agar tidak mengunduh semua
model saat halaman pertama dibuka.

Harga ditampilkan dalam rupiah. Untuk lima aset tambahan, harga katalog dibedakan berdasarkan
model dan ditampilkan dengan format harga pasar Indonesia. Angka tersebut adalah estimasi untuk
katalog edukasi, bukan klaim harga resmi atau harga jual SKU; sebagian aset tidak mengidentifikasi
seri, versi, atau colorway secara lengkap. Tabel ukuran menggunakan angka EU bulat dan panjang kaki dalam cm dari panduan merek; tabel
ini bukan informasi ketersediaan stok atau panjang insole. Cocokkan kembali dengan label sepatu
dan size chart regional sebelum membeli.

Keranjang, checkout, pilihan QRIS/transfer/e-wallet, dan riwayat transaksi di aplikasi ini
merupakan simulasi front-end yang disimpan di browser. Konfirmasi pembayaran demo tidak
mengirim pesanan, memproses pembayaran, atau menagih uang; jangan masukkan data pembayaran nyata.
Data kontak checkout hanya dipakai untuk menampilkan konfirmasi di sesi tersebut dan tidak
disimpan ke riwayat transaksi.

Referensi harga dan ukuran untuk koleksi tambahan:

- [adidas Samba OG (Indonesia)](https://www.adidas.co.id/id/sepatu-samba-og/IH3979.html) dan
  [adidas size chart](https://www.adidas.com/us/help/size_charts).
- [Vans](https://www.vans.com/) dan
  [Vans size chart](https://www.vans.com/en-us/help/size-charts.html).
- Aset tambahan tidak selalu menyertakan SKU yang bisa dicocokkan dengan harga resmi Indonesia;
  nominal katalog yang dipakai untuk aset tersebut ditandai sebagai harga referensi.

## Kredit aset 3D

Varian **Game Ready / 2K PBR** pada Nike Dunk menggunakan model “Nike Dunks (Game Ready /
2K PBR)” karya [Meerschaum Digital](https://sketchfab.com/meerschaumdigital), dari
[Sketchfab](https://sketchfab.com/3d-models/nike-dunks-game-ready-2k-pbr-d88162d9ac244b0d9a3aaceaefe475fd),
dengan lisensi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Varian **Midnight Navy** menggunakan model “Nike Dunk Low Midnight Navy” karya
[xFaMouZ7](https://sketchfab.com/xFaMouZ7), dari
[Sketchfab](https://sketchfab.com/3d-models/nike-dunk-low-midnight-navy-1d5d550ad3754f1aad9201999c7af8b2),
dengan lisensi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Koleksi tambahan menggunakan model Sketchfab berikut:

- “Adidas running - Green” karya [AXL Visual & Design](https://sketchfab.com/axlvisual),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- “664230027 Photogrammetry Vans” karya [664230027](https://sketchfab.com/664230027),
  [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). Model dan tekstur
  ditampilkan tanpa perubahan; thumbnail katalog hanya render tampilan asli tanpa recolor.
  Opsi recolor tidak tersedia.
- “VANS” karya [PlatonDebik](https://sketchfab.com/Platon_Debik),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- “Adidas Yeezy Boost 350 V2” karya
  [Nyilonelycompany](https://sketchfab.com/Nyilonelycompany),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- “Old Adidas Samba Sneaker” karya
  [Kai Christmann](https://sketchfab.com/kai_am_rhein),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Colorway selain tampilan bawaan aset diberi label **simulasi** dan bukan SKU atau foto
produk resmi. Nama model, harga, ukuran, serta bahan yang tidak tercantum pada sumber 3D
ditandai belum diketahui alih-alih diasumsikan. Harga serta tautan size chart untuk produk
tambahan ditampilkan di detail produk, dengan negara dan keterbatasan identifikasi aset
dijelaskan di dekat nilainya.
