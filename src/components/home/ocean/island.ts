import * as THREE from "three";
import type { WaterfrontMaterials } from "./materials";
import { fbm, lerp, smooth } from "./utils";

/* ── The island ───────────────────────────────────────────────────────── */

const ISLAND = { cz: -100, rx: 175, rz: 120 };

/**
 * Ground height in waterfront space: an island with a wobbly shoreline and a
 * jungle hill behind the houses, flattened into a level strip where the
 * property sits and dropping under water beneath the deck.
 */
export function islandHeight(x: number, z: number) {
  const angle = Math.atan2(z - ISLAND.cz, x);
  const wobble = 1 + (fbm(angle * 2.2 + 5, 31, 4) - 0.5) * 0.35;
  const inland = 1 - Math.hypot(x / ISLAND.rx, (z - ISLAND.cz) / ISLAND.rz) / wobble;
  const hill = 48 * Math.pow(Math.max(0, inland), 1.4) * (0.75 + 0.5 * fbm(x * 0.012 + z * 0.008 + 3, 7, 4));
  const natural = inland > 0 ? 1.2 + hill + inland * 4 : -3 + inland * 20;

  const along = 1 - smooth(THREE.MathUtils.clamp((Math.abs(x) - 66) / 10, 0, 1));
  const behind = 1 - smooth(THREE.MathUtils.clamp((-z - 14) / 12, 0, 1));
  const property = z <= 0 ? 1.9 : lerp(1.9, -2.5, smooth(Math.min(z / 3, 1)));
  return lerp(natural, property, along * behind);
}

export function terrain(m: WaterfrontMaterials) {
  const geometry = new THREE.PlaneGeometry(380, 270, 150, 105);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -100);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const sand = new THREE.Color("#cbb58c");
  const wet = new THREE.Color("#8f7f60");
  const grass = new THREE.Color("#5f8a40");
  const forest = new THREE.Color("#35602f");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = islandHeight(pos.getX(i), pos.getZ(i));
    pos.setY(i, h);
    if (h < 0) c.copy(wet);
    else if (h < 0.8) c.copy(wet).lerp(sand, h / 0.8);
    else if (h < 2.6) c.copy(sand).lerp(grass, (h - 0.8) / 1.8);
    else c.copy(grass).lerp(forest, Math.min(1, (h - 2.6) / 6));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, m.terrain);
  mesh.receiveShadow = true;
  return mesh;
}
