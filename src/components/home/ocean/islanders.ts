import * as THREE from "three";
import { Figure, paddlePose, surfboardGeometry, walkPose, type Look } from "./people";
import { excludeFromReflections, excludeFromShadows } from "./utils";

/** One full walk cycle (two steps) covers this many metres, so feet don't slide. */
const STRIDE = 1.2;
const UP = new THREE.Vector3(0, 1, 0);

type Mover = { root: THREE.Object3D; curve: THREE.Curve<THREE.Vector3>; length: number; offset: number; speed: number; side: number; animate: (elapsed: number, travelled: number) => void };

const loop = (points: [number, number][], y: number) => new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, y, z)), true);

/**
 * The people who move about the waterfront (in its own space, facing +z): strollers doing laps of the
 * sundeck and someone on a paddle board just off it. Returns them in a group with a per-frame update.
 */
export function createIslanders({ deckY, detail }: { deckY: number; detail: number }) {
  const group = new THREE.Group();
  const movers: Mover[] = [];

  // A lap of the deck: along the front of the bungalows, round between the sun loungers, back along the railing.
  const deckLap = loop(
    [
      [-40, 4.6],
      [-20, 4.5],
      [0, 4.7],
      [20, 4.5],
      [33, 4.8],
      [35.5, 7.6],
      [33, 10.6],
      [20, 10.9],
      [0, 10.7],
      [-20, 10.9],
      [-40, 10.6],
      [-42.8, 7.6],
    ],
    deckY,
  );
  const walker = (look: Look, offset: number, speed: number, side = 0) => {
    const figure = new Figure(look);
    group.add(figure.root);
    movers.push({
      root: figure.root,
      curve: deckLap,
      length: deckLap.getLength(),
      offset,
      speed,
      side,
      animate: (_, travelled) => figure.apply(walkPose((travelled / STRIDE) * Math.PI * 2)),
    });
  };
  // A couple strolling side by side, and someone going the other way round at their own pace.
  walker({ skin: "#e3b48c", shorts: "#2c4a6e", top: "#f4f1e8", hair: "#6b4a2b" }, 0, 1.05, -0.35);
  if (detail >= 1) {
    walker({ skin: "#f1c9a5", shorts: "#e9d8b4", top: "#e63946", hair: "#d9b26a", long: true }, 0.3, 1.05, 0.35);
    walker({ skin: "#8d5a3b", shorts: "#3c8d5a", top: "#ffd23f", hair: "#1c1612" }, 70, -0.9);
  }

  // A paddle boarder cruising up and down just off the deck.
  const sup = new THREE.Group();
  const board = new THREE.Mesh(surfboardGeometry(3.3, 0.78, 0.12), new THREE.MeshPhysicalMaterial({ color: "#f2c230", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }));
  const rider = new Figure({ skin: "#c58b62", shorts: "#17a39b", top: "#f4f1e8", hair: "#1c1612" });
  rider.root.position.y = 0.1;
  const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#2c2c2c", roughness: 0.5 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6).translate(0, 0.5, 0), paddleMaterial);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.02), paddleMaterial);
  sup.add(board, rider.root, shaft, blade);
  group.add(sup);
  const bay = new THREE.EllipseCurve(24, 19, 20, 3.2, 0, Math.PI * 2, false, 0);
  const bayLap = loop(
    bay
      .getSpacedPoints(24)
      .slice(0, -1)
      .map((p): [number, number] => [p.x, p.y]),
    0,
  );
  const top = new THREE.Vector3();
  const tip = new THREE.Vector3();
  movers.push({
    root: sup,
    curve: bayLap,
    length: bayLap.getLength(),
    offset: 10,
    speed: 1.3,
    side: 0,
    animate: (elapsed) => {
      const stroke = paddlePose(elapsed * 2.1);
      rider.apply(stroke.pose);
      top.copy(stroke.top).add(rider.root.position);
      tip.copy(stroke.blade).add(rider.root.position);
      shaft.position.copy(top);
      shaft.quaternion.setFromUnitVectors(UP, tip.clone().sub(top).normalize());
      shaft.scale.y = top.distanceTo(tip);
      blade.position.copy(tip);
      blade.quaternion.copy(shaft.quaternion);
      sup.position.y = Math.sin(elapsed * 1.4) * 0.04;
      sup.rotation.z = Math.sin(elapsed * 1.1) * 0.03;
    },
  });

  // They move every frame: out of the (on-demand) shadow map, and too small to miss in reflections.
  excludeFromShadows(excludeFromReflections(group));

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  function update(elapsed: number) {
    for (const mover of movers) {
      const travelled = elapsed * Math.abs(mover.speed) + mover.offset;
      let u = (travelled / mover.length) % 1;
      if (mover.speed < 0) u = 1 - u;
      mover.curve.getPointAt(u, point);
      mover.curve.getTangentAt(u, tangent);
      if (mover.speed < 0) tangent.negate();
      // Walk on the curve, `side` metres to the right of it.
      mover.root.position.set(point.x - tangent.z * mover.side, mover.root === sup ? mover.root.position.y : point.y, point.z + tangent.x * mover.side);
      mover.root.rotation.y = Math.atan2(tangent.x, tangent.z);
      mover.animate(elapsed, travelled);
    }
  }

  return { group, update };
}
