import * as THREE from "three";
import type { WaterfrontMaterials } from "./materials";
import { chairPose, Figure, leanPose, loungePose, standPose, type Look, type Pose } from "./people";
import { box, prng, rod } from "./utils";
import { frond } from "./vegetation";

/*
 * The buildings and their furniture: Caribbean bungalows of one to three floors (verandas, balconies,
 * shutters, gingerbread trim, bell-cast tin roofs), and the deck's sun loungers. Everything is built
 * from simple meshes facing +z, then baked by material by the caller.
 */

/* ── Building parts (all face +z) ─────────────────────────────────────── */

/** Window or glazed door: white frame, glazing bars, glass. Sits on a wall face at z = 0. */
function glazing(m: WaterfrontMaterials, w: number, h: number, { rows = 2, cols = 2 } = {}) {
  const g = new THREE.Group();
  g.add(box(w - 0.08, h - 0.08, 0.04, m.glass, 0, 0, 0.05));
  const frame = 0.12;
  g.add(box(w, frame, 0.12, m.trim, 0, h / 2, 0.06), box(w + 0.1, frame * 1.4, 0.18, m.trim, 0, -h / 2, 0.08));
  g.add(box(frame, h, 0.12, m.trim, -w / 2, 0, 0.06), box(frame, h, 0.12, m.trim, w / 2, 0, 0.06));
  for (let c = 1; c < cols; c++) g.add(box(0.05, h, 0.08, m.trim, -w / 2 + (w * c) / cols, 0, 0.09));
  for (let r = 1; r < rows; r++) g.add(box(w, 0.05, 0.08, m.trim, 0, -h / 2 + (h * r) / rows, 0.09));
  return g;
}

type Rect = { x0: number; x1: number; z0: number; z1: number };

/** A flat-shaded polygon fan, UVs in metres: u along its first (eave) edge, v up the slope. */
function pushFace(points: THREE.Vector3[], pos: number[], nor: number[], uv: number[], scale: number) {
  const normal = new THREE.Vector3().subVectors(points[1], points[0]).cross(new THREE.Vector3().subVectors(points[2], points[0])).normalize();
  if (normal.y < 0) {
    points = [...points].reverse();
    normal.negate();
  }
  const along = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
  const up = new THREE.Vector3().crossVectors(normal, along);
  for (let k = 1; k < points.length - 1; k++) {
    for (const p of [points[0], points[k], points[k + 1]]) {
      pos.push(p.x, p.y, p.z);
      nor.push(normal.x, normal.y, normal.z);
      uv.push(p.dot(along) * scale, p.dot(up) * scale);
    }
  }
}

/**
 * Bell-cast hip roof over `outer`: a shallow kick all round the eaves (it carries over the veranda),
 * breaking a metre in into a steep hip. Returns the tin surface and the ridge and hip lines for caps.
 */
function bellCastRoof(outer: Rect, eave: number, kick: number, pitch: number) {
  const run = 1;
  const inner = { x0: outer.x0 + run, x1: outer.x1 - run, z0: outer.z0 + run, z1: outer.z1 - run };
  const brk = eave + run * kick;
  const width = inner.x1 - inner.x0;
  const depth = inner.z1 - inner.z0;
  const half = Math.min(width, depth) / 2;
  const top = brk + half * pitch;
  const cx = (inner.x0 + inner.x1) / 2;
  const cz = (inner.z0 + inner.z1) / 2;
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  // Corners, counter-clockwise from the front left.
  const o = [V(outer.x0, eave, outer.z1), V(outer.x1, eave, outer.z1), V(outer.x1, eave, outer.z0), V(outer.x0, eave, outer.z0)];
  const i = [V(inner.x0, brk, inner.z1), V(inner.x1, brk, inner.z1), V(inner.x1, brk, inner.z0), V(inner.x0, brk, inner.z0)];
  const long = width >= depth;
  const r = long ? [V(inner.x0 + half, top, cz), V(inner.x1 - half, top, cz)] : [V(cx, top, inner.z1 - half), V(cx, top, inner.z0 + half)];
  const upper = long
    ? [[i[0], i[1], r[1], r[0]], [i[1], i[2], r[1]], [i[2], i[3], r[0], r[1]], [i[3], i[0], r[0]]]
    : [[i[0], i[1], r[0]], [i[1], i[2], r[1], r[0]], [i[2], i[3], r[1]], [i[3], i[0], r[0], r[1]]];

  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  // 16 ribs per texture repeat: a rib about every 14 cm, like box-profile roofing.
  for (let k = 0; k < 4; k++) pushFace([o[k], o[(k + 1) % 4], i[(k + 1) % 4], i[k]], pos, nor, uv, 0.45);
  for (const face of upper) pushFace(face, pos, nor, uv, 0.45);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const caps: [THREE.Vector3, THREE.Vector3][] = [[r[0], r[1]], [i[0], r[0]], [i[3], long ? r[0] : r[1]], [i[1], long ? r[1] : r[0]], [i[2], r[1]]];
  for (let k = 0; k < 4; k++) caps.push([o[k], i[k]]);
  return { geometry, caps };
}

