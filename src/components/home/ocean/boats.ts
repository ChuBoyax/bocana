import * as THREE from "three";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Textures } from "./textures";
import { bake, box, lerp, rod, smooth } from "./utils";

export type BoatMaterials = ReturnType<typeof createBoatMaterials>;

export function createBoatMaterials(textures: Textures) {
  const gelcoat = (color: string) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
  return {
    hulls: [gelcoat("#f6f5f0"), gelcoat("#f6f5f0"), gelcoat("#1f3550"), gelcoat("#efe6d2")],
    stripe: new THREE.MeshStandardMaterial({ color: "#1d3b5a", roughness: 0.4, side: THREE.DoubleSide }),
    bottom: new THREE.MeshStandardMaterial({ color: "#6a2420", roughness: 0.7, side: THREE.DoubleSide }),
    teak: new THREE.MeshStandardMaterial({ color: "#c79a6a", map: textures.planks.map, roughness: 0.8 }),
    cabin: new THREE.MeshPhysicalMaterial({ color: "#f3f1ea", roughness: 0.3, clearcoat: 0.8 }),
    portlight: new THREE.MeshStandardMaterial({ color: "#10171c", roughness: 0.08, metalness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: "#c8ccd0", roughness: 0.25, metalness: 1 }),
    rigging: new THREE.MeshStandardMaterial({ color: "#2b2f33", roughness: 0.6, metalness: 0.4 }),
    // Emissive is driven every frame: sailcloth glows when the sun is behind it.
    sail: new THREE.MeshStandardMaterial({ color: "#f3f0e8", map: textures.sail.map, roughness: 0.85, side: THREE.DoubleSide, emissive: "#000000" }),
    canopy: new THREE.MeshStandardMaterial({ color: "#f2c230", roughness: 0.75, side: THREE.DoubleSide }),
    taxiHull: new THREE.MeshPhysicalMaterial({ color: "#f4f4f1", roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }),
    taxiStripe: new THREE.MeshStandardMaterial({ color: "#1690a8", roughness: 0.45, side: THREE.DoubleSide }),
    seat: new THREE.MeshStandardMaterial({ color: "#2d6f8a", roughness: 0.7 }),
    motor: new THREE.MeshStandardMaterial({ color: "#1b1d1f", roughness: 0.35, metalness: 0.3 }),
    wake: new THREE.MeshBasicMaterial({ map: wakeTexture(), transparent: true, depthWrite: false, opacity: 0.75 }),
    skin: ["#5c3a26", "#8d5a3b", "#c58b62", "#e8b991"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 })),
    clothes: ["#f2f2ee", "#d9534f", "#2f6f9f", "#f2c230", "#3c8d5a", "#1d1d1f", "#e88aa0", "#17a39b"].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
    ),
    hair: new THREE.MeshStandardMaterial({ color: "#1c1612", roughness: 0.9 }),
  };
}

const pick = <T,>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)];

/**
 * A simple person at boat scale (about 1.75 m), facing +z. Standing figures
 * have their origin at the feet; seated ones at the seat.
 */
export function person(m: BoatMaterials, rand: () => number, pose: "stand" | "sit") {
  const g = new THREE.Group();
  const skin = pick(m.skin, rand);
  const top = pick(m.clothes, rand);
  const bottom = pick(m.clothes, rand);
  const part = (radius: number, length: number, material: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 3, 8), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, 0, rz);
    return mesh;
  };
  const head = (y: number, z: number) => {
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), skin);
    face.position.set(0, y, z);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.122, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), m.hair);
    hair.position.set(0, y + 0.01, z - 0.01);
    return [face, hair];
  };

  if (pose === "stand") {
    for (const x of [-0.1, 0.1]) g.add(part(0.075, 0.62, skin, x, 0.4, 0));
    const hips = part(0.15, 0.12, bottom, 0, 0.86, 0);
    hips.scale.z = 0.75;
    const torso = part(0.17, 0.38, top, 0, 1.2, 0);
    torso.scale.z = 0.72;
    g.add(hips, torso, ...head(1.6, 0.01));
    for (const side of [-1, 1]) g.add(part(0.055, 0.48, skin, side * 0.25, 1.13, 0.02, 0, side * 0.12));
  } else {
    for (const x of [-0.1, 0.1]) {
      g.add(part(0.075, 0.34, bottom, x, 0.08, 0.2, Math.PI / 2));
      g.add(part(0.068, 0.36, skin, x, -0.2, 0.4));
    }
    const torso = part(0.17, 0.36, top, 0, 0.42, -0.02);
    torso.scale.z = 0.72;
    g.add(torso, ...head(0.82, 0));
    for (const side of [-1, 1]) g.add(part(0.055, 0.42, skin, side * 0.24, 0.38, 0.08, 0.35, side * 0.1));
  }
  return g;
}

