global.self = global;
global.createImageBitmap = async () => ({ width: 1024, height: 1024, close() {} });
global.document = { createElement() { return { getContext() { return {}; } }; } };
const fs = require('fs');
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');

async function testShoeAnatomy(id, file) {
  const buf = fs.readFileSync(file);
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  
  return new Promise((resolve) => {
    new GLTFLoader().parse(arrayBuf, '', (g) => {
      g.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(g.scene);
      const verts = [];
      
      g.scene.traverse(c => {
        if (c.isMesh) {
          const p = c.geometry.attributes.position;
          const n = c.geometry.attributes.normal;
          const mat = c.matrixWorld;
          const v = new THREE.Vector3();
          const norm = new THREE.Vector3();
          for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(mat);
            if (n) norm.fromBufferAttribute(n, i).transformDirection(mat);
            else norm.set(0, 1, 0);
            verts.push({
              x: v.x, y: v.y, z: v.z,
              nx: norm.x, ny: norm.y, nz: norm.z,
              name: c.name
            });
          }
        }
      });
      
      console.log(`\n========================================`);
      console.log(`ANATOMY FOR: ${id}`);
      console.log(`Box: X [${box.min.x.toFixed(3)}, ${box.max.x.toFixed(3)}], Y [${box.min.y.toFixed(3)}, ${box.max.y.toFixed(3)}], Z [${box.min.z.toFixed(3)}, ${box.max.z.toFixed(3)}]`);
      
      // Print extreme points on each axis to determine which is Toe, Heel, Sole, Collar, Lateral, Medial:
      // Top 5 highest Y, lowest Y, highest X, lowest X, highest Z, lowest Z
      function topPts(axis, dir) {
        const sorted = [...verts].sort((a, b) => dir > 0 ? b[axis] - a[axis] : a[axis] - b[axis]);
        const sample = sorted.slice(0, 5);
        const avg = {
          x: sample.reduce((s, p) => s + p.x, 0) / 5,
          y: sample.reduce((s, p) => s + p.y, 0) / 5,
          z: sample.reduce((s, p) => s + p.z, 0) / 5
        };
        console.log(`  ${dir > 0 ? 'Max' : 'Min'} ${axis.toUpperCase()}: avg = (${avg.x.toFixed(3)}, ${avg.y.toFixed(3)}, ${avg.z.toFixed(3)})`);
        return avg;
      }
      
      topPts('x', 1); topPts('x', -1);
      topPts('y', 1); topPts('y', -1);
      topPts('z', 1); topPts('z', -1);
      
      resolve();
    });
  });
}

async function run() {
  await testShoeAnatomy('nike-air-max-270', 'public/models/nike_air_max_270.glb');
  await testShoeAnatomy('nike-air-jordan', 'public/models/nike_air_jordan.glb');
  await testShoeAnatomy('puma-carina-leather', 'public/models/puma_carina_leather.glb');
  await testShoeAnatomy('puma-suede', 'public/models/puma_suede.glb');
  await testShoeAnatomy('puma-vintage-sneaker', 'public/models/puma_vintage_sneaker.glb');
}

run();

