const fs = require('fs');

const buf = fs.readFileSync('public/models/puma_vintage_sneaker.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
const binBuf = buf.subarray(20 + jsonLen + 8);

// Backup if not exists
if (!fs.existsSync('public/models/puma_vintage_sneaker_backup.glb')) {
  fs.copyFileSync('public/models/puma_vintage_sneaker.glb', 'public/models/puma_vintage_sneaker_backup.glb');
}

// Clean material: remove alphaMode BLEND and emissive
gltf.materials.forEach(mat => {
  delete mat.alphaMode;
  delete mat.emissiveFactor;
  delete mat.emissiveTexture;
  mat.doubleSided = true;
});

const jsonBytes = Buffer.from(JSON.stringify(gltf));
const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
const finalJsonChunk = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadding, 0x20)]);

const binPadding = (4 - (binBuf.length % 4)) % 4;
const finalBinChunk = Buffer.concat([binBuf, Buffer.alloc(binPadding)]);

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

fs.writeFileSync('public/models/puma_vintage_sneaker.glb', Buffer.concat([header, jsonHeader, finalJsonChunk, binHeader, finalBinChunk]));
console.log('Successfully cleaned material in puma_vintage_sneaker.glb');

