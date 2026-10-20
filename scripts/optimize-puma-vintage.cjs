const fs = require('fs');
const sharp = require('sharp');

async function optimizePumaVintage() {
  const buf = fs.readFileSync('public/models/puma_vintage_sneaker.glb');
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  const binBuf = buf.subarray(20 + jsonLen + 8);

  console.log('Original GLB size:', buf.length);

  // Clean material properties
  gltf.materials.forEach(mat => {
    delete mat.alphaMode;
    delete mat.emissiveFactor;
    delete mat.emissiveTexture;
    mat.doubleSided = true;
    if (mat.pbrMetallicRoughness) {
      mat.pbrMetallicRoughness.roughnessFactor = 0.8;
      mat.pbrMetallicRoughness.metallicFactor = 0.1;
    }
  });

  // Optimize embedded images (convert heavy PNGs to optimized JPEGs)
  const newChunks = [];
  const newBufferViews = [];
  let offset = 0;

  // Track which bufferViews belong to images
  const imageBvMap = new Map();
  gltf.images.forEach((img, i) => {
    imageBvMap.set(img.bufferView, i);
  });

  for (let bvIdx = 0; bvIdx < gltf.bufferViews.length; bvIdx++) {
    const bv = gltf.bufferViews[bvIdx];
    let bytes = binBuf.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);

    if (imageBvMap.has(bvIdx)) {
      const imgIdx = imageBvMap.get(bvIdx);
      console.log(`Optimizing image ${imgIdx} (original size: ${bytes.length})...`);
      try {
        const optJpg = await sharp(bytes)
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
        console.log(`  -> Optimized size: ${optJpg.length} (saved ${bytes.length - optJpg.length} bytes)`);
        bytes = optJpg;
        gltf.images[imgIdx].mimeType = 'image/jpeg';
      } catch (err) {
        console.warn(`Could not optimize image ${imgIdx}:`, err.message);
      }
    }

    const padding = (4 - (offset % 4)) % 4;
    if (padding) {
      newChunks.push(Buffer.alloc(padding));
      offset += padding;
    }

    const newBv = { ...bv, byteOffset: offset, byteLength: bytes.length };
    newBufferViews.push(newBv);
    newChunks.push(bytes);
    offset += bytes.length;
  }

  gltf.bufferViews = newBufferViews;
  gltf.buffers[0].byteLength = offset;

  const newBinChunk = Buffer.concat(newChunks);
  const jsonBytes = Buffer.from(JSON.stringify(gltf));
  const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
  const binPadding = (4 - (newBinChunk.length % 4)) % 4;
  const finalJsonChunk = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadding, 0x20)]);
  const finalBinChunk = Buffer.concat([newBinChunk, Buffer.alloc(binPadding)]);

  const totalLength = 12 + 8 + finalJsonChunk.length + 8 + finalBinChunk.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(finalJsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(finalBinChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  const finalGlb = Buffer.concat([header, jsonHeader, finalJsonChunk, binHeader, finalBinChunk]);
  fs.writeFileSync('public/models/puma_vintage_sneaker.glb', finalGlb);
  console.log('Optimized GLB size:', finalGlb.length, `(Reduced by ${((1 - finalGlb.length / buf.length) * 100).toFixed(1)}%)`);
}

optimizePumaVintage();

