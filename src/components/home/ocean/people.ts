import * as THREE from "three";
import { lerp, smooth } from "./utils";

/**
 * A properly proportioned person (about 1.78 m) built from shaped, tapering
 * body parts and posed with two-bone IK, so knees and elbows bend naturally.
 * Poses are described as joint targets in the figure's local space.
 */

export type Look = { skin: string; shorts: string; top?: string; hair: string; long?: boolean };

export type Pose = {
  pelvis: THREE.Vector3;
  /** Pelvis → base of the neck. */
  spine: THREE.Vector3;
  /** Points to the figure's own left. */
  left: THREE.Vector3;
  headLook: THREE.Vector3;
  /** Ankle positions: left, right. */
  feet: [THREE.Vector3, THREE.Vector3];
  toes: [THREE.Vector3, THREE.Vector3];
  kneePole: THREE.Vector3;
  hands: [THREE.Vector3, THREE.Vector3];
  elbowPole: THREE.Vector3;
};

const THIGH = 0.45;
const CALF = 0.44;
const UPPER_ARM = 0.29;
const FOREARM = 0.26;
const TORSO = 0.52;
const UP = new THREE.Vector3(0, 1, 0);
const HAIR_TILT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.4);

/** A rounded, tapering limb along +y from 0 to `length`. */
function limb(r0: number, r1: number, length: number, bulge = 0) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 4; i++) {
    const a = -Math.PI / 2 + (i / 4) * (Math.PI / 2);
    points.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0));
  }
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    points.push(new THREE.Vector2(lerp(r0, r1, t) + Math.sin(Math.PI * t) * bulge, t * length));
  }
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    points.push(new THREE.Vector2(Math.cos(a) * r1, length + Math.sin(a) * r1));
  }
  return new THREE.LatheGeometry(points, 12);
}

/** Torso from hips to shoulders, flattened front to back. */
function torsoGeometry() {
  const profile: [number, number][] = [
    [0, -0.02],
    [0.12, 0],
    [0.155, 0.06],
    [0.14, 0.16],
    [0.135, 0.22],
    [0.158, 0.32],
    [0.172, 0.42],
    [0.17, 0.47],
    [0.12, 0.52],
    [0.055, 0.55],
    [0, 0.56],
  ];
  const geometry = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    16,
  );
  geometry.scale(1.12, 1, 0.66);
  return geometry;
}

// Scratch vectors: figures are re-posed every frame, so posing allocates nothing.
const toTarget = new THREE.Vector3();
const bend = new THREE.Vector3();
const direction = new THREE.Vector3();

/** Two-bone IK: where the middle joint goes so the bones reach `target`, bending toward `pole`. */
function solve(a: THREE.Vector3, target: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3, out: THREE.Vector3) {
  toTarget.subVectors(target, a);
  const d = Math.min(toTarget.length(), l1 + l2 - 0.001);
  const u = toTarget.normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - along * along, 0));
  const w = bend.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
  return out.copy(a).addScaledVector(u, along).addScaledVector(w, h);
}

function place(mesh: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(UP, direction.subVectors(to, from).normalize());
}

const pose = {
  spine: new THREE.Vector3(),
  left: new THREE.Vector3(),
  right: new THREE.Vector3(),
  back: new THREE.Vector3(),
  neck: new THREE.Vector3(),
  head: new THREE.Vector3(),
  joint: new THREE.Vector3(),
  joint2: new THREE.Vector3(),
  toes: new THREE.Vector3(),
  pole: new THREE.Vector3(),
};

/** Materials are shared between figures of the same colouring, so a crowd baked together costs a few draw calls. */
const materials = new Map<string, THREE.Material>();
function material(kind: "skin" | "cloth" | "hair", color: string) {
  const key = `${kind}:${color}`;
  let m = materials.get(key);
  if (!m) {
    m =
      kind === "skin"
        ? new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.35 })
        : new THREE.MeshStandardMaterial({ color, roughness: kind === "hair" ? 0.6 : 0.75 });
    materials.set(key, m);
  }
  return m;
}

export class Figure {
  readonly root = new THREE.Group();
  private readonly parts;
  private readonly basis = new THREE.Matrix4();
  private readonly knee = new THREE.Vector3();
  private readonly elbow = new THREE.Vector3();

