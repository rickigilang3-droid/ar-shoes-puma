/**
 * generate_authentic_dunk.mjs
 *
 * Gunakan tekstur albedo asli sebagai mask dua warna. Hanya transisi di tepi
 * panel yang dihaluskan; pemetaan warna tidak bergantung pada posisi UV.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// ─── Baca GLB ─────────────────────────────────────────────────────────────────
const buf      = fs.readFileSync('public/models/nike_dunk_low.glb');
const chunkLen = buf.readUInt32LE(12);
const gltf     = JSON.parse(buf.toString('utf8', 20, 20 + chunkLen));
const binBuf   = buf.subarray(20 + chunkLen + 8);

// ─── Ekstrak tekstur asli dari GLB ───────────────────────────────────────────
console.log('Mengekstrak tekstur asli dari GLB...');
const sourceImage = gltf.images[0];
if (!sourceImage?.bufferView || !gltf.bufferViews[sourceImage.bufferView]) {
  throw new Error('Tekstur upper tidak ditemukan di dalam model Nike Dunk Low.');
}
const imageView   = gltf.bufferViews[sourceImage.bufferView];
const imageOffset = imageView.byteOffset || 0;
const imageBytes  = binBuf.subarray(imageOffset, imageOffset + imageView.byteLength);

const { data: grayRaw, info: grayInfo } = await sharp(imageBytes)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = grayInfo;

console.log(`Tekstur asli diekstrak: ${grayInfo.width}×${grayInfo.height}`);

// ─── Mask panel upper dengan transisi tepi yang sempit ─────────────────────────
const denoisedMask = await sharp(grayRaw, { raw: { width: W, height: H, channels: 1 } })
  .median(51)
  .raw()
  .toBuffer();

const edgeMask = await sharp(denoisedMask, { raw: { width: W, height: H, channels: 1 } })
  .blur(2)
  .greyscale()
  .raw()
  .toBuffer();

const textureScale = W / 1000;
const swooshPolygons = [
  [
    [56, 147], [66, 138], [78, 128], [92, 118], [106, 110], [120, 106],
    [132, 108], [143, 116], [150, 128], [153, 145], [151, 170], [148, 200],
    [145, 230], [143, 250], [108, 250], [110, 230], [113, 205], [114, 185],
    [110, 170], [100, 159], [86, 152], [72, 149], [56, 147],
  ],
  [
    [178, 99], [165, 80], [150, 62], [135, 45], [120, 36], [105, 38],
    [90, 50], [80, 70], [75, 100], [77, 140], [85, 180], [95, 220],
    [107, 250], [135, 250], [124, 215], [116, 175], [116, 135],
    [124, 110], [138, 95], [155, 95], [178, 99],
  ].map(([x, y]) => [x + 240, y]),
].map((polygon) => polygon.map(([x, y]) => [x * textureScale, y * textureScale]));

function isSwooshPixel(x, y) {
  return swooshPolygons.some((polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersects = ((yi > y) !== (yj > y))
        && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  });
}

// ─── Render colorway ──────────────────────────────────────────────────────────
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function renderColorway({ baseColor, overlayColor }) {
  const out = Buffer.alloc(W * H * 3);

  for (let i = 0; i < W * H; i++) {
    const oi = i * 3;
    const x = i % W;
    const y = Math.floor(i / W);
    const blend = isSwooshPixel(x, y)
      ? 0
      : Math.max(0, Math.min(1, (edgeMask[i] - 112) / 32));
    const detail = Math.max(
      0.65,
      Math.min(1.25, 1 + (grayRaw[i] - edgeMask[i]) / 510),
    );
    for (let channel = 0; channel < 3; channel++) {
      out[oi + channel] = clamp(
        (overlayColor[channel] * (1 - blend) + baseColor[channel] * blend) * detail,
      );
    }
  }
  return out;
}

// ─── Save helper ──────────────────────────────────────────────────────────────
async function saveTexture(filename, rawBuf) {
  const dirs = ['public/models/textures', 'dist/models/textures'];

  const finalBuf = await sharp(rawBuf, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer();

  for (const dir of dirs) {
    if (dir.startsWith('dist') && !fs.existsSync(dir)) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), finalBuf);
    console.log(`  ✓ ${filename} → ${dir}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generate semua varian
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Panda – Black / White
console.log('\nGenerating dunk_panda.jpg (Panda - Black/White)...');
await saveTexture('dunk_panda.jpg', renderColorway({
  baseColor:    [250, 250, 252],  // putih bersih
  overlayColor: [16,  16,  18],   // hitam solid
}));

// 2. University Blue – White / UNC Blue
console.log('Generating dunk_unc.jpg   (University Blue)...');
await saveTexture('dunk_unc.jpg', renderColorway({
  baseColor:    [250, 250, 252],
  overlayColor: [58, 124, 210],   // UNC blue
}));

// 3. Varsity Green – White / Michigan Green
console.log('Generating dunk_green.jpg (Varsity Green)...');
await saveTexture('dunk_green.jpg', renderColorway({
  baseColor:    [250, 250, 252],
  overlayColor: [18,  72,  40],   // deep green
}));

// 4. Grey Fog – White / Grey
console.log('Generating dunk_grey.jpg  (Grey Fog)...');
await saveTexture('dunk_grey.jpg', renderColorway({
  baseColor:    [250, 250, 252],
  overlayColor: [140, 150, 162],  // cool grey
}));

// 5. Triple White – semua putih
console.log('Generating dunk_white.jpg (Triple White)...');
await saveTexture('dunk_white.jpg', renderColorway({
  baseColor:    [250, 250, 252],
  overlayColor: [232, 232, 236],  // soft white overlay
}));

console.log('\n✅ Semua 5 tekstur Nike Dunk Low berhasil di-generate!\n');
