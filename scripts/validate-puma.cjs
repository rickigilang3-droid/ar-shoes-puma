const fs = require('fs');

const buf = fs.readFileSync('public/models/puma_vintage_sneaker.glb');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
const binStart = 20 + jsonLen + 8;
const binBuf = buf.subarray(binStart);

console.log('Checking all accessors...');
json.accessors.forEach((acc, i) => {
  const bv = json.bufferViews[acc.bufferView];
  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const typeSizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const compSizes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  const totalBytes = acc.count * typeSizes[acc.type] * compSizes[acc.componentType];
  if (byteOffset + totalBytes > binBuf.length) {
    console.error(`Accessor ${i} exceeds buffer: offset=${byteOffset}, needed=${totalBytes}, available=${binBuf.length}`);
  }
});

console.log('Checking all textures and samplers...');
json.textures.forEach((tex, i) => {
  if (tex.source !== undefined && !json.images[tex.source]) {
    console.error(`Texture ${i} references invalid image ${tex.source}`);
  }
  if (tex.sampler !== undefined && !json.samplers[tex.sampler]) {
    console.error(`Texture ${i} references invalid sampler ${tex.sampler}`);
  }
});

console.log('Checking nodes and hierarchy...');
const visited = new Set();
function checkNode(nIdx) {
  if (visited.has(nIdx)) {
    console.error(`Cycle detected at node ${nIdx}`);
    return;
  }
  visited.add(nIdx);
  const n = json.nodes[nIdx];
  if (n.children) {
    n.children.forEach(c => checkNode(c));
  }
}
json.scenes[json.scene || 0].nodes.forEach(n => checkNode(n));
console.log('Validation finished.');

