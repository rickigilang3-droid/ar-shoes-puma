import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Polyfill minimal browser globals for GLTFLoader in node
global.THREE = THREE;
global.self = global;

const buf = fs.readFileSync('public/models/puma_vintage_sneaker.glb');
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
try {
  loader.parse(
    arrayBuffer,
    '',
    (gltf) => {
      console.log('GLTFLoader parse SUCCESS!');
      console.log('Scene children count:', gltf.scene.children.length);
      console.log('Animations:', gltf.animations.length);
    },
    (err) => {
      console.error('GLTFLoader parse ERROR:', err);
    }
  );
} catch (e) {
  console.error('Exception during parse:', e);
}

