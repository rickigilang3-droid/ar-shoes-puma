import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads');
const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(
    downloadsDir,
    fs.readdirSync(downloadsDir).find((name) => name.startsWith('Nike Dunk Low Retro'))
      || '',
  );

if (!fs.existsSync(inputPath) || !inputPath.endsWith('.html')) {
  throw new Error('Pass the supplied Nike Dunk Low Retro colorway HTML file as an argument.');
}

const html = fs.readFileSync(inputPath, 'utf8');
const dataMatch = html.match(/<script type="application\/json" id="d">([\s\S]*?)<\/script>/i);
if (!dataMatch) throw new Error('The supplied HTML does not contain the expected 3D model data.');

const model = JSON.parse(dataMatch[1]);
if (!Array.isArray(model.m) || !model.det || !model.mask || !Array.isArray(model.h)) {
  throw new Error('The supplied HTML is missing model geometry or colorway textures.');
}

const colors = [
  { file: 'dunk_ref_panda.jpg', base: '#f3f3f1', overlay: '#121212' },
  { file: 'dunk_ref_unc.jpg', base: '#f3f3f1', overlay: '#6fa8dc' },
  { file: 'dunk_ref_grey.jpg', base: '#f3f3f1', overlay: '#a7adb5' },
  { file: 'dunk_ref_green.jpg', base: '#f3f3f1', overlay: '#0e6b3d' },
  { file: 'dunk_ref_white.jpg', base: '#f3f3f1', overlay: '#f3f3f1' },
];

function decodeImage(dataUri, label) {
  const match = dataUri.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error(`Invalid embedded ${label} image.`);
  return { mimeType: match[1], bytes: Buffer.from(match[2], 'base64') };
}

function srgbToLinear(value) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value) {
  const channel = Math.max(0, Math.min(1, value));
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * (channel ** (1 / 2.4)) - 0.055;
}

function colorChannels(hex) {
  return hex.match(/[a-f\d]{2}/gi).map((channel) => srgbToLinear(Number.parseInt(channel, 16)));
}

const detailImage = decodeImage(model.det, 'detail');
const maskImage = decodeImage(model.mask, 'color mask');
const [detailResult, maskResult] = await Promise.all([
  sharp(detailImage.bytes).greyscale().raw().toBuffer({ resolveWithObject: true }),
  sharp(maskImage.bytes).greyscale().raw().toBuffer({ resolveWithObject: true }),
]);
if (
  detailResult.info.width !== maskResult.info.width
  || detailResult.info.height !== maskResult.info.height
) {
  throw new Error('The detail and color mask images have different dimensions.');
}

const width = detailResult.info.width;
const height = detailResult.info.height;
const textureDir = path.join('public', 'models', 'textures');
fs.mkdirSync(textureDir, { recursive: true });

const colorTextures = await Promise.all(colors.map(async ({ file, base, overlay }) => {
  const baseLinear = colorChannels(base);
  const overlayLinear = colorChannels(overlay);
  const pixels = Buffer.alloc(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    const mix = maskResult.data[i] / 255;
    const detail = Math.max(0.55, Math.min(1.4, detailResult.data[i] / 255 + 0.5));
    for (let channel = 0; channel < 3; channel++) {
      const linear = (
        baseLinear[channel] * (1 - mix) + overlayLinear[channel] * mix
      ) * detail;
      pixels[i * 3 + channel] = Math.round(linearToSrgb(linear) * 255);
    }
  }

  const bytes = await sharp(pixels, {
    raw: { width, height, channels: 3 },
  })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(path.join(textureDir, file), bytes);
  return { file, bytes };
}));

const chunks = [];
const bufferViews = [];
const accessors = [];
const meshes = [];
const nodes = [];
let byteOffset = 0;

function appendBufferView(bytes, target) {
  const padding = (4 - (byteOffset % 4)) % 4;
  if (padding) {
    chunks.push(Buffer.alloc(padding));
    byteOffset += padding;
  }
  const bufferView = { buffer: 0, byteOffset, byteLength: bytes.length };
  if (target) bufferView.target = target;
  const index = bufferViews.push(bufferView) - 1;
  chunks.push(bytes);
  byteOffset += bytes.length;
  return index;
}

