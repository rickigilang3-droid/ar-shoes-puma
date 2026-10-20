import sharp from 'sharp';

const origPath = 'C:/Users/USER/.gemini/antigravity/brain/eb54fedf-6052-425f-868d-bd2a7f7ce6d3/scratch/dunk_embedded_0.png';
const { data, info } = await sharp(origPath).resize(2048, 2048).raw().toBuffer({ resolveWithObject: true });
const W = 2048, H = 2048;

const s1Scale = 2048 / 1000;
const poly1 = [
  [56, 147], [66, 138], [78, 128], [92, 118], [106, 110], [120, 106],
  [132, 108], [143, 116], [150, 128], [153, 145], [151, 170], [148, 200],
  [145, 230], [143, 250], [108, 250], [110, 230], [113, 205], [114, 185],
  [110, 170], [100, 159], [86, 152], [72, 149], [56, 147],
].map(([x, y]) => [x * s1Scale, y * s1Scale]);

const poly2 = [
  [178, 99], [162, 88], [146, 75], [132, 62], [118, 52], [102, 54],
  [90, 65], [83, 82], [80, 108], [82, 140], [88, 175], [98, 215],
  [107, 250], [135, 250], [124, 215], [116, 175], [112, 130], [118, 98],
  [130, 86], [150, 92], [178, 99],
].map(([x, y]) => [(x + 240) * s1Scale, y * s1Scale]);

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

let p1Lums = [], p2Lums = [];
for (let y = 0; y < Math.floor(0.26 * H); y++) {
  for (let x = 0; x < Math.floor(0.50 * W); x++) {
    const idx = (y * W + x) * info.channels;
    const lum = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
    if (pointInPoly(x, y, poly1)) p1Lums.push(lum);
    if (pointInPoly(x, y, poly2)) p2Lums.push(lum);
  }
}

const avg = arr => arr.reduce((a,b)=>a+b,0) / arr.length;
console.log('Poly 1 pixels count:', p1Lums.length, 'min:', Math.min(...p1Lums), 'max:', Math.max(...p1Lums), 'avg:', avg(p1Lums));
console.log('Poly 2 pixels count:', p2Lums.length, 'min:', Math.min(...p2Lums), 'max:', Math.max(...p2Lums), 'avg:', avg(p2Lums));

const p1Above205 = p1Lums.filter(l => l >= 205).length;
const p2Above205 = p2Lums.filter(l => l >= 205).length;
console.log('Poly 1 pixels >= 205:', p1Above205, `(${(p1Above205/p1Lums.length*100).toFixed(1)}%)`);
console.log('Poly 2 pixels >= 205:', p2Above205, `(${(p2Above205/p2Lums.length*100).toFixed(1)}%)`);