  constructor(look: Look) {
    const skin = material("skin", look.skin);
    const shorts = material("cloth", look.shorts);
    const top = look.top ? material("cloth", look.top) : skin;
    const hair = material("hair", look.hair);

    const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
      const m = new THREE.Mesh(geometry, material);
      m.castShadow = true;
      this.root.add(m);
      return m;
    };
    const thigh = limb(0.088, 0.058, THIGH, 0.012);
    const calf = limb(0.058, 0.04, CALF, 0.016);
    const upper = limb(0.048, 0.04, UPPER_ARM, 0.006);
    const fore = limb(0.04, 0.03, FOREARM, 0.004);
    const shortsLeg = limb(0.1, 0.085, 0.24);
    const foot = new THREE.CapsuleGeometry(0.042, 0.17, 4, 8).rotateX(Math.PI / 2);
    const hand = new THREE.SphereGeometry(0.042, 10, 8).scale(0.65, 1.5, 1);
    const head = new THREE.SphereGeometry(0.1, 18, 14).scale(0.9, 1.1, 1);
    const hairCap = new THREE.SphereGeometry(0.106, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.58).scale(0.92, 1.08, 1.04);

    this.parts = {
      torso: mesh(torsoGeometry(), top),
      hips: mesh(limb(0.155, 0.15, 0.14).scale(1.08, 1, 0.72), shorts),
      neck: mesh(limb(0.048, 0.045, 0.09), skin),
      head: mesh(head, skin),
      hair: mesh(hairCap, hair),
      thighs: [mesh(thigh, skin), mesh(thigh, skin)],
      shorts: [mesh(shortsLeg, shorts), mesh(shortsLeg, shorts)],
      calves: [mesh(calf, skin), mesh(calf, skin)],
      feet: [mesh(foot, skin), mesh(foot, skin)],
      uppers: [mesh(upper, top), mesh(upper, top)],
      fores: [mesh(fore, skin), mesh(fore, skin)],
      hands: [mesh(hand, skin), mesh(hand, skin)],
      // Shoulder-length hair falling behind the head.
      mane: look.long ? mesh(new THREE.CapsuleGeometry(0.085, 0.16, 4, 10).scale(1.15, 1, 0.75), hair) : null,
    };
  }

  apply(p: Pose) {
    const { parts } = this;
    const { spine, left, right, back, neck, head, joint, joint2, toes, pole: elbowPole } = pose;
    spine.copy(p.spine).normalize();
    left.copy(p.left).addScaledVector(spine, -p.left.dot(spine)).normalize();
    right.copy(left).negate();
    // Right-handed basis: x = right, y = up the spine, z = right × up (the figure's back).
    this.basis.makeBasis(right, spine, back.crossVectors(right, spine).normalize());

    parts.torso.position.copy(p.pelvis);
    parts.torso.quaternion.setFromRotationMatrix(this.basis);
    parts.hips.position.copy(p.pelvis).addScaledVector(spine, -0.06);
    parts.hips.quaternion.copy(parts.torso.quaternion);

    neck.copy(p.pelvis).addScaledVector(spine, TORSO);
    head.copy(neck).addScaledVector(spine, 0.17).addScaledVector(p.headLook, 0.02);
    place(parts.neck, neck, head);
    parts.head.position.copy(head);
    parts.head.lookAt(joint.copy(head).add(p.headLook));
    // The hair cap is tipped back so it covers the crown and the back of the head, not the face.
    parts.hair.position.copy(head).addScaledVector(p.headLook, -0.012);
    parts.hair.quaternion.copy(parts.head.quaternion).multiply(HAIR_TILT);
    if (parts.mane) {
      joint.copy(head).addScaledVector(p.headLook, -0.05);
      place(parts.mane, joint, joint2.copy(joint).addScaledVector(spine, -1));
      parts.mane.position.addScaledVector(spine, -0.1);
    }

    for (const i of [0, 1] as const) {
      const side = i === 0 ? 1 : -1;
      const hip = joint.copy(p.pelvis).addScaledVector(left, side * 0.092).addScaledVector(spine, -0.04);
      solve(hip, p.feet[i], THIGH, CALF, p.kneePole, this.knee);
      place(parts.thighs[i], hip, this.knee);
      place(parts.shorts[i], joint2.copy(hip).addScaledVector(spine, 0.03), this.knee);
      place(parts.calves[i], this.knee, p.feet[i]);
      toes.copy(p.toes[i]).normalize();
      const foot = parts.feet[i];
      foot.position.copy(p.feet[i]).addScaledVector(toes, 0.07);
      foot.position.y -= 0.035;
      foot.lookAt(joint2.copy(foot.position).add(toes));

      const shoulder = joint.copy(neck).addScaledVector(spine, -0.06).addScaledVector(left, side * 0.19);
      solve(shoulder, p.hands[i], UPPER_ARM, FOREARM, elbowPole.copy(p.elbowPole).addScaledVector(left, side * 0.6), this.elbow);
      place(parts.uppers[i], shoulder, this.elbow);
      place(parts.fores[i], this.elbow, p.hands[i]);
      // The hand carries on in the line of the forearm.
      place(parts.hands[i], p.hands[i], joint2.copy(p.hands[i]).multiplyScalar(2).sub(this.elbow));
    }
  }
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Surf stance on a board pointing +z (deck at y = 0), right foot forward,
 * chest to +x. `crouch` 0…1 compresses through a bottom turn; `swing` -1…1 moves the arms.
 */