function addAccessor(bytes, componentType, type, count, options = {}) {
  const bufferView = appendBufferView(bytes, options.target);
  const accessor = { bufferView, componentType, count, type };
  if (options.normalized) accessor.normalized = true;
  if (options.min) accessor.min = options.min;
  if (options.max) accessor.max = options.max;
  return accessors.push(accessor) - 1;
}

function normalizedPositionBounds(bytes) {
  const bounds = Array.from({ length: 3 }, () => [Infinity, -Infinity]);
  for (let i = 0; i < bytes.length / 2; i += 3) {
    for (let channel = 0; channel < 3; channel++) {
      const value = Math.max(-1, bytes.readInt16LE((i + channel) * 2) / 32767);
      bounds[channel][0] = Math.min(bounds[channel][0], value);
      bounds[channel][1] = Math.max(bounds[channel][1], value);
    }
  }
  return {
    min: bounds.map(([min]) => min),
    max: bounds.map(([, max]) => max),
  };
}

for (const [meshIndex, sourceMesh] of model.m.entries()) {
  const positions = Buffer.from(sourceMesh.p, 'base64');
  const normals = Buffer.from(sourceMesh.n, 'base64');
  const uvs = Buffer.from(sourceMesh.t, 'base64');
  const indices = Buffer.from(sourceMesh.i, 'base64');
  if (
    positions.length % 6 || normals.length % 3 || uvs.length % 4
    || indices.length % 6
  ) {
    throw new Error(`Invalid geometry data in reference mesh ${meshIndex + 1}.`);
  }

  const bounds = normalizedPositionBounds(positions);
  const position = addAccessor(positions, 5122, 'VEC3', positions.length / 6, {
    normalized: true,
    target: 34962,
    ...bounds,
  });
  const normal = addAccessor(normals, 5120, 'VEC3', normals.length / 3, {
    normalized: true,
    target: 34962,
  });
  const uv = addAccessor(uvs, 5123, 'VEC2', uvs.length / 4, {
    normalized: true,
    target: 34962,
  });
  const index = addAccessor(indices, 5123, 'SCALAR', indices.length / 2, {
    target: 34963,
  });

  meshes.push({
    name: `Nike Dunk Low Retro mesh ${meshIndex + 1}`,
    primitives: [{ attributes: { POSITION: position, NORMAL: normal, TEXCOORD_0: uv }, indices: index, material: 0 }],
  });
  nodes.push({ mesh: meshIndex });
}

const pandaTexture = colorTextures[0];
const imageView = appendBufferView(pandaTexture.bytes);
const sceneNode = nodes.length;
nodes.push({ name: 'Nike Dunk Low Retro', scale: model.h, children: nodes.map((_, index) => index) });

const gltf = {
  asset: { version: '2.0', generator: 'Nike Dunk Low reference colorway importer' },
  scene: 0,
  scenes: [{ nodes: [sceneNode] }],
  nodes,
  meshes,
  materials: [{
    name: 'Dunk Low Retro colorway',
    pbrMetallicRoughness: {
      baseColorTexture: { index: 0 },
      metallicFactor: 0,
      roughnessFactor: 0.72,
    },
    doubleSided: true,
  }],
  textures: [{ sampler: 0, source: 0 }],
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
  images: [{ bufferView: imageView, mimeType: 'image/jpeg' }],
  accessors,
  bufferViews,
  buffers: [{ byteLength: byteOffset }],
};

const binary = Buffer.concat(chunks);
const jsonBytes = Buffer.from(JSON.stringify(gltf));
const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
const binPadding = (4 - (binary.length % 4)) % 4;
const jsonChunk = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadding, 0x20)]);
const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding)]);
const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
const header = Buffer.alloc(12);
header.write('glTF', 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonChunk.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binChunk.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const outputPath = path.join('public', 'models', 'nike_dunk_low_reference.glb');
fs.writeFileSync(outputPath, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]));

console.log(`Imported reference model: ${outputPath}`);
console.log(`Generated ${colorTextures.length} colorway textures (${width}x${height}).`);