/** Lays out something built along +x from the origin on the line from `a` to `b` (in the XZ plane). */
function onLine(object: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  object.position.copy(a);
  object.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
  return object;
}

/** Chippendale-style railing between x0 and x1: rails with an X in every bay, as on the real porches. */
export function lattice(m: WaterfrontMaterials, x0: number, x1: number, z: number, y = 0, height = 1, material: THREE.Material = m.trim) {
  const g = new THREE.Group();
  const width = x1 - x0;
  g.add(box(width, 0.1, 0.12, material, (x0 + x1) / 2, y + height, z), box(width, 0.08, 0.1, material, (x0 + x1) / 2, y + 0.12, z));
  const bays = Math.max(1, Math.round(width / 1.3));
  const bay = width / bays;
  const diag = Math.hypot(bay, height - 0.12);
  const angle = Math.atan2(height - 0.12, bay);
  for (let i = 0; i < bays; i++) {
    const cx = x0 + bay * (i + 0.5);
    for (const sign of [-1, 1]) {
      const bar = box(diag, 0.06, 0.06, material, cx, y + 0.12 + (height - 0.12) / 2, z);
      bar.rotation.z = sign * angle;
      g.add(bar);
    }
    g.add(box(0.1, height, 0.1, material, x0 + bay * i, y + height / 2, z));
  }
  g.add(box(0.1, height, 0.1, material, x1, y + height / 2, z));
  return g;
}

type Shutters = "side" | "bahama";

/** A six-light window with casing, sill and drip cap, and its shutters: louvred leaves folded back, or a Bahama shutter propped open. */
function windowUnit(m: WaterfrontMaterials, w: number, h: number, shutter: THREE.Material, kind: Shutters) {
  const g = new THREE.Group();
  g.add(glazing(m, w, h, { rows: 2, cols: 3 }));
  g.add(box(w + 0.28, 0.07, 0.18, m.trim, 0, -h / 2 - 0.08, 0.1), box(w + 0.24, 0.1, 0.16, m.trim, 0, h / 2 + 0.1, 0.09));
  if (kind === "side") {
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(side * (w / 2 + 0.07), 0, 0.07);
      hinge.rotation.y = -side * 0.18;
      hinge.add(box(w / 2, h + 0.06, 0.04, shutter, (side * w) / 4, 0, 0));
      g.add(hinge);
    }
  } else {
    const length = h * 0.95;
    const open = 0.55;
    const hinge = new THREE.Group();
    hinge.position.set(0, h / 2 + 0.16, 0.1);
    hinge.rotation.x = -open;
    hinge.add(box(w + 0.22, length, 0.05, shutter, 0, -length / 2, 0));
    g.add(hinge);
    const tip = new THREE.Vector3(0, h / 2 + 0.16 - length * Math.cos(open), 0.1 + length * Math.sin(open));
    for (const side of [-1, 1]) {
      const x = side * (w / 2 - 0.05);
      g.add(rod(tip.clone().setX(x), new THREE.Vector3(x, tip.y - 0.4, 0.08), 0.018, m.trim, 4));
    }
  }
  return g;
}

/** Glazed double doors with a transom light, origin at the threshold. */
function frenchDoor(m: WaterfrontMaterials, w = 1.5, h = 2.05) {
  const door = glazing(m, w, h, { rows: 4, cols: 2 });
  door.position.y = h / 2;
  const transom = glazing(m, w, 0.32, { rows: 1, cols: 3 });
  transom.position.y = h + 0.24;
  return new THREE.Group().add(door, transom);
}

/** A potted areca palm, as on the real deck. */
function pottedPalm(m: WaterfrontMaterials, rand: () => number) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.44, 10), m.pot);
  pot.position.y = 0.22;
  g.add(pot);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(frond(0.8 + rand() * 0.3, 0.45, 12), m.frond);
    leaf.scale.setScalar(0.75);
    leaf.rotation.set(-0.35 + rand() * 0.3, (i / 6) * Math.PI * 2 + rand() * 0.4, 0, "YXZ");
    leaf.position.y = 0.4;
    g.add(leaf);
  }
  return g;
}