/** Foam trail: bright at the stern, fading and spreading behind. */
function wakeTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < 256; y++) {
    const fade = 1 - y / 256;
    const spread = 6 + (y / 256) * 26;
    const g = ctx.createLinearGradient(32 - spread, 0, 32 + spread, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.3, `rgba(255,255,255,${0.55 * fade})`);
    g.addColorStop(0.5, `rgba(255,255,255,${0.2 * fade})`);
    g.addColorStop(0.7, `rgba(255,255,255,${0.55 * fade})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(32 - spread, y, spread * 2, 1);
  }
  return new THREE.CanvasTexture(c);
}

type HullShape = {
  length: number;
  beam: number;
  depth: number;
  sheer: number;
  bowRise: number;
  transom: number;
  stripe: [number, number];
};

/**
 * A lofted hull: cross-sections from a wide transom to a sharp bow, with
 * sheer rising forward and the forefoot lifting. Faces are grouped into
 * topsides, boot stripe and bottom paint by height.
 */
function hull({ length, beam, depth, sheer, bowRise, transom, stripe }: HullShape) {
  const stations = 30;
  const around = 16;
  const ring = around + 1;
  const pos: number[] = [];
  const uv: number[] = [];
  const tops: number[] = [];

  for (let i = 0; i <= stations; i++) {
    const s = i / stations;
    const z = (s - 0.5) * length;
    const widest = 0.42;
    const half = (beam / 2) * (s < widest ? lerp(transom, 1, smooth(s / widest)) : Math.pow(Math.cos(((s - widest) / (1 - widest)) * (Math.PI / 2)), 0.75));
    const top = sheer + bowRise * s * s;
    const bottom = -depth * (s < 0.72 ? 1 : lerp(1, 0.1, smooth((s - 0.72) / 0.28)));
    tops.push(top);
    for (let j = 0; j <= around; j++) {
      const a = -Math.PI / 2 + (Math.PI * j) / around;
      pos.push(half * Math.sin(a), top - (top - bottom) * Math.pow(Math.cos(a), 0.6), z);
      uv.push(j / around, s);
    }
  }

  // Transom cap.
  const center = pos.length / 3;
  pos.push(0, (tops[0] - depth) / 2, -length / 2);
  uv.push(0.5, 0);

  const groups: number[][] = [[], [], []];
  const y = (index: number) => pos[index * 3 + 1];
  const put = (a: number, b: number, c: number) => {
    const avg = (y(a) + y(b) + y(c)) / 3;
    groups[avg > stripe[1] ? 0 : avg > stripe[0] ? 1 : 2].push(a, b, c);
  };
  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * ring + j;
      const b = a + ring;
      put(a, b, a + 1);
      put(b, b + 1, a + 1);
    }
  }
  for (let j = 0; j < around; j++) put(center, j + 1, j);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const index: number[] = [];
  groups.forEach((g, material) => {
    geometry.addGroup(index.length, g.length, material);
    index.push(...g);
  });
  geometry.setIndex(index);
  geometry.computeVertexNormals();

  // Deck: a slightly crowned surface between the two sheer lines.
  const deckPos: number[] = [];
  const deckUv: number[] = [];
  for (let i = 0; i <= stations; i++) {
    const port = i * ring;
    const starboard = i * ring + around;
    const z = pos[port * 3 + 2];
    const x = pos[starboard * 3];
    const t = tops[i];
    deckPos.push(-x, t, z, 0, t + 0.06, z, x, t, z);
    deckUv.push(-x / 2, z / 2, 0, z / 2, x / 2, z / 2);
  }
  const deckIndex: number[] = [];
  for (let i = 0; i < stations; i++) {
    for (let k = 0; k < 2; k++) {
      const a = i * 3 + k;
      deckIndex.push(a, a + 1, a + 3, a + 1, a + 4, a + 3);
    }
  }
  const deck = new THREE.BufferGeometry();
  deck.setAttribute("position", new THREE.Float32BufferAttribute(deckPos, 3));
  deck.setAttribute("uv", new THREE.Float32BufferAttribute(deckUv, 2));
  deck.setIndex(deckIndex);
  deck.computeVertexNormals();

  return { hull: geometry, deck, tops };
}

/** A sail as a cambered triangle: `luff` from tack to head, `clew` the free corner. */
function sail(tack: THREE.Vector3, head: THREE.Vector3, clew: THREE.Vector3, depth: number) {
  const side = new THREE.Vector3().subVectors(head, tack).cross(new THREE.Vector3().subVectors(clew, tack)).normalize();
  const luff = new THREE.Vector3();
  const foot = new THREE.Vector3();
  return new ParametricGeometry(
    (u, v, target) => {
      luff.lerpVectors(tack, head, v);
      foot.subVectors(clew, tack).multiplyScalar(u * (1 - v));
      const chord = clew.distanceTo(tack) * (1 - v);
      target.copy(luff).add(foot).addScaledVector(side, Math.sin(Math.PI * u) * chord * depth);
    },
    10,
    16,
  );
}

/** A cruising sloop: lofted hull, teak deck, cabin, mast and boom, two cambered sails and standing rigging. */
export function sailboat(m: BoatMaterials, rand: () => number) {
  const group = new THREE.Group();
  const length = 9 + rand() * 4;
  const { hull: hullGeometry, deck, tops } = hull({ length, beam: length * 0.33, depth: 1.3, sheer: 1.05, bowRise: 0.45, transom: 0.8, stripe: [0.12, 0.32] });
  const hullMaterial = m.hulls[Math.floor(rand() * m.hulls.length)];
  group.add(new THREE.Mesh(hullGeometry, [hullMaterial, m.stripe, m.bottom]));
  group.add(new THREE.Mesh(deck, m.teak));

  const deckY = tops[Math.round(tops.length * 0.45)];
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(length * 0.2, 0.62, length * 0.34, 3, 0.16), m.cabin);
  cabin.position.set(0, deckY + 0.28, -length * 0.05);
  group.add(cabin, box(length * 0.205, 0.13, length * 0.22, m.portlight, 0, deckY + 0.38, -length * 0.05));

  const mastZ = length * 0.1;
  const mastHeight = length * 1.35;
  const masthead = new THREE.Vector3(0, deckY + mastHeight, mastZ);
  group.add(rod(new THREE.Vector3(0, deckY, mastZ), masthead, 0.08, m.metal, 8));

  // Main and boom swing together, slightly off the centreline.
  const rig = new THREE.Group();
  const boomY = deckY + 1.5;
  const boomLength = length * 0.46;
  rig.add(rod(new THREE.Vector3(0, boomY, mastZ), new THREE.Vector3(0, boomY, mastZ - boomLength), 0.06, m.metal, 6));
  rig.add(
    new THREE.Mesh(
      sail(new THREE.Vector3(0, boomY + 0.1, mastZ - 0.1), new THREE.Vector3(0, deckY + mastHeight * 0.95, mastZ - 0.1), new THREE.Vector3(0, boomY + 0.1, mastZ - boomLength + 0.2), 0.09),
      m.sail,
    ),
  );
  rig.position.z = mastZ;
  rig.children.forEach((c) => (c.position.z -= mastZ));
  rig.rotation.y = (rand() - 0.5) * 0.5;
  group.add(rig);

  const bow = new THREE.Vector3(0, tops[tops.length - 1], length / 2 - 0.1);
  const jibClew = new THREE.Vector3(0.9 * Math.sign(rig.rotation.y || 1), deckY + 0.6, mastZ - length * 0.18);
  group.add(new THREE.Mesh(sail(bow, new THREE.Vector3(0, deckY + mastHeight * 0.82, mastZ + 0.1), jibClew, 0.1), m.sail));

  // Standing rigging.
  const stern = new THREE.Vector3(0, tops[0] + 0.1, -length / 2 + 0.2);
  group.add(rod(bow, masthead, 0.02, m.rigging, 3), rod(stern, masthead, 0.02, m.rigging, 3));
  for (const side of [-1, 1]) {
    group.add(rod(new THREE.Vector3(side * length * 0.15, deckY, mastZ - 0.3), masthead.clone().setY(masthead.y - 0.6), 0.018, m.rigging, 3));
  }
  // Stern and bow pulpits.
  for (const z of [-length / 2 + 0.4, length / 2 - 0.8]) {
    const y = tops[z < 0 ? 1 : tops.length - 4] + 0.7;
    group.add(rod(new THREE.Vector3(-0.8, y, z), new THREE.Vector3(0.8, y, z), 0.025, m.metal, 4));
  }

  // Crew: someone at the helm, someone relaxing on the cabin top, sometimes a third up front.
  const helm = person(m, rand, "stand");
  helm.position.set(0.3, tops[Math.round(tops.length * 0.15)] - 0.1, -length * 0.36);
  const lounging = person(m, rand, "sit");
  lounging.position.set(-0.35, deckY + 0.6, -length * 0.05 + 0.4);
  lounging.rotation.y = 0.5;
  group.add(helm, lounging);
  if (rand() > 0.4) {
    const bowRider = person(m, rand, "sit");
    bowRider.position.set(0.4, tops[Math.round(tops.length * 0.7)] + 0.05, length * 0.22);
    bowRider.rotation.y = -0.4;
    group.add(bowRider);
  }
  // Dozens of parts (rigging, crew) become one mesh per material.
  return bake(group);
}

/** A Bocas water taxi: long white panga with a yellow canopy and an outboard, plus its wake. */
export function waterTaxi(m: BoatMaterials, rand: () => number) {
  const group = new THREE.Group();
  const length = 8;
  const { hull: hullGeometry, tops } = hull({ length, beam: 1.9, depth: 0.5, sheer: 0.55, bowRise: 0.55, transom: 0.9, stripe: [0.3, 0.42] });
  group.add(new THREE.Mesh(hullGeometry, [m.taxiHull, m.taxiStripe, m.taxiHull]));

  const deckY = tops[Math.round(tops.length * 0.4)] - 0.25;
  for (let i = 0; i < 4; i++) {
    const z = -2.2 + i * 1.2;
    group.add(box(1.5, 0.12, 0.35, m.seat, 0, deckY + 0.35, z));
    // Passengers on most benches, facing forward.
    for (const x of [-0.42, 0.42]) {
      if (rand() < 0.35) continue;
      const passenger = person(m, rand, "sit");
      passenger.position.set(x, deckY + 0.42, z - 0.05);
      group.add(passenger);
    }
  }
  const driver = person(m, rand, "stand");
  driver.position.set(0.25, deckY, -length / 2 + 0.75);
  group.add(driver);
  group.add(box(1.95, 0.05, 4.6, m.canopy, 0, deckY + 1.95, -0.6));
  for (const x of [-0.85, 0.85]) for (const z of [-2.7, 1.5]) group.add(rod(new THREE.Vector3(x, deckY, z), new THREE.Vector3(x, deckY + 1.95, z), 0.03, m.metal, 4));
  group.add(box(0.45, 0.6, 0.5, m.motor, 0, deckY + 0.55, -length / 2 - 0.1));
  group.add(box(0.12, 0.8, 0.15, m.motor, 0, deckY - 0.1, -length / 2 - 0.15));

  const wake = new THREE.Mesh(new THREE.PlaneGeometry(6, 26), m.wake);
  // Lie flat with the bright end of the foam against the transom.
  wake.rotation.set(-Math.PI / 2, 0, Math.PI);
  wake.position.set(0, 0.05, -length / 2 - 13);
  group.add(wake);
  const baked = bake(group);
  baked.rotation.order = "YXZ";
  return baked;
}