export function surfPose(crouch: number, swing: number): Pose {
  const c = smooth(THREE.MathUtils.clamp(crouch, 0, 1));
  const pelvis = v(-0.05 + 0.06 * c, 0.86 - 0.2 * c, -0.02);
  const spine = v(0.32 + 0.3 * c, 1, 0.1);
  const neck = pelvis.clone().addScaledVector(spine.clone().normalize(), TORSO);
  return {
    pelvis,
    spine,
    left: v(0.25, 0, -1),
    headLook: v(0.5, -0.12, 1).normalize(),
    feet: [v(0.02, 0.07, -0.37), v(0.02, 0.07, 0.35)],
    toes: [v(1, 0, 0.12), v(1, 0, 0.5)],
    kneePole: v(1, 0.15, 0.1),
    hands: [neck.clone().add(v(0.12, -0.42 + 0.1 * swing, -0.42 - 0.08 * swing)), neck.clone().add(v(0.28, -0.22 - 0.08 * swing, 0.42 + 0.1 * swing))],
    elbowPole: v(0.2, -1, 0),
  };
}

/** Lying on the board, head toward the nose, arms paddling (`stroke` in radians). */
export function pronePose(stroke: number): Pose {
  const pelvis = v(0, 0.17, -0.38);
  const reach = (phase: number, side: number) =>
    v(side * 0.34, -0.12 + 0.18 * Math.max(0, Math.sin(phase)), 0.35 + 0.42 * Math.cos(phase));
  return {
    pelvis,
    spine: v(0, 0.26, 1),
    left: v(1, 0, 0),
    headLook: v(0, 0.4, 1).normalize(),
    feet: [v(0.12, 0.13, -1.3), v(-0.12, 0.13, -1.3)],
    toes: [v(0, -0.4, -1), v(0, -0.4, -1)],
    kneePole: v(0, 1, 0),
    hands: [reach(stroke, 1), reach(stroke + Math.PI, -1)],
    elbowPole: v(0, 1, -0.3),
  };
}

/** Sitting astride the board, facing the nose, legs in the water. */
export function sitPose(bob: number): Pose {
  return {
    pelvis: v(0, 0.12, -0.05),
    spine: v(0, 1, 0.06 + bob * 0.04),
    left: v(1, 0, 0),
    headLook: v(0, 0, 1),
    feet: [v(0.34, -0.48, 0.22), v(-0.34, -0.48, 0.22)],
    toes: [v(0.2, -0.3, 1), v(-0.2, -0.3, 1)],
    kneePole: v(0, 0.2, 1),
    hands: [v(0.24, 0.1, 0.22), v(-0.24, 0.1, 0.22)],
    elbowPole: v(0, -1, -0.4),
  };
}

/** Standing at ease, weight shifting a little (`sway` -1…1). Faces +z, feet on y = 0. */
export function standPose(sway = 0): Pose {
  return {
    pelvis: v(0.02 * sway, 0.96, 0),
    spine: v(0.03 * sway, 1, 0.02),
    left: v(1, 0, 0),
    headLook: v(0.1 * sway, -0.05, 1).normalize(),
    feet: [v(0.11, 0.07, 0.02), v(-0.11, 0.07, -0.03)],
    toes: [v(0.2, 0, 1), v(-0.2, 0, 1)],
    kneePole: v(0, 0, 1),
    hands: [v(0.24, 0.9, 0.04), v(-0.24, 0.9, 0.02)],
    elbowPole: v(0, -0.2, -1),
  };
}

