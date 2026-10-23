import * as THREE from "three";
import type { Range } from "./config";
import { clamp01, fbm, lerp, noise2, prng, ridged2, smooth } from "./utils";

/** Ripples to use until the real normal map has loaded: a tileable sum of waves. */
export function fallbackNormals(size = 128) {
  const rand = prng(7);
  const waves = Array.from({ length: 24 }, () => {
    let kx = 0;
    let ky = 0;
    while (kx === 0 && ky === 0) {
      kx = Math.round(rand() * 18 - 9);
      ky = Math.round(rand() * 18 - 9);
    }
    return { kx, ky, amp: 1 / Math.pow(Math.hypot(kx, ky), 1.2), phase: rand() * Math.PI * 2 };
  });
  const height = (x: number, y: number) => waves.reduce((h, w) => h + w.amp * Math.sin(((w.kx * x + w.ky * y) / size) * Math.PI * 2 + w.phase), 0);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (height(x + 1, y) - height(x - 1, y)) * 3;
      const dy = (height(x, y + 1) - height(x, y - 1)) * 3;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * size + x) * 4;
      data.set([((-dx / len) * 0.5 + 0.5) * 255, ((-dy / len) * 0.5 + 0.5) * 255, ((1 / len) * 0.5 + 0.5) * 255, 255], o);
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const PALETTE = {
  shore: new THREE.Color("#8a8260"),
  lowland: new THREE.Color("#3b6a30"),
  forest: new THREE.Color("#24492a"),
  canopy: new THREE.Color("#4b7436"),
  rock: new THREE.Color("#5c5e4b"),
  cloudForest: new THREE.Color("#5f7a5a"),
};

/**
 * A rainforested mountain range (or a chain of jungle islands) on the horizon, 9 km long: a
 * ridged-noise heightfield with sharp crests and eroded valleys, massifs rising and falling along a
 * wandering crest line, coloured by height and slope: beaches, lowland forest, darker forested
 * flanks, rocky faces and greyer cloud forest up high. `step` is the metres between vertices.
 */
export function mountains({ z, depth, height, seed, spread, haze, rugged, position, turn = 0 }: Range, step: number) {
  const width = 9000;
  const geometry = new THREE.PlaneGeometry(width, depth, Math.round(width / step), Math.round(depth / step));
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const base = 6;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const d = pos.getZ(i);
    const crest = (fbm(x * 0.0004, seed + 5, 3) - 0.5) * depth * 0.4;
    const profile = smooth(1 - Math.min(1, Math.abs(d - crest) / (depth / 2)));
    // Off the range's footprint there is nothing to shape: skip the noise.
    if (profile <= 0) {
      pos.setY(i, -base);
      continue;
    }
    const massif = smooth(clamp01(((fbm(x * 0.00042, seed, 4) - spread) / (1 - spread)) * 1.6));
    const peaks = ridged2(x * 0.0021, d * 0.0021, seed);
    const hills = (noise2(x * 0.0016, d * 0.0016, seed + 4) + 0.5 * noise2(x * 0.0037, d * 0.0037, seed + 6)) / 1.5;
    const swell = noise2(x * 0.0008, d * 0.0008, seed + 9);
    const relief = lerp(hills, peaks, rugged);
    pos.setY(i, height * Math.pow(profile, 1.15) * (massif * (0.1 + 0.95 * relief + 0.12 * swell) + 0.04 * swell) - base);
  }
  geometry.computeVertexNormals();

  const nor = geometry.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + base;
    const t = y / height;
    const steep = 1 - nor.getY(i);
    const patch = noise2(pos.getX(i) * 0.012, pos.getZ(i) * 0.012, seed + 21);
    c.copy(PALETTE.lowland).lerp(PALETTE.forest, smooth(clamp01(t * 2.5)));
    c.lerp(PALETTE.canopy, patch * 0.45);
    c.lerp(PALETTE.cloudForest, smooth(clamp01((t - 0.55) / 0.35)) * 0.6);
    c.lerp(PALETTE.rock, smooth(clamp01((steep - 0.3) / 0.3)) * 0.55);
    c.lerp(PALETTE.shore, 1 - smooth(clamp01((y - 2) / 6)));
    c.toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  // Thinner haze than the scene's: distant ranges stay blue-grey but keep their ridges and valleys.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <fog_fragment>",
      `#ifdef USE_FOG
        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth ) * ${haze.toFixed(2)};
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
      #endif`,
    );
  };
  material.customProgramCacheKey = () => `mountains-${haze}`;
  // Laid out along x at depth `z`, then moved and turned into place if the range says so.
  geometry.translate(0, 0, z);
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(...position);
  mesh.rotation.y = turn;
  return mesh;
}