/** A hammock slung between two hooks `length` apart along +x, sagging under its own weight. */
function hammock(material: THREE.Material, length: number) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.3, -1.8, 0),
    new THREE.Vector3(length * 0.7, -1.8, 0),
    new THREE.Vector3(length, 0, 0),
  ]);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.26, 6), material);
  // Flattened into a sheet of cloth: wide across, thin top to bottom.
  mesh.scale.y = 0.38;
  return mesh;
}

export type BungalowSpec = {
  width: number;
  depth: number;
  wall: THREE.Material;
  roof: THREE.Material;
  shutter: THREE.Material;
  shutters?: Shutters;
  /** Floor height above the base. */
  floor?: number;
  /** Veranda round the sides as well as the front. */
  wrap?: boolean;
  /** Open stilts (over water, or down a slope) instead of a lattice skirt. */
  stilts?: boolean;
  /** How far the stilts reach below the base. */
  footing?: number;
  steps?: boolean;
  /** A black water tank on a stand out the back, as on most Bocas houses. */
  tank?: boolean;
  /** One, two or three floors; upper floors get a balcony over the veranda below. */
  stories?: number;
  /** How many people are about: in a veranda chair, at the balcony rail, out on the balcony. */
  guests?: number;
  seed: number;
};

const WALL = 2.85;
const EAVE = 2.7;
export const VERANDA = 2.4;
/** Floor to floor. */
const STOREY = 3;

/** Holiday-makers and locals: skin tones, beachwear, hair. */
const LOOKS: Look[] = [
  { skin: "#8d5a3b", shorts: "#1d3b5a", top: "#f4f1e8", hair: "#1c1612" },
  { skin: "#e3b48c", shorts: "#e9d8b4", top: "#e63946", hair: "#6b4a2b", long: true },
  { skin: "#c58b62", shorts: "#3c8d5a", hair: "#1c1612" },
  { skin: "#f1c9a5", shorts: "#2c4a6e", top: "#7fc8f8", hair: "#d9b26a", long: true },
  { skin: "#6b4430", shorts: "#c0392b", top: "#ffd23f", hair: "#120e0b" },
  { skin: "#e8bf9a", shorts: "#17a39b", top: "#f28b74", hair: "#3b2a1e", long: true },
  { skin: "#a8714a", shorts: "#2b2b2b", top: "#ffffff", hair: "#1c1612" },
  { skin: "#f3d2b3", shorts: "#f4f1e8", top: "#2bb6c4", hair: "#8a5a32", long: true },
];

/** A person, posed once: for baking into the static scenery. */
export function person(rand: () => number, pose: Pose) {
  const figure = new Figure(LOOKS[Math.floor(rand() * LOOKS.length)]);
  figure.apply(pose);
  return figure.root;
}

/**
 * A Caribbean bungalow facing +z, origin at its base under the middle of the front wall: a raised
 * clapboard core with shuttered windows and French doors, a veranda in front (or wrapping round)
 * with posts, gingerbread brackets and a Chippendale railing, all under one bell-cast tin roof.
 */
export function bungalow(m: WaterfrontMaterials, spec: BungalowSpec) {
  const { width: w, depth: d, wall, roof, shutter, shutters = "side", floor: f = 0.75, wrap = false, stilts = false, footing = 2.5, steps = true, tank = false, stories = 1, guests = 0 } = spec;
  const rand = prng(spec.seed);
  const g = new THREE.Group();
  const side = wrap ? 2 : 0;
  const deck: Rect = { x0: -w / 2 - side, x1: w / 2 + side, z0: -d, z1: VERANDA };
  const deckW = deck.x1 - deck.x0;
  const deckD = deck.z1 - deck.z0;
  const deckZ = (deck.z0 + deck.z1) / 2;

  // Floor platform with a painted rim.
  g.add(box(deckW, 0.24, deckD, m.deck, 0, f - 0.12, deckZ));
  g.add(box(deckW + 0.06, 0.26, 0.05, m.trim, 0, f - 0.13, deck.z1 + 0.03));
  for (const sx of [-1, 1]) g.add(box(0.05, 0.26, deckD, m.trim, sx * (deckW / 2 + 0.03), f - 0.13, deckZ));

  // Underneath: stilts with cross-bracing, or a lattice skirt.
  const under = f - 0.24;
  if (stilts) {
    const across = Math.ceil(deckW / 2.4);
    const along = Math.ceil(deckD / 2.4);
    for (let a = 0; a <= across; a++) {
      for (let b = 0; b <= along; b++) {
        const x = deck.x0 + 0.15 + ((deckW - 0.3) * a) / across;
        const z = deck.z0 + 0.15 + ((deckD - 0.3) * b) / along;
        g.add(rod(new THREE.Vector3(x, -footing, z), new THREE.Vector3(x, under, z), 0.13, m.stilt, 6));
        if (b === along && a < across && under > 1) {
          const next = deck.x0 + 0.15 + ((deckW - 0.3) * (a + 1)) / across;
          const low = Math.max(-footing + 0.3, under - 2);
          g.add(rod(new THREE.Vector3(x, under - 0.1, z), new THREE.Vector3(next, low, z), 0.05, m.stilt, 4));
          g.add(rod(new THREE.Vector3(next, under - 0.1, z), new THREE.Vector3(x, low, z), 0.05, m.stilt, 4));
        }
      }
    }
  } else if (under > 0.1) {
    const front = new THREE.Mesh(new THREE.PlaneGeometry(deckW - 0.1, under), m.skirt);
    front.position.set(0, under / 2, deck.z1 - 0.06);
    g.add(front);
    for (const sx of [-1, 1]) {
      const end = new THREE.Mesh(new THREE.PlaneGeometry(deckD - 0.1, under), m.skirt);
      end.position.set(sx * (deckW / 2 - 0.06), under / 2, deckZ);
      end.rotation.y = Math.PI / 2;
      g.add(end);
      g.add(box(0.14, under, 0.14, m.trim, sx * (deckW / 2 - 0.07), under / 2, deck.z1 - 0.07));
    }
  }

  // Clapboard core with corner boards, a base board, a band at each floor and a frieze under the eaves.
  const levels = Array.from({ length: stories }, (_, k) => f + k * STOREY);
  const top = levels[stories - 1];
  const height = WALL + (stories - 1) * STOREY;
  g.add(box(w, height, d, wall, 0, f + height / 2, -d / 2));
  for (const sx of [-1, 1]) for (const z of [0, -d]) g.add(box(0.17, height, 0.17, m.trim, (sx * w) / 2, f + height / 2, z));
  g.add(box(w + 0.06, 0.22, d + 0.06, m.trim, 0, f + 0.11, -d / 2), box(w + 0.06, 0.26, d + 0.06, m.trim, 0, top + EAVE - 0.13, -d / 2));
  for (const level of levels.slice(1)) g.add(box(w + 0.06, 0.2, d + 0.06, m.trim, 0, level, -d / 2));

  // On every floor: French doors in the middle of the front, shuttered windows either side and down
  // both sides, an AC unit on one side; a lamp by the front door.
  const perSide = Math.max(1, Math.floor((w / 2 - 1) / 2.6));
  const sideCount = Math.max(1, Math.floor((d - 1.6) / 2.8));
  for (const level of levels) {
    const door = frenchDoor(m);
    door.position.set(0, level, 0);
    g.add(door);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < perSide; i++) {
        const win = windowUnit(m, 1.1, 1.3, shutter, shutters);
        win.position.set(sx * (1.05 + 2.6 * (i + 0.5)), level + 1.55, 0);
        g.add(win);
      }
      for (let i = 0; i < sideCount; i++) {
        const win = windowUnit(m, 1.1, 1.3, shutter, shutters);
        win.position.set((sx * w) / 2, level + 1.55, -d / 2 + (i - (sideCount - 1) / 2) * 2.8);
        win.rotation.y = (sx * Math.PI) / 2;
        g.add(win);
      }
    }
    g.add(box(0.32, 0.55, 0.85, m.ac, w / 2 + 0.18, level + 2.05, -d + 1.1));
  }
  g.add(box(0.14, 0.24, 0.12, m.lamp, 1.1, f + 2.0, 0.08));

  // Balconies over the veranda on the upper floors, their undersides ceiling the floor below.
  for (const level of levels.slice(1)) {
    g.add(box(deckW, 0.22, VERANDA, m.deck, 0, level - 0.11, VERANDA / 2), box(deckW, 0.02, VERANDA, m.soffit, 0, level - 0.23, VERANDA / 2));
    if (wrap) {
      for (const sx of [-1, 1]) {
        const x = sx * (w / 2 + side / 2);
        g.add(box(side, 0.22, d, m.deck, x, level - 0.11, -d / 2), box(side, 0.02, d, m.soffit, x, level - 0.23, -d / 2));
      }
    }
  }

  // Veranda posts along the front (and down the sides when it wraps round), running up through every
  // floor, with beams, brackets, a fretwork valance in every bay and a railing on every floor; the
  // front bay in the middle stays open for the steps.
  const postTop = top + EAVE - 0.24;
  const beams = [...levels.slice(1).map((level) => level - 0.12), postTop + 0.12];
  const inset = 0.12;
  const corner = (x: number, z: number) => new THREE.Vector3(x, 0, z);
  const frontLeft = corner(deck.x0 + inset, deck.z1 - inset);
  const frontRight = corner(deck.x1 - inset, deck.z1 - inset);
  const lines: { a: THREE.Vector3; b: THREE.Vector3; front: boolean }[] = [{ a: frontLeft, b: frontRight, front: true }];
  if (wrap) {
    lines.push({ a: corner(deck.x0 + inset, deck.z0 + inset), b: frontLeft, front: false });
    lines.push({ a: corner(deck.x1 - inset, deck.z0 + inset), b: frontRight, front: false });
  }
  for (const { a, b, front } of lines) {
    const length = a.distanceTo(b);
    const bays = Math.max(1, Math.ceil(length / 2.5));
    const bay = length / bays;
    const line = new THREE.Group();
    for (let k = 0; k <= bays; k++) {
      const x = k * bay;
      if (front || k < bays) line.add(box(0.15, postTop - f, 0.15, m.trim, x, (f + postTop) / 2, 0));
    }
    for (const beam of beams) {
      const under = beam - 0.12;
      line.add(box(length + 0.16, 0.24, 0.16, m.trim, length / 2, beam, 0));
      for (let k = 0; k <= bays; k++) {
        for (const dir of [-1, 1]) {
          if ((k === 0 && dir < 0) || (k === bays && dir > 0)) continue;
          line.add(rod(new THREE.Vector3(k * bay, under - 0.5, 0), new THREE.Vector3(k * bay + dir * 0.42, under, 0), 0.03, m.trim, 4));
        }
      }
      for (let k = 0; k < bays; k++) {
        const valance = new THREE.Mesh(new THREE.PlaneGeometry(bay - 0.16, 0.26), m.fretwork);
        valance.position.set((k + 0.5) * bay, under - 0.13, 0.02);
        line.add(valance);
      }
    }
    levels.forEach((level, floor) => {
      for (let k = 0; k < bays; k++) {
        const mid = a.x + ((b.x - a.x) * (k + 0.5)) / bays;
        if (floor === 0 && front && steps && Math.abs(mid) < bay / 2) continue;
        line.add(lattice(m, k * bay + 0.08, (k + 1) * bay - 0.08, 0, level, 0.9, m.rail));
      }
    });
    g.add(onLine(line, a, b));
  }

  // Steps up to the veranda: solid treads for a low floor, an open stair with stringers for a high one.
  if (steps) {
    const count = Math.max(2, Math.round(f / 0.19));
    const rise = f / count;
    for (let i = 0; i < count; i++) {
      const z = deck.z1 + (count - 1 - i) * 0.28 + 0.14;
      const y = rise * (i + 1);
      g.add(f < 1.3 ? box(1.7, y, 0.28, m.deck, 0, y / 2, z) : box(1.4, 0.06, 0.28, m.deck, 0, y - 0.03, z));
    }
    if (f >= 1.3) {
      for (const sx of [-1, 1]) g.add(rod(new THREE.Vector3(sx * 0.72, 0, deck.z1 + count * 0.28), new THREE.Vector3(sx * 0.72, f, deck.z1), 0.06, m.trim, 4));
    }
  }

  // Life on the veranda and balconies: pairs of chairs (someone in one when there are guests), a
  // hammock, a potted palm by the steps, somebody leaning on the balcony rail.
  const chair = (x: number, y: number, seated: boolean) => {
    const c = new THREE.Group();
    c.add(box(0.58, 0.07, 0.52, m.rail, 0, 0.42, 0), box(0.58, 0.62, 0.06, m.rail, 0, 0.74, -0.26));
    c.children[1].rotation.x = -0.25;
    for (const lx of [-0.25, 0.25]) for (const lz of [-0.22, 0.22]) c.add(box(0.05, 0.42, 0.05, m.rail, lx, 0.21, lz));
    if (seated) c.add(person(rand, chairPose()));
    c.position.set(x, y, 1.2);
    c.rotation.y = (rand() - 0.5) * 0.5;
    g.add(c);
  };
  chair(-w / 2 + 1.1, f, guests >= 1);
  chair(-w / 2 + 2.0, f, false);
  for (const level of levels.slice(1)) {
    chair(w / 2 - 2.0, level, guests >= 3 && level === top);
    chair(w / 2 - 1.1, level, false);
  }
  if (guests >= 2) {
    const someone = person(rand, stories > 1 ? leanPose() : standPose(0.5));
    someone.position.set(-w / 2 + 3.2, stories > 1 ? top : f, stories > 1 ? VERANDA - 0.5 : 1.0);
    g.add(someone);
  }
  if (w >= 9) {
    const sling = hammock(m.fabric[Math.floor(rand() * m.fabric.length)], 2.8);
    // Hung high enough that its belly clears the railing.
    sling.position.set(w / 2 - 3.4, f + 2.05, 1.35);
    g.add(sling);
  }
  if (steps) {
    const palm = pottedPalm(m, rand);
    palm.position.set(1.4, f, VERANDA - 0.45);
    g.add(palm);
  }

  if (tank) {
    const x = w / 2 + side + 1.2;
    const z = -d + 0.9;
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) g.add(rod(new THREE.Vector3(x + dx, -0.5, z + dz), new THREE.Vector3(x + dx, 1.3, z + dz), 0.06, m.stilt, 5));
    g.add(box(1.3, 0.1, 1.3, m.deck, x, 1.35, z));
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 14), m.tank);
    drum.position.set(x, 2.0, z);
    g.add(drum);
  }

  // The roof, its boxed eaves (the soffit doubles as the top veranda ceiling), fascia boards and ridge caps.
  const outer: Rect = { x0: deck.x0 - 0.5, x1: deck.x1 + 0.5, z0: deck.z0 - 0.5, z1: deck.z1 + 0.5 };
  const eave = top + EAVE;
  const tin = bellCastRoof(outer, eave, 0.3, 0.62);
  g.add(new THREE.Mesh(tin.geometry, roof));
  for (const [a, b] of tin.caps) g.add(rod(a.clone().setY(a.y + 0.04), b.clone().setY(b.y + 0.04), 0.06, roof, 5));
  const outerW = outer.x1 - outer.x0;
  const outerD = outer.z1 - outer.z0;
  const outerZ = (outer.z0 + outer.z1) / 2;
  const soffit = new THREE.Mesh(new THREE.PlaneGeometry(outerW, outerD), m.soffit);
  soffit.rotation.x = Math.PI / 2;
  soffit.position.set(0, eave - 0.02, outerZ);
  g.add(soffit);
  g.add(box(outerW + 0.05, 0.24, 0.05, m.trim, 0, eave - 0.09, outer.z1), box(outerW + 0.05, 0.24, 0.05, m.trim, 0, eave - 0.09, outer.z0));
  g.add(box(0.05, 0.24, outerD, m.trim, outer.x0, eave - 0.09, outerZ), box(0.05, 0.24, outerD, m.trim, outer.x1, eave - 0.09, outerZ));
  return g;
}

/** Square market umbrella over a table, flanked by two loungers; `guests` of them taken. */
export function sunSpot(m: WaterfrontMaterials, rand: () => number, guests = 0) {
  const g = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.65, 4, 1, true), m.canvas);
  shade.rotation.y = Math.PI / 4;
  shade.position.y = 2.75;
  g.add(shade, rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3.05, 0), 0.04, m.frame, 6));
  g.add(box(0.9, 0.06, 0.9, m.deck, 0, 0.75, 0), box(0.08, 0.75, 0.08, m.frame, 0, 0.37, 0));
  for (const side of [-1, 1]) {
    const lounger = new THREE.Group();
    lounger.add(box(0.75, 0.12, 2, m.frame, 0, 0.3, 0), box(0.7, 0.1, 1.95, m.cushion, 0, 0.41, 0));
    const back = box(0.7, 0.1, 0.8, m.cushion, 0, 0.62, -0.75);
    back.rotation.x = 0.7;
    lounger.add(back);
    if (guests-- > 0) lounger.add(person(rand, loungePose()));
    lounger.position.set(side * 2.1, 0, 1.6);
    lounger.rotation.y = (rand() - 0.5) * 0.4;
    g.add(lounger);
  }
  return g;
}
