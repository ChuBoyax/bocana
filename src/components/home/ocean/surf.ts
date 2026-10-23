import * as THREE from "three";
import { Figure, mixPose, pronePose, sitPose, surfPose, surfboardGeometry, type Look } from "./people";
import { clamp01, excludeFromReflections, excludeFromShadows, lerp, smooth } from "./utils";
import type { WaterfrontMaterials } from "./materials";
import { palmGeometries } from "./vegetation";

/*
 * A reef break: waves stand up and peel, the breaking whitewater travelling
 * along the crest while a surfer rides the clean face just ahead of it. Two
 * surfers take turns: paddle in, pop up, carve bottom and top turns throwing
 * spray, kick out over the back, paddle out again. Also the little palm cay
 * passed out at sea.
 */

const CAY_RADIUS = 16;
/**
 * Where the swell comes from (radians in the XZ plane of the spot): the waves roll in from +x and their
 * faces look back toward -x. The scene turns the whole spot so the faces look at the camera.
 */
const FACING = 0;
const OUT = new THREE.Vector3(Math.cos(FACING), 0, Math.sin(FACING));
const ALONG = new THREE.Vector3(-Math.sin(FACING), 0, Math.cos(FACING));

const PERIOD = 24;
const POP_UP = 6;
const KICK_OUT = 19;

/* ── The wave ─────────────────────────────────────────────────────────── */

type WaveState = { r: number; height: number; peel: number; tau: number };

function waveState(tau: number): WaveState {
  return {
    tau,
    // Crest distance from the cay: rolls in from 64 m to 22 m.
    r: 64 - 1.75 * tau,
    // Stands up as it reaches shallow water, then spends itself near the sand.
    height: 2.4 * smooth(clamp01(tau / 5)) * (1 - smooth(clamp01((tau - 20) / 3))),
    // Everything at u < peel has broken.
    peel: tau < POP_UP ? -60 : -30 + 5 * (tau - POP_UP),
  };
}

/** Unbroken (1) or broken (0) at position u along the crest. */
const unbroken = (s: WaveState, u: number) => smooth(clamp01((u - s.peel) / 4 + 0.5));

/**
 * Wave height at (u along the crest, v toward the shore from the crest). The face in front is steep
 * just under the lip and scoops out (concave) toward the trough; the back is long and gentle.
 */
function heightAt(s: WaveState, u: number, v: number) {
  if (s.height <= 0) return 0;
  const ends = smooth(clamp01((40 - Math.abs(u)) / 14));
  const profile = v >= 0 ? 1 - smooth(Math.pow(clamp01(v / 3.2), 0.75)) : Math.exp(-((v / 7) ** 2));
  return s.height * ends * profile * lerp(0.5, 1, unbroken(s, u));
}

const toWave = (s: WaveState, p: THREE.Vector3) => ({ u: p.dot(ALONG), v: s.r - p.dot(OUT) });
const fromWave = (s: WaveState, u: number, v: number, out = new THREE.Vector3()) =>
  out.copy(OUT).multiplyScalar(s.r - v).addScaledVector(ALONG, u);

/** Height and surface normal at a point (in surf-spot space). */
function surfaceAt(s: WaveState, p: THREE.Vector3, normal: THREE.Vector3) {
  const { u, v } = toWave(s, p);
  const e = 0.3;
  const hu = (heightAt(s, u + e, v) - heightAt(s, u - e, v)) / (2 * e);
  const hv = (heightAt(s, u, v + e) - heightAt(s, u, v - e)) / (2 * e);
  const du = ALONG.clone().setY(hu);
  const dv = OUT.clone().negate().setY(hv);
  normal.crossVectors(du, dv).normalize();
  if (normal.y < 0) normal.negate();
  return heightAt(s, u, v);
}

const U_SEGMENTS = 160;
const V_SEGMENTS = 52;
const U_RANGE: [number, number] = [-40, 40];
const V_RANGE: [number, number] = [-18, 8];

