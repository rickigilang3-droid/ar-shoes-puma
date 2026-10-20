import sharp from 'sharp';

const preview = 'C:/Users/USER/.gemini/antigravity/brain/eb54fedf-6052-425f-868d-bd2a7f7ce6d3/scratch/swoosh_panel2.jpg';
const { data, info } = await sharp(preview).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

const poly2 = [
  [178, 99],
  [165, 80],
  [150, 62],
  [135, 45],
  [120, 36],
  [105, 38],
  [90, 50],
  [80, 70],
  [75, 100],
  [77, 140],
  [85, 180],
  [95, 220],
  [107, 250],
  [135, 250],
  [124, 215],
  [116, 175],
  [116, 135],
  [124, 110],
  [138, 95],
  [155, 95],
  [178, 99],
];

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const out = Buffer.from(data);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (pointInPoly(x, y, poly2)) {
      const idx = (y * W + x) * info.channels;
      out[idx] = 255;
      out[idx+1] = 0;
      out[idx+2] = 0;
    }
  }
}

await sharp(out, { raw: info })
  .png()
  .toFile('C:/Users/USER/.gemini/antigravity/brain/eb54fedf-6052-425f-868d-bd2a7f7ce6d3/scratch/verify_p2_perfect.png');

console.log('Saved verify_p2_perfect.png');

