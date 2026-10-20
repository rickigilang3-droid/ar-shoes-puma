import sharp from 'sharp';

const preview = 'C:/Users/USER/.gemini/antigravity/brain/eb54fedf-6052-425f-868d-bd2a7f7ce6d3/scratch/dunk_orig_preview.jpg';
const { data, info } = await sharp(preview).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

// Panel 1: x in [0, 250], y in [0, 250]
// Let's print out a grid of ASCII characters representing the quarter panel area:
// 'S' for Swoosh (white checkmark)
// '.' for hatched quarter panel
// '#' for eyelet/overlay/midsole
const p1Grid = [];
for (let y = 10; y < 240; y += 5) {
  let row = '';
  for (let x = 10; x < 240; x += 3) {
    const idx = (y * W + x) * info.channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const lum = 0.299*r + 0.587*g + 0.114*b;
    // Let's see what character represents lum
    if (lum > 210) row += 'W';
    else if (lum > 185) row += '+';
    else if (lum > 160) row += '.';
    else row += ' ';
  }
  p1Grid.push(row);
}
console.log('Panel 1 luminance map:');
console.log(p1Grid.join('\n'));