/** The wave's shape and colouring in GLSL: the same as `heightAt` above, plus the tumbling whitewater. */
const WAVE_GLSL = /* glsl */ `
uniform float uR;
uniform float uHeight;
uniform float uPeel;
uniform float uTau;
uniform vec3 uWater;
uniform vec3 uGreen;
uniform vec3 uFoam;
varying vec4 vWave;

float sq(float x) { return x * x; }
float smooth01(float x) { x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }
float unbroken(float u) { return smooth01((u - uPeel) / 4.0 + 0.5); }
float strength() { return clamp(uHeight / 1.2, 0.0, 1.0); }
float churn(float u, float v) {
  return sin(u * 1.3 + v * 1.9 + uTau * 3.1) * sin(u * 0.6 - v * 1.4 + uTau * 2.2) + 0.5 * sin(u * 2.9 - v * 2.3 - uTau * 4.3);
}
float waveHeight(float u, float v) {
  float ends = smooth01((40.0 - abs(u)) / 14.0);
  float profile = v >= 0.0 ? 1.0 - smooth01(pow(clamp(v / 3.2, 0.0, 1.0), 0.75)) : exp(-sq(v / 7.0));
  return uHeight * ends * profile * mix(0.5, 1.0, unbroken(u));
}
// The surface itself: the wave, plus lumpy whitewater where it has broken.
float surfaceHeight(float u, float v) {
  float soup = (1.0 - unbroken(u)) * strength() * exp(-sq((v - 1.4) / 2.6));
  return waveHeight(u, v) + soup * (0.18 + 0.16 * churn(u, v));
}
`;

/**
 * The breaking wave, shaped and coloured on the GPU: the mesh is a fixed grid in wave space (u along
 * the crest, v toward the shore) and the vertex shader moves it into place, so nothing is recomputed
 * or uploaded on the CPU each frame.
 */
class Wave {
  readonly mesh: THREE.Mesh;
  private readonly uniforms = {
    uR: { value: 0 },
    uHeight: { value: 0 },
    uPeel: { value: 0 },
    uTau: { value: 0 },
    uWater: { value: new THREE.Color("#0c4a50") },
    uGreen: { value: new THREE.Color("#3cc0a8") },
    uFoam: { value: new THREE.Color("#ffffff") },
  };

  constructor() {
    const geometry = new THREE.BufferGeometry();
    const count = (U_SEGMENTS + 1) * (V_SEGMENTS + 1);
    const position = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    for (let i = 0; i <= U_SEGMENTS; i++) {
      const u = lerp(U_RANGE[0], U_RANGE[1], i / U_SEGMENTS);
      for (let j = 0; j <= V_SEGMENTS; j++) {
        const v = lerp(V_RANGE[0], V_RANGE[1], j / V_SEGMENTS);
        const n = i * (V_SEGMENTS + 1) + j;
        position.set([u, 0, v], n * 3);
        uv.set([u / 6, v / 6], n * 2);
      }
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const index: number[] = [];
    for (let i = 0; i < U_SEGMENTS; i++) {
      for (let j = 0; j < V_SEGMENTS; j++) {
        const a = i * (V_SEGMENTS + 1) + j;
        const b = a + V_SEGMENTS + 1;
        // Wound so the faces point up once placed (u runs along the crest, v toward the shore).
        index.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    geometry.setIndex(index);
    // Where the wave can be once the shader has moved it (the crest rolls in from 64 m to 22 m out).
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(48, 1, 0), 60);

    const material = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.12, metalness: 0.05, normalScale: new THREE.Vector2(0.4, 0.4) });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${WAVE_GLSL}`)
        .replace(
          "#include <beginnormal_vertex>",
          /* glsl */ `
          float waveU = position.x;
          float waveV = position.z;
          float waveY = surfaceHeight(waveU, waveV);
          const float e = 0.25;
          float slopeU = (surfaceHeight(waveU + e, waveV) - surfaceHeight(waveU - e, waveV)) / (2.0 * e);
          float slopeV = (surfaceHeight(waveU, waveV + e) - surfaceHeight(waveU, waveV - e)) / (2.0 * e);
          // Spot space: the swell comes from +x, so v runs toward -x and u along z.
          vec3 objectNormal = normalize(vec3(slopeV, 1.0, -slopeU));

          // Light through the thin crest turns it green; the lip feathers white just ahead of the
          // break, and broken water is foam, thinning into streaks in front and behind.
          float k = unbroken(waveU);
          float c = churn(waveU, waveV);
          float glow = k * exp(-sq((waveV - 0.9) / 1.1)) * strength() * 0.85;
          float spill = k * exp(-sq(waveV / 0.45)) * smooth01(1.0 - (waveU - uPeel) / 8.0) * strength();
          float white = (1.0 - k) * strength() * (
            exp(-sq((waveV - 1.2) / 2.8)) * (0.85 + 0.3 * c) +
            exp(-sq((waveV - 4.0) / 1.6)) * (0.45 + 0.25 * c) +
            exp(-sq((waveV + 2.0) / 2.0)) * 0.35 * (1.0 + c));
          float foam = clamp(spill + white, 0.0, 1.0);
          float edge = smooth01((waveV + 18.0) / 7.0) * smooth01((8.0 - waveV) / 4.0) * smooth01((40.0 - abs(waveU)) / 10.0);
          vWave = vec4(mix(mix(uWater, uGreen, glow), uFoam, foam), edge * clamp(waveY / 0.3 + foam, 0.0, 1.0) * 0.95);`,
        )
        .replace("#include <begin_vertex>", "vec3 transformed = vec3(uR - waveV, waveY + 0.03, waveU);")
        .replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\n#ifdef USE_NORMALMAP\n  vNormalMapUv += vec2(uTau * 0.02, 0.0);\n#endif",
        );
      // Foam is matte and scatters light, so it stays bright even in shade.
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec4 vWave;")
        .replace("#include <color_fragment>", "diffuseColor *= vWave;")
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nfloat foamMask = smoothstep(0.3, 0.8, vWave.r);\nroughnessFactor = mix(roughnessFactor, 0.85, foamMask);",
        )
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vWave.rgb * foamMask * 0.18;");
    };
    material.customProgramCacheKey = () => "surf-wave-gpu";
    this.mesh = new THREE.Mesh(geometry, material);
  }

  setNormals(texture: THREE.Texture) {
    const material = this.mesh.material as THREE.MeshStandardMaterial;
    material.normalMap = texture;
    material.needsUpdate = true;
  }

  update(s: WaveState) {
    this.uniforms.uR.value = s.r;
    this.uniforms.uHeight.value = Math.max(0, s.height);
    this.uniforms.uPeel.value = s.peel;
    this.uniforms.uTau.value = s.tau;
  }
}

/* ── Spray ────────────────────────────────────────────────────────────── */

type SprayLook = { count: number; size: number; life: number; opacity: number };

/** Where droplets come from and how they fly. `spread` scatters the source along a line (e.g. the crest). */
type Emission = { rate: number; at: THREE.Vector3; throwDir: THREE.Vector3; spread: THREE.Vector3; speed: [number, number]; lift: [number, number] };

class Spray {
  readonly points: THREE.Points;
  private readonly velocity: Float32Array;
  private readonly life: Float32Array;
  private readonly look: SprayLook;
  private next = 0;
  private budget = 0;

  constructor(look: SprayLook) {
    this.look = look;
    this.velocity = new Float32Array(look.count * 3);
    this.life = new Float32Array(look.count);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(look.count * 3), 3));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(this.life, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { size: { value: look.size }, opacity: { value: look.opacity } },
      vertexShader: /* glsl */ `
        uniform float size;
        attribute float aLife;
        varying float vLife;
        void main() {
          vLife = aLife;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // Droplets start small and dense, then spread into mist.
          gl_PointSize = size * (0.06 + 0.2 * (1.0 - aLife)) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float opacity;
        varying float vLife;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = exp(-d * d * 3.0) * vLife * vLife * opacity;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(0.96, 0.98, 0.98), a);
        }`,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
  }

  update(dt: number, e: Emission) {
    const { count, life } = this.look;
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const random = (range: [number, number]) => lerp(range[0], range[1], Math.random());
    this.budget += e.rate * dt;
    while (this.budget >= 1) {
      this.budget -= 1;
      const i = this.next;
      this.next = (this.next + 1) % count;
      const k = Math.random() - 0.5;
      pos.setXYZ(i, e.at.x + e.spread.x * k + (Math.random() - 0.5) * 0.5, e.at.y, e.at.z + e.spread.z * k + (Math.random() - 0.5) * 0.5);
      const speed = random(e.speed);
      this.velocity[i * 3] = e.throwDir.x * speed + (Math.random() - 0.5) * 1.6;
      this.velocity[i * 3 + 1] = random(e.lift);
      this.velocity[i * 3 + 2] = e.throwDir.z * speed + (Math.random() - 0.5) * 1.6;
      this.life[i] = 1;
    }
    for (let i = 0; i < count; i++) {
      if (this.life[i] <= 0) continue;
      // Light mist hangs in the air longer than heavy droplets.
      this.velocity[i * 3 + 1] -= 9.8 * dt * this.life[i];
      pos.setXYZ(i, pos.getX(i) + this.velocity[i * 3] * dt, pos.getY(i) + this.velocity[i * 3 + 1] * dt, pos.getZ(i) + this.velocity[i * 3 + 2] * dt);
      this.life[i] = Math.max(0, this.life[i] - dt / life);
    }
    pos.needsUpdate = true;
    this.points.geometry.attributes.aLife.needsUpdate = true;
  }
}

/* ── The cay ──────────────────────────────────────────────────────────── */

/** A little sand cay with a few palms. */
export function createCay(site: WaterfrontMaterials, rand: () => number) {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(CAY_RADIUS * 2.8, CAY_RADIUS * 2.8, 56, 56);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const sand = new THREE.Color("#e6d4a8");
  const wet = new THREE.Color("#a8946a");
  const scrub = new THREE.Color("#6f8a45");
  const c = new THREE.Color();
  const heightAtCay = (x: number, z: number) => {
    const a = Math.atan2(z, x);
    const d = Math.hypot(x, z) / (CAY_RADIUS * (1 + 0.12 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 7)));
    return d < 1 ? 2.4 * Math.pow(1 - d * d, 0.8) - 0.3 : -0.3 - (d - 1) * 3;
  };
  for (let i = 0; i < pos.count; i++) {
    const h = heightAtCay(pos.getX(i), pos.getZ(i));
    pos.setY(i, h);
    if (h < 0.2) c.copy(wet).lerp(sand, Math.max(0, (h + 0.3) / 0.5));
    else c.copy(sand).lerp(scrub, smooth(clamp01((h - 1.2) / 1)));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));

  const palm = palmGeometries(rand);
  const matrices = Array.from({ length: 6 }, () => {
    const a = rand() * Math.PI * 2;
    const r = rand() * CAY_RADIUS * 0.6;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = 0.8 + rand() * 0.3;
    return new THREE.Matrix4().compose(new THREE.Vector3(x, heightAtCay(x, z) - 0.2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * Math.PI * 2, 0)), new THREE.Vector3(s, s, s));
  });
  for (const [g, material] of [
    [palm.trunk, site.bark],
    [palm.fronds!, site.frond],
    [palm.dead!, site.frondDead],
  ] as const) {
    const mesh = new THREE.InstancedMesh(g, material, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    group.add(mesh);
  }
  return group;
}

/* ── Surfers ──────────────────────────────────────────────────────────── */

type Surfer = { group: THREE.Group; figure: Figure; heading: THREE.Vector3 };

function surfer(look: Look, boardColor: string): Surfer {
  const group = new THREE.Group();
  const board = new THREE.Mesh(
    surfboardGeometry(),
    new THREE.MeshPhysicalMaterial({ color: boardColor, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
  );
  const figure = new Figure(look);
  figure.root.position.y = 0.06;
  group.add(board, figure.root);
  return { group, figure, heading: new THREE.Vector3(0, 0, 1) };
}

const surfaceNormal = new THREE.Vector3();
const basis = new THREE.Matrix4();

/** Sit the board on the water at `p`, nose along `forward`, deck following the wave surface. */
function settle(s: Surfer, wave: WaveState, p: THREE.Vector3, forward: THREE.Vector3) {
  p.y = surfaceAt(wave, p, surfaceNormal);
  const f = forward.clone().addScaledVector(surfaceNormal, -forward.dot(surfaceNormal)).normalize();
  const right = new THREE.Vector3().crossVectors(surfaceNormal, f).normalize();
  s.group.position.copy(p);
  s.group.quaternion.setFromRotationMatrix(basis.makeBasis(right, surfaceNormal, f));
}

const START = { u: -27, v: 5 };

/** Where the rider is on the wave face at time `tau`: down the line, swinging between bottom and top turns. */
function ridePosition(tau: number, out: THREE.Vector3) {
  const s = waveState(tau);
  const u = s.peel + 4.5 + 1.2 * Math.sin(0.9 * tau);
  const v = 1.3 + 0.9 * Math.sin(1.7 * (tau - POP_UP) + Math.PI / 2);
  return { pos: fromWave(s, u, v, out), u, v };
}

export function createSurfSpot() {
  const group = new THREE.Group();

  const wave = new Wave();
  group.add(wave.mesh);
  // Droplets thrown off the tail of the board, and mist blowing back off the breaking lip.
  const spray = new Spray({ count: 640, size: 380, life: 1.1, opacity: 0.6 });
  const mist = new Spray({ count: 1200, size: 620, life: 1.6, opacity: 0.3 });
  group.add(spray.points, mist.points);

  const riders = [
    surfer({ skin: "#8d5a3b", shorts: "#e63946", hair: "#1c1612" }, "#f4f2ec"),
    surfer({ skin: "#e3b48c", shorts: "#1d3b5a", top: "#17a39b", hair: "#6b4a2b" }, "#ffd23f"),
  ];
  const waiting = surfer({ skin: "#c58b62", shorts: "#3c8d5a", hair: "#1c1612" }, "#8fd9cf");
  for (const r of [...riders, waiting]) group.add(r.group);

  // Where a ride ends (after the kick-out) and where the next one starts, in surf-spot space.
  const kick = ridePosition(KICK_OUT, new THREE.Vector3());
  const rideEnd = fromWave(waveState(PERIOD), kick.u, -4);
  const rideStart = fromWave(waveState(0), START.u, START.v);
  const paddleBend = OUT.clone().multiplyScalar(72);
  const lineup = OUT.clone().multiplyScalar(58).addScaledVector(ALONG, 10);

  let previous = 0;
  const tail: Emission = { rate: 0, at: new THREE.Vector3(), throwDir: new THREE.Vector3(), spread: new THREE.Vector3(), speed: [1, 4.5], lift: [1.5, 5] };
  const lip: Emission = { rate: 0, at: new THREE.Vector3(), throwDir: OUT, spread: ALONG.clone().multiplyScalar(7), speed: [0.5, 2.5], lift: [0.8, 3] };
  const before = new THREE.Vector3();

  function update(elapsed: number) {
    const dt = Math.min(Math.max(elapsed - previous, 0), 0.05);
    previous = elapsed;
    const cycle = Math.floor(elapsed / PERIOD);
    const tau = elapsed - cycle * PERIOD;
    const s = waveState(tau);
    wave.update(s);
    tail.rate = 0;

    riders.forEach((rider, index) => {
      const active = cycle % 2 === index;
      const p = new THREE.Vector3();
      let forward: THREE.Vector3;

      if (active && tau < POP_UP) {
        // Paddling into the wave.
        fromWave(s, START.u, lerp(START.v, 2.2, smooth(tau / POP_UP)), p);
        forward = OUT.clone().negate().addScaledVector(ALONG, 0.3).normalize();
        rider.figure.apply(pronePose(elapsed * 4.2));
      } else if (active && tau < KICK_OUT) {
        // On their feet: down the line, bottom turn, top turn.
        const { v } = ridePosition(tau, p);
        const popping = clamp01((tau - POP_UP) / 0.7);
        if (popping < 1) p.lerp(fromWave(s, START.u, 2.2), 1 - popping);
        forward = p.clone().sub(ridePosition(tau - 0.08, before).pos).setY(0).normalize();
        const stance = surfPose(clamp01((v - 0.35) / 1.8), Math.sin(1.7 * (tau - POP_UP)));
        rider.figure.apply(popping < 1 ? mixPose(pronePose(elapsed * 4.2), stance, popping) : stance);
        // Spray off the tail, heaviest through the top turn.
        if (popping >= 1) {
          tail.rate = 60 + 460 * smooth(clamp01((0.75 - v) / 0.5));
          tail.at.copy(p).addScaledVector(forward, -0.8);
          const at = toWave(s, tail.at);
          tail.at.y = heightAt(s, at.u, at.v) + 0.1;
          tail.throwDir.copy(OUT).addScaledVector(forward, -0.4).normalize();
        }
      } else if (active) {
        // Kick out over the back of the wave and sit up.
        const k = clamp01((tau - KICK_OUT) / 1.4);
        const wavePos = toWave(s, kick.pos);
        fromWave(s, kick.u, lerp(wavePos.v, -4, smooth(k)), p);
        forward = OUT.clone().addScaledVector(ALONG, 0.5).normalize();
        rider.figure.apply(mixPose(surfPose(0.3, 0), sitPose(0), k));
      } else {
        // The other surfer paddles back out to the line-up for their next wave.
        const k = smooth(clamp01((tau - 1.5) / (PERIOD - 2.5)));
        const a = rideEnd.clone().lerp(paddleBend, k);
        const b = paddleBend.clone().lerp(rideStart, k);
        p.copy(a).lerp(b, k);
        forward = b.sub(a).setY(0);
        if (forward.lengthSq() < 1e-6) forward = OUT.clone().negate();
        forward.normalize();
        rider.figure.apply(tau < 1.5 ? mixPose(sitPose(0), pronePose(elapsed * 3.4), tau / 1.5) : pronePose(elapsed * 3.4));
      }

      rider.heading.lerp(forward, 1 - Math.exp(-dt * 8)).normalize();
      settle(rider, s, p, rider.heading);
    });

    // Someone sitting out the back, waiting for a set.
    settle(waiting, s, lineup.clone(), OUT.clone().negate());
    waiting.figure.apply(sitPose(Math.sin(elapsed * 1.3)));

    spray.update(dt, tail);
    // Where the lip is pitching, the offshore breeze feathers it back over the crest.
    lip.rate = tau > POP_UP - 0.5 ? 320 * clamp01((s.height - 0.6) / 1.2) * smooth(clamp01((40 - Math.abs(s.peel)) / 14)) : 0;
    fromWave(s, s.peel + 1.5, 0.15, lip.at).y = heightAt(s, s.peel + 1.5, 0.15) + 0.15;
    mist.update(dt, lip);
  }

  // Everything here moves: keep it out of the reflection pass and the (on-demand) shadow map.
  excludeFromShadows(excludeFromReflections(group));
  return {
    group,
    update,
    setNormals: (texture: THREE.Texture) => wave.setNormals(texture),
  };
}
