import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (k: number) => k * k * (3 - 2 * k);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Objects on this layer are drawn by the main camera but left out of the water's reflection pass:
 * small or moving things (people, spray, the surf) whose reflections nobody would miss.
 */
export const NO_REFLECTION = 1;

export function excludeFromReflections<T extends THREE.Object3D>(object: T) {
  object.traverse((o) => o.layers.set(NO_REFLECTION));
  return object;
}

/** Moving things stay out of the shadow map, which is only re-rendered when the sun moves. */
export function excludeFromShadows<T extends THREE.Object3D>(object: T) {
  object.traverse((o) => (o.castShadow = false));
  return object;
}

/** Small seeded PRNG so the world is the same on every visit. */
export function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1D value noise, 0…1. */
export function noise1(x: number, seed: number) {
  const hash = (n: number) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x);
  return lerp(hash(i), hash(i + 1), smooth(x - i));
}

export function fbm(x: number, seed: number, octaves = 5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise1(x * 2 ** o, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

/** Smooth 2D value noise, 0…1. */
export function noise2(x: number, y: number, seed: number) {
  const hash = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = smooth(x - i);
  const v = smooth(y - j);
  return lerp(lerp(hash(i, j), hash(i + 1, j), u), lerp(hash(i, j + 1), hash(i + 1, j + 1), u), v);
}

/**
 * Ridged multifractal noise, 0…1: sharp crests and smooth valleys, like eroded mountains. Each octave
 * is weighted by the one before, so detail gathers along the ridges.
 */
export function ridged2(x: number, y: number, seed: number, octaves = 6) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  let weight = 1;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(noise2(x * freq, y * freq, seed + o * 13) * 2 - 1);
    const signal = n * n * weight;
    weight = Math.min(1, signal * 1.8);
    sum += signal * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export const box = (w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
};

/** A round rod from `a` to `b`: rigging, posts, rails. */
export function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, segments = 5) {
  const length = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

/** Box-projected UVs in world units, so a texture keeps the same scale on every wall and roof. */
function worldUV(geometry: THREE.BufferGeometry, scale: number) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) [u, v] = [pos.getX(i), pos.getZ(i)];
    else if (ax >= az) [u, v] = [pos.getZ(i), pos.getY(i)];
    else [u, v] = [pos.getX(i), pos.getY(i)];
    uv[i * 2] = u * scale;
    uv[i * 2 + 1] = v * scale;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Vertices `start` to `start + count` of a non-indexed geometry, as a geometry of their own. */
function slice(geometry: THREE.BufferGeometry, start: number, count: number) {
  const part = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const size = attribute.itemSize;
    part.setAttribute(name, new THREE.BufferAttribute(attribute.array.slice(start * size, (start + count) * size), size, attribute.normalized));
  }
  return part;
}

/**
 * Merges every mesh under `root` that shares a material into a single mesh,
 * baking in transforms. A bungalow made of hundreds of boards becomes a
 * handful of draw calls. Meshes with several materials are split by their
 * geometry groups first. Materials can set `userData.worldUV` for box-projected UVs.
 */
export function bake(root: THREE.Object3D, { shadows = false } = {}) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const relative = new THREE.Matrix4();
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh) return;
    const source: THREE.BufferGeometry = object.geometry;
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") geometry.deleteAttribute(name);
    }
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    geometry.applyMatrix4(relative.multiplyMatrices(inverse, object.matrixWorld));

    const materials = object.material as THREE.Material | THREE.Material[];
    const parts = Array.isArray(materials)
      ? geometry.groups.map((g) => ({ material: materials[g.materialIndex ?? 0], geometry: slice(geometry, g.start, Math.min(g.count, geometry.attributes.position.count - g.start)) }))
      : [{ material: materials, geometry }];
    if (Array.isArray(materials)) geometry.dispose();

    for (const part of parts) {
      const scale = part.material.userData.worldUV as number | undefined;
      if (scale) worldUV(part.geometry, scale);
      else if (!part.geometry.attributes.uv) {
        part.geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(part.geometry.attributes.position.count * 2), 2));
      }
      part.geometry.clearGroups();
      const list = buckets.get(part.material) ?? [];
      list.push(part.geometry);
      buckets.set(part.material, list);
    }
  });

  const baked = new THREE.Group();
  for (const [material, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = mesh.receiveShadow = shadows;
    baked.add(mesh);
  }
  return baked;
}
