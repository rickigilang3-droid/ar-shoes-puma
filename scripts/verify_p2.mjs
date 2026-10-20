import sharp from 'sharp';

const preview = 'C:/Users/USER/.gemini/antigravity/brain/eb54fedf-6052-425f-868d-bd2a7f7ce6d3/scratch/swoosh_panel2.jpg';
const { data, info } = await sharp(preview).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

// Poly2 in local panel 2 coordinates (W=250, H=250):
const poly2 = [
  [178, 99],
  [162, 88],
  [146, 75],
  [132, 62],
  [118, 52],
  [102, 54],
  [90, 65],
  [83, 82],
  [80, 108],
  [82, 140],
  [88, 175],
  [98, 215],
  [107, 250],
  [135, 250],
  [124, 215],
  [116, 175],
  [112, 130],
  [118, 98],
  [130, 86],
  [150, 92],
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
  .toFile('C:/Users/USER/.gemini/antigravity/brain/eb54fedf-6052-425f-868d-bd2a7f7ce6d3/scratch/verify_p2_red.png');

console.log('Saved verify_p2_red.png');