/** Walking toward +z; one stride cycle per 2π of `phase`, covering about 1.2 m. */
export function walkPose(phase: number): Pose {
  const step = (a: number) => v(0, 0.07 + 0.09 * Math.max(0, Math.cos(a)), 0.3 * Math.sin(a));
  return {
    pelvis: v(0, 0.94 + 0.02 * Math.cos(phase * 2), 0),
    spine: v(0, 1, 0.06),
    left: v(1, 0, 0.04 * Math.sin(phase)),
    headLook: v(0, -0.05, 1).normalize(),
    feet: [step(phase).setX(0.1), step(phase + Math.PI).setX(-0.1)],
    toes: [v(0.1, 0, 1), v(-0.1, 0, 1)],
    kneePole: v(0, 0, 1),
    // Arms swing against the legs.
    hands: [v(0.23, 0.92, -0.2 * Math.sin(phase)), v(-0.23, 0.92, 0.2 * Math.sin(phase))],
    elbowPole: v(0, -0.3, -1),
  };
}

/** Sitting back in a chair whose seat is at y = 0.45, feet on the floor. */
export function chairPose(): Pose {
  return {
    pelvis: v(0, 0.52, -0.08),
    spine: v(0, 1, -0.18),
    left: v(1, 0, 0),
    headLook: v(0, -0.08, 1).normalize(),
    feet: [v(0.13, 0.07, 0.42), v(-0.15, 0.07, 0.46)],
    toes: [v(0.15, 0, 1), v(-0.15, 0, 1)],
    kneePole: v(0, 0.5, 1),
    hands: [v(0.17, 0.62, 0.28), v(-0.17, 0.62, 0.26)],
    elbowPole: v(0, -1, -0.3),
  };
}

/** Stretched out on a sun lounger (cushion at y = 0.46), head up on the backrest toward -z. */
export function loungePose(): Pose {
  return {
    pelvis: v(0, 0.56, 0.05),
    spine: v(0, 0.55, -1),
    left: v(1, 0, 0),
    headLook: v(0, 0.75, 0.66).normalize(),
    feet: [v(0.1, 0.52, 0.9), v(-0.08, 0.52, 0.86)],
    toes: [v(0.1, 1, 0.3), v(-0.1, 1, 0.3)],
    kneePole: v(0, 1, 0),
    hands: [v(0.2, 0.62, -0.05), v(-0.2, 0.62, -0.02)],
    elbowPole: v(0, -0.5, 0.2),
  };
}

/** Leaning on a railing (top at y = 0.9, 0.35 in front), looking out. */
export function leanPose(): Pose {
  return {
    pelvis: v(0, 0.95, -0.12),
    spine: v(0, 1, 0.3),
    left: v(1, 0, 0),
    headLook: v(0, -0.1, 1).normalize(),
    feet: [v(0.12, 0.07, -0.08), v(-0.1, 0.07, -0.18)],
    toes: [v(0.2, 0, 1), v(-0.2, 0, 1)],
    kneePole: v(0, 0, 1),
    hands: [v(0.22, 0.93, 0.3), v(-0.22, 0.93, 0.3)],
    elbowPole: v(0, -0.4, -1),
  };
}

/** Sitting on the ground, legs out in front; or on a deck edge with the legs hanging down (`dangle`). */
export function groundPose(dangle = false): Pose {
  return {
    pelvis: v(0, 0.13, -0.1),
    spine: v(0, 1, dangle ? 0.05 : -0.35),
    left: v(1, 0, 0),
    headLook: v(0, -0.1, 1).normalize(),
    feet: dangle ? [v(0.14, -0.45, 0.32), v(-0.14, -0.5, 0.36)] : [v(0.15, 0.07, 0.62), v(-0.12, 0.07, 0.58)],
    toes: dangle ? [v(0.1, -0.3, 1), v(-0.1, -0.3, 1)] : [v(0.1, 1, 0.4), v(-0.1, 1, 0.4)],
    kneePole: v(0, 1, 0.4),
    hands: dangle ? [v(0.26, 0.08, 0.05), v(-0.26, 0.08, 0.05)] : [v(0.25, 0.06, -0.38), v(-0.25, 0.06, -0.38)],
    elbowPole: v(0, -0.3, -1),
  };
}

