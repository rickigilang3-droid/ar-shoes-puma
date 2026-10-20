import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

const targetDir = new URL('../public/targets/', import.meta.url);
const imagePath = new URL('../public/targets/shoe-qr.png', import.meta.url);
const qrTargetPath = new URL('../public/targets/shoe-qr-code.png', import.meta.url);
const mindPath = new URL('../public/targets/shoe-qr.mind', import.meta.url);

await mkdir(targetDir, { recursive: true });
const qrPng = await QRCode.toBuffer('https://ar-shoes-puma.vercel.app/', {
  errorCorrectionLevel: 'H',
  margin: 4,
  width: 800,
  color: { dark: '#171a21', light: '#ffffff' },
});

const poster = new PNG({ width: 960, height: 1280 });
const rgba = (hex) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)).concat(255);

const fillRect = (image, x, y, width, height, hex) => {
  const [red, green, blue, alpha] = rgba(hex);
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const index = (row * image.width + column) * 4;
      image.data[index] = red;
      image.data[index + 1] = green;
      image.data[index + 2] = blue;
      image.data[index + 3] = alpha;
    }
  }
};

const drawImage = (source, destination, x, y, width, height) => {
  for (let row = 0; row < height; row += 1) {
    const sourceY = Math.floor((row / height) * source.height);
    for (let column = 0; column < width; column += 1) {
      const sourceX = Math.floor((column / width) * source.width);
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const targetIndex = ((y + row) * destination.width + x + column) * 4;
      destination.data.set(source.data.subarray(sourceIndex, sourceIndex + 4), targetIndex);
    }
  }
};

const font = {
  A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  H: ['101', '101', '111', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  U: ['101', '101', '101', '101', '111'],
};

const drawText = (image, text, x, y, scale, hex) => {
  let cursor = x;
  for (const letter of text) {
    const glyph = font[letter];
    if (!glyph) {
      cursor += scale * 4;
      continue;
    }
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === '1') fillRect(image, cursor + columnIndex * scale, y + rowIndex * scale, scale, scale, hex);
      });
    });
    cursor += scale * 4;
  }
};

fillRect(poster, 0, 0, poster.width, poster.height, '#f6f7f9');
fillRect(poster, 0, 0, poster.width, 300, '#20242c');
fillRect(poster, 55, 48, 16, 205, '#d93452');
fillRect(poster, 80, 48, 7, 205, '#19a88a');
drawText(poster, 'AR SHOES', 115, 72, 15, '#ffffff');
drawText(poster, 'PUMA SUEDE', 118, 186, 8, '#f4cf35');

const shoeArt = PNG.sync.read(await readFile(new URL('../public/targets/shoe-target.png', import.meta.url)));
drawImage(shoeArt, poster, 780, 20, 138, 260);

fillRect(poster, 55, 320, 850, 850, '#d93452');
fillRect(poster, 67, 332, 826, 826, '#ffffff');
drawImage(PNG.sync.read(qrPng), poster, 80, 345, 800, 800);
fillRect(poster, 55, 1190, 850, 5, '#19a88a');
drawText(poster, 'SCAN AR', 355, 1210, 10, '#20242c');

await writeFile(imagePath, PNG.sync.write(poster));
await writeFile(qrTargetPath, qrPng);

const compiler = new class extends CompilerBase {
  createProcessCanvas(image) {
    return {
      getContext: () => ({
        drawImage: () => {},
        getImageData: () => ({ data: image.data }),
      }),
    };
  }

  compileTrack({ progressCallback, targetImages, basePercent }) {
    const percentPerImage = (100 - basePercent) / targetImages.length;
    let percent = 0;
    const trackingData = targetImages.map((targetImage) => {
      const imageList = buildTrackingImageList(targetImage);
      const percentPerAction = percentPerImage / imageList.length;
      return extractTrackingFeatures(imageList, () => {
        percent += percentPerAction;
        progressCallback(basePercent + percent);
      });
    });
    return Promise.resolve(trackingData);
  }
}();

await compiler.compileImageTargets([poster], () => {});
await writeFile(mindPath, Buffer.from(compiler.exportData()));

console.log('Generated QR poster, QR image target, and MindAR target:');
console.log(fileURLToPath(imagePath));
console.log(fileURLToPath(qrTargetPath));
console.log(fileURLToPath(mindPath));