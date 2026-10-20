const fs = require('fs');

async function buildCleanSolidDunk() {
  console.log('--- Building Clean Solid Dunk Low ---');
  
  const backupBuf = fs.readFileSync('public/models/nike_dunk_low_backup.glb');
  const jsonLen = backupBuf.readUInt32LE(12);
  const baseJson = JSON.parse(backupBuf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 28 + jsonLen;

  // The base geometry data spans from binStart up to BV 3 (28,071,048 bytes)
  const geomDataLen = baseJson.bufferViews[3].byteOffset;
  const geomChunk = backupBuf.subarray(binStart, binStart + geomDataLen);
  console.log(`Original upper geometry chunk length: ${geomChunk.length} bytes.`);

  // Retain accessors 0..51 (the 4 upper meshes)
  const outAccessors = baseJson.accessors.slice(0, 52);

  // Retain bufferViews 0..2
  const outBufferViews = baseJson.bufferViews.slice(0, 3);

  // We start appending after geomChunk
  const outChunks = [geomChunk];
  let currentOffset = geomChunk.length;

  function appendChunk(bufData, target) {
    const pad = (4 - (currentOffset % 4)) % 4;
    if (pad > 0) {
      outChunks.push(Buffer.alloc(pad));
      currentOffset += pad;
    }
    const bvIdx = outBufferViews.length;
    outBufferViews.push({
      buffer: 0,
      byteOffset: currentOffset,
      byteLength: bufData.length,
      ...(target ? { target } : {})
    });
    outChunks.push(bufData);
    currentOffset += bufData.length;
    return bvIdx;
  }

  // Generate outsole geometry
  // Helper to read position data from base upper meshes
  function getAccessorData(accIdx) {
    const acc = baseJson.accessors[accIdx];
    const bv = baseJson.bufferViews[acc.bufferView];
    const byteOffset = binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const stride = bv.byteStride || 12;
    const count = acc.count;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const srcOffset = byteOffset + i * stride;
      positions[i*3] = backupBuf.readFloatLE(srcOffset);
      positions[i*3+1] = backupBuf.readFloatLE(srcOffset + 4);
      positions[i*3+2] = backupBuf.readFloatLE(srcOffset + 8);
    }
    return positions;
  }

  const numYSlices = 60;
  const numXSteps = 24;
  const minY = -0.198, maxY = 0.102;
  const slices = Array.from({ length: numYSlices }, () => ({ pts: [] }));

  for (let mIdx = 0; mIdx < 4; mIdx++) {
    const pos = getAccessorData(baseJson.meshes[mIdx].primitives[0].attributes.POSITION);
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i], y = pos[i+1], z = pos[i+2];
      const sIdx = Math.floor(((y - minY) / (maxY - minY)) * numYSlices);
      if (sIdx >= 0 && sIdx < numYSlices) {
        slices[sIdx].pts.push({ x, y, z });
      }
    }
  }

  const contour = slices.map((s, idx) => {
    let minZ = Infinity;
    s.pts.forEach(p => { if (p.z < minZ) minZ = p.z; });
    let minX = Infinity, maxX = -Infinity;
    s.pts.forEach(p => {
      if (p.z < minZ + 0.006) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
      }
    });
    const y = minY + ((idx + 0.5) / numYSlices) * (maxY - minY);
    return { y, minZ, minX, maxX };
  });

  const outPositions = [];
  const outNormals = [];
  const outUvs = [];
  const outIndices = [];

  // Bottom face
  for (let i = 0; i < numYSlices; i++) {
    const c = contour[i];
    for (let j = 0; j < numXSteps; j++) {
      const alpha = j / (numXSteps - 1);
      const x = c.minX + alpha * (c.maxX - c.minX);
      const y = c.y;
      const z = c.minZ;
      outPositions.push(x, y, z);
      outNormals.push(0, 0, -1);
      
      const u = (x - (-0.0662)) / (0.0420 - (-0.0662)) * (0.8685 - 0.1278) + 0.1278;
      const v = (y - (-0.1979)) / (0.0880 - (-0.1979)) * (0.9963 - (-0.0028)) + (-0.0028);
      outUvs.push(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }
  }

  for (let i = 0; i < numYSlices - 1; i++) {
    for (let j = 0; j < numXSteps - 1; j++) {
      const p00 = i * numXSteps + j;
      const p01 = i * numXSteps + (j + 1);
      const p10 = (i + 1) * numXSteps + j;
      const p11 = (i + 1) * numXSteps + (j + 1);
      
      outIndices.push(p00, p10, p01);
      outIndices.push(p01, p10, p11);
    }
  }

  // Upward perimeter rim
  const baseVertCount = outPositions.length / 3;
  const perimeterPoints = [];
  for (let j = 0; j < numXSteps; j++) perimeterPoints.push({ i: 0, j });
  for (let i = 1; i < numYSlices; i++) perimeterPoints.push({ i, j: numXSteps - 1 });
  for (let j = numXSteps - 2; j >= 0; j--) perimeterPoints.push({ i: numYSlices - 1, j });
  for (let i = numYSlices - 2; i >= 1; i--) perimeterPoints.push({ i, j: 0 });

  const numRim = perimeterPoints.length;
  for (let k = 0; k < numRim; k++) {
    const pt = perimeterPoints[k];
    const origIdx = pt.i * numXSteps + pt.j;
    const x = outPositions[origIdx * 3];
    const y = outPositions[origIdx * 3 + 1];
    const z = outPositions[origIdx * 3 + 2] + 0.005; // 5mm vertical rim into midsole
    outPositions.push(x, y, z);
    outNormals.push(0, 0, -1);
    outUvs.push(outUvs[origIdx * 2], outUvs[origIdx * 2 + 1]);
  }

  for (let k = 0; k < numRim; k++) {
    const nextK = (k + 1) % numRim;
    const b0 = perimeterPoints[k].i * numXSteps + perimeterPoints[k].j;
    const b1 = perimeterPoints[nextK].i * numXSteps + perimeterPoints[nextK].j;
    const t0 = baseVertCount + k;
    const t1 = baseVertCount + nextK;
    
    outIndices.push(b0, b1, t0);
    outIndices.push(b1, t1, t0);
  }

  // Convert outsole arrays to buffers
  const posBytes = Buffer.from(new Float32Array(outPositions).buffer);
  const normBytes = Buffer.from(new Float32Array(outNormals).buffer);
  const uvBytes = Buffer.from(new Float32Array(outUvs).buffer);
  const indBytes = Buffer.from(new Uint32Array(outIndices).buffer);

  let outMinX = Infinity, outMaxX = -Infinity, outMinY = Infinity, outMaxY = -Infinity, outMinZ = Infinity, outMaxZ = -Infinity;
  for (let i = 0; i < outPositions.length; i += 3) {
    const x = outPositions[i], y = outPositions[i+1], z = outPositions[i+2];
    if (x < outMinX) outMinX = x; if (x > outMaxX) outMaxX = x;
    if (y < outMinY) outMinY = y; if (y > outMaxY) outMaxY = y;
    if (z < outMinZ) outMinZ = z; if (z > outMaxZ) outMaxZ = z;
  }

  const posBv = appendChunk(posBytes, 34962);
  const outPosAccIdx = outAccessors.length;
  outAccessors.push({
    bufferView: posBv,
    componentType: 5126,
    count: outPositions.length / 3,
    type: 'VEC3',
    min: [outMinX, outMinY, outMinZ],
    max: [outMaxX, outMaxY, outMaxZ]
  });

  const normBv = appendChunk(normBytes, 34962);
  const outNormAccIdx = outAccessors.length;
  outAccessors.push({
    bufferView: normBv,
    componentType: 5126,
    count: outNormals.length / 3,
    type: 'VEC3'
  });

  const uvBv = appendChunk(uvBytes, 34962);
  const outUvAccIdx = outAccessors.length;
  outAccessors.push({
    bufferView: uvBv,
    componentType: 5126,
    count: outUvs.length / 2,
    type: 'VEC2'
  });

  const indBv = appendChunk(indBytes, 34963);
  const outIndAccIdx = outAccessors.length;
  outAccessors.push({
    bufferView: indBv,
    componentType: 5125,
    count: outIndices.length,
    type: 'SCALAR'
  });

  // Keep Meshes 0..3 from baseJson
  const meshes = baseJson.meshes.slice(0, 4);
  // Add solid outsole mesh
  meshes.push({
    name: 'air_force_one_collect_clean_1_Mod_le_11_2_IMG_sole_sym_0',
    primitives: [{
      attributes: {
        POSITION: outPosAccIdx,
        NORMAL: outNormAccIdx,
        TEXCOORD_0: outUvAccIdx
      },
      indices: outIndAccIdx,
      material: 1,
      mode: 4
    }]
  });

  // Append textures
  const upperTexBuf = fs.readFileSync('public/models/textures/dunk_ref_panda.jpg');
  const soleTexBuf = fs.readFileSync('public/models/textures/orig_sole_extracted.png');

  const upperImgBv = appendChunk(upperTexBuf);
  const soleImgBv = appendChunk(soleTexBuf);

  const images = [
    { bufferView: upperImgBv, mimeType: 'image/jpeg' },
    { bufferView: soleImgBv, mimeType: 'image/png' }
  ];

  const textures = [
    { sampler: 0, source: 0 },
    { sampler: 0, source: 1 }
  ];

  const materials = [
    {
      doubleSided: true,
      name: 'air_force_one_collect_clean_1_Mod_le_11_u0_v0',
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicFactor: 0,
        roughnessFactor: 0.72
      }
    },
    {
      doubleSided: true,
      name: 'IMG_sole_sym',
      pbrMetallicRoughness: {
        baseColorTexture: { index: 1 },
        baseColorFactor: [0.12, 0.12, 0.12, 1.0],
        metallicFactor: 0,
        roughnessFactor: 0.82
      }
    }
  ];

  const finalGltf = {
    asset: { version: '2.0', generator: 'Antigravity Solid Outsole Dunk Generator' },
    scene: 0,
    scenes: baseJson.scenes,
    nodes: baseJson.nodes,
    meshes,
    materials,
    textures,
    images,
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    accessors: outAccessors,
    bufferViews: outBufferViews,
    buffers: [{ byteLength: currentOffset }]
  };

  const binaryChunk = Buffer.concat(outChunks);
  const jsonStr = JSON.stringify(finalGltf);
  const jsonBuf = Buffer.from(jsonStr, 'utf8');
  const jsonPadding = (4 - (jsonBuf.length % 4)) % 4;
  const alignedJson = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadding, 0x20)]);
  
  const binPadding = (4 - (binaryChunk.length % 4)) % 4;
  const alignedBin = Buffer.concat([binaryChunk, Buffer.alloc(binPadding)]);

  const totalLength = 12 + 8 + alignedJson.length + 8 + alignedBin.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const chunk0Header = Buffer.alloc(8);
  chunk0Header.writeUInt32LE(alignedJson.length, 0);
  chunk0Header.writeUInt32LE(0x4e4f534a, 4);

  const chunk1Header = Buffer.alloc(8);
  chunk1Header.writeUInt32LE(alignedBin.length, 0);
  chunk1Header.writeUInt32LE(0x004e4942, 4);

  const finalGlb = Buffer.concat([
    header,
    chunk0Header,
    alignedJson,
    chunk1Header,
    alignedBin
  ]);

  const destPath = 'public/models/nike_dunk_low.glb';
  fs.writeFileSync(destPath, finalGlb);
  console.log(`Saved ${destPath}, size: ${finalGlb.length} bytes.`);
}

buildCleanSolidDunk().catch(err => {
  console.error('Build clean solid dunk failed:', err);
  process.exit(1);
});