/** Treading water: upright, arms sculling just under the surface (`t` in seconds). */
export function swimPose(t: number): Pose {
  const scull = Math.sin(t * 2.4);
  return {
    pelvis: v(0, 0.9, 0),
    spine: v(0, 1, 0.12),
    left: v(1, 0, 0),
    headLook: v(0, 0.05, 1).normalize(),
    feet: [v(0.16, 0.1, 0.1), v(-0.16, 0.2, -0.15)],
    toes: [v(0, -1, 0.3), v(0, -1, 0.3)],
    kneePole: v(0, 0, 1),
    hands: [v(0.42 + 0.06 * scull, 1.18, 0.2 + 0.1 * scull), v(-0.42 - 0.06 * scull, 1.18, 0.2 + 0.1 * scull)],
    elbowPole: v(0, -1, 0),
  };
}

/**
 * Standing on a paddle board, knees soft, both hands on the paddle; `stroke` in radians sweeps the
 * paddle from forward to back. Returns the pose, the top of the shaft and where the blade is.
 */
export function paddlePose(stroke: number) {
  const reach = Math.sin(stroke);
  const top = v(-0.05, 1.42, 0.2 + 0.15 * reach);
  const low = v(0.08, 0.95, 0.25 + 0.35 * reach);
  const pose: Pose = {
    pelvis: v(0, 0.9, -0.02),
    spine: v(0, 1, 0.14 + 0.06 * reach),
    left: v(1, 0, 0),
    headLook: v(0, -0.15, 1).normalize(),
    feet: [v(0.16, 0.07, 0), v(-0.16, 0.07, 0)],
    toes: [v(0.1, 0, 1), v(-0.1, 0, 1)],
    kneePole: v(0, 0, 1),
    hands: [low, top],
    elbowPole: v(0, -0.5, -1),
  };
  const blade = low.clone().add(low.clone().sub(top).normalize().multiplyScalar(1.15));
  return { pose, top, blade };
}

/** Blend two poses (for getting up, lying down). */
export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const t = smooth(THREE.MathUtils.clamp(k, 0, 1));
  const m = (x: THREE.Vector3, y: THREE.Vector3) => x.clone().lerp(y, t);
  return {
    pelvis: m(a.pelvis, b.pelvis),
    spine: m(a.spine, b.spine),
    left: m(a.left, b.left),
    headLook: m(a.headLook, b.headLook),
    feet: [m(a.feet[0], b.feet[0]), m(a.feet[1], b.feet[1])],
    toes: [m(a.toes[0], b.toes[0]), m(a.toes[1], b.toes[1])],
    kneePole: m(a.kneePole, b.kneePole),
    hands: [m(a.hands[0], b.hands[0]), m(a.hands[1], b.hands[1])],
    elbowPole: m(a.elbowPole, b.elbowPole),
  };
}

/** A modern shortboard: pointed nose, squash tail, nose rocker, domed deck. Nose toward +z. */
export function surfboardGeometry(length = 1.85, width = 0.5, thickness = 0.065) {
  const stations = 40;
  const around = 16;
  const ring = around + 1;
  const pos: number[] = [];
  for (let i = 0; i <= stations; i++) {
    const s = i / stations;
    const half = (width / 2) * (s < 0.45 ? lerp(0.6, 1, smooth(s / 0.45)) : Math.pow(Math.cos(((s - 0.45) / 0.55) * (Math.PI / 2)), 0.85));
    const rocker = 0.025 * (1 - s) * (1 - s) + 0.13 * s * s * s;
    const t = thickness * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, s * 1.1)));
    for (let j = 0; j <= around; j++) {
      const a = (j / around) * Math.PI * 2;
      const up = Math.sin(a);
      pos.push(Math.cos(a) * half, rocker + (up > 0 ? up * t * 0.6 : up * t * 0.4), (s - 0.5) * length);
    }
  }
  const center = pos.length / 3;
  pos.push(0, 0.025, -length / 2);
  const index: number[] = [];
  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * ring + j;
      index.push(a, a + 1, a + ring, a + 1, a + ring + 1, a + ring);
    }
  }
  for (let j = 0; j < around; j++) index.push(center, j + 1, j);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}
