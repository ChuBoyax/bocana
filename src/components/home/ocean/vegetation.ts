import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* ── Vegetation ───────────────────────────────────────────────────────── */

/** One pinnate palm frond: a drooping rachis lined with tapering leaflets. */
export function frond(length: number, droop: number, leaflets = 38) {
  const pos: number[] = [];
  const point = (t: number) => new THREE.Vector3(0, Math.sin(Math.min(t / 0.6, 1) * Math.PI * 0.5) * 0.9 - t * t * droop, t * length);
  for (let k = 0; k < leaflets; k++) {
    const t = 0.06 + (0.92 * k) / leaflets;
    const p = point(t);
    const tangent = point(Math.min(t + 0.01, 1)).sub(p).normalize();
    const reach = 0.25 + 1.15 * Math.pow(Math.sin(Math.PI * t), 0.6);
    for (const side of [-1, 1]) {
      const dir = new THREE.Vector3(side, -0.35 - t * 0.4, 0).addScaledVector(tangent, 0.6).normalize();
      const tip = p.clone().addScaledVector(dir, reach);
      const mid = p.clone().addScaledVector(dir, reach * 0.45).add(new THREE.Vector3(0, 0.05, 0));
      const widthDir = tangent.clone().multiplyScalar(0.07);
      pos.push(...p.clone().sub(widthDir).toArray(), ...mid.toArray(), ...p.clone().add(widthDir).toArray());
      pos.push(...p.clone().add(widthDir).toArray(), ...mid.toArray(), ...tip.toArray());
      pos.push(...p.clone().sub(widthDir).toArray(), ...tip.toArray(), ...mid.toArray());
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  geometry.computeVertexNormals();
  return geometry;
}

/** A coconut palm: curved, tapering ringed trunk and a crown of fronds (plus a few dead ones hanging). */
export function palmGeometries(rand: () => number) {
  const height = 9 + rand() * 4.5;
  const lean = 1 + rand() * 2.5;
  const top = new THREE.Vector3(lean, height, 0);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean * 0.15, height * 0.35, 0),
    new THREE.Vector3(lean * 0.55, height * 0.72, 0),
    top,
  ]);
  const tubular = 24;
  const radial = 8;
  const trunk = new THREE.TubeGeometry(curve, tubular, 1, radial);
  const p = trunk.attributes.position;
  const uv = trunk.attributes.uv;
  const center = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, center);
    const radius = 0.24 + 0.12 * (1 - t) + 0.16 * Math.pow(1 - t, 8);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(p, k).sub(center).normalize().multiplyScalar(radius).add(center);
      p.setXYZ(k, v.x, v.y, v.z);
      uv.setXY(k, j / radial, t * height * 0.3);
    }
  }
  trunk.computeVertexNormals();

  const live: THREE.BufferGeometry[] = [];
  const dead: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  const count = 13;
  for (let i = 0; i < count; i++) {
    const f = frond(3.8 + rand() * 1.4, 1.6 + rand() * 1.4);
    m.makeRotationFromEuler(new THREE.Euler(-0.25 + rand() * 0.5, (i / count) * Math.PI * 2 + rand() * 0.3, 0, "YXZ"));
    f.applyMatrix4(m).translate(top.x, top.y, top.z);
    live.push(f);
  }
  for (let i = 0; i < 3; i++) {
    const f = frond(3.2, 0.6);
    m.makeRotationFromEuler(new THREE.Euler(1.2 + rand() * 0.3, rand() * Math.PI * 2, 0, "YXZ"));
    f.applyMatrix4(m).translate(top.x, top.y - 0.2, top.z);
    dead.push(f);
  }
  return { trunk, fronds: mergeGeometries(live), dead: mergeGeometries(dead) };
}

/** A rainforest crown made of leaf cards; normals point outward so it shades like a volume. */
export function crownGeometry(rand: () => number, radius: number) {
  const cards: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < 30; i++) {
    const card = new THREE.PlaneGeometry(radius * 0.9, radius * 0.9);
    const dir = new THREE.Vector3(rand() - 0.5, (rand() - 0.35) * 0.8, rand() - 0.5).normalize();
    m.makeRotationFromEuler(new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI));
    card.applyMatrix4(m).translate(dir.x * radius * 0.6, dir.y * radius * 0.45, dir.z * radius * 0.6);
    cards.push(card);
  }
  const crown = mergeGeometries(cards)!;
  const p = crown.attributes.position;
  const n = crown.attributes.normal;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).multiply(new THREE.Vector3(1, 1.6, 1)).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  return crown;
}

export function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], shadows: boolean) {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
  mesh.castShadow = mesh.receiveShadow = shadows;
  return mesh;
}
