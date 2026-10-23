import * as THREE from "three";
import { DAY, SHOTS } from "./config";
import { clamp01, lerp, smooth } from "./utils";

/** Where we are between two keyframes of a timeline, eased. */
function segment<T extends { t: number }>(keys: T[], t: number) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  return { i, k: clamp01((t - keys[i].t) / (keys[i + 1].t - keys[i].t)) };
}

// Parsed once, not on every frame.
const colors = DAY.map((l) => ({
  sun: new THREE.Color(l.sun),
  sky: new THREE.Color(l.sky),
  ground: new THREE.Color(l.ground),
  water: new THREE.Color(l.water),
  fog: new THREE.Color(l.fog),
}));

/** The light at film time `t` (0…1). The returned object is reused: read it, don't keep it. */
const light = {
  elevation: 0,
  azimuth: 0,
  exposure: 0,
  turbidity: 0,
  rayleigh: 0,
  clouds: 0,
  sunIntensity: 0,
  windows: 0,
  sun: new THREE.Color(),
  sky: new THREE.Color(),
  ground: new THREE.Color(),
  water: new THREE.Color(),
  fog: new THREE.Color(),
};

export function lightAt(t: number) {
  const { i, k: raw } = segment(DAY, t);
  const k = smooth(raw);
  const a = DAY[i];
  const b = DAY[i + 1];
  for (const key of ["elevation", "azimuth", "exposure", "turbidity", "rayleigh", "clouds", "sunIntensity", "windows"] as const) {
    light[key] = lerp(a[key], b[key], k);
  }
  for (const key of ["sun", "sky", "ground", "water", "fog"] as const) light[key].copy(colors[i][key]).lerp(colors[i + 1][key], k);
  return light;
}

const toVectors = (points: [number, number, number][]) => points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
const PATH = new THREE.CatmullRomCurve3(toVectors(SHOTS.map((s) => s.pos)));
const LOOK = new THREE.CatmullRomCurve3(toVectors(SHOTS.map((s) => s.look)));

/** Camera position and look-at point at film time `t` (0…1); each shot lands exactly on its keyframe time. */
export function cameraAt(t: number, position: THREE.Vector3, look: THREE.Vector3) {
  const { i, k } = segment(SHOTS, clamp01(t));
  const u = (i + k) / (SHOTS.length - 1);
  PATH.getPoint(u, position);
  LOOK.getPoint(u, look);
}
