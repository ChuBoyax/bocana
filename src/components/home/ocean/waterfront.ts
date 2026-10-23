import * as THREE from "three";
import { bungalow, lattice, person, sunSpot, VERANDA, type BungalowSpec } from "./architecture";
import { createIslanders } from "./islanders";
import { islandHeight, terrain } from "./island";
import type { WaterfrontMaterials } from "./materials";
import { groundPose, leanPose, standPose, swimPose, type Pose } from "./people";
import { bake, box, prng, rod } from "./utils";
import { crownGeometry, instanced, palmGeometries } from "./vegetation";

/* ── The waterfront ───────────────────────────────────────────────────── */

/**
 * La Bocana's stretch of waterfront, centred on the origin and facing +z:
 * a sundeck on stilts, the bungalows and main house, neighbours either side,
 * palms and rainforest behind.
 */
export async function createWaterfront(
  m: WaterfrontMaterials,
  { shadows, detail }: { shadows: boolean; detail: number },
  /** Awaited between the heavy stages, so the page can breathe while the waterfront is built. */
  pause: () => Promise<void> = async () => {},
) {
  const rand = prng(42);
  const statics = new THREE.Group();
  const deckY = 2.2;

  // Sundeck on stilts.
  statics.add(box(96, 0.35, 13, m.deck, 0, deckY - 0.17, 6));
  statics.add(box(96, 0.5, 0.15, m.stilt, 0, deckY - 0.45, 12.5));
  for (let x = -47; x <= 47; x += 3) for (const z of [12.2, 6.5, 0.8]) statics.add(rod(new THREE.Vector3(x, -2, z), new THREE.Vector3(x, deckY - 0.3, z), 0.16, m.stilt, 6));
  statics.add(lattice(m, -47, -20, 12.4, deckY, 0.9), lattice(m, -14, 47, 12.4, deckY, 0.9));
  for (let i = 0; i < 7; i++) statics.add(box(0.7, 0.06, 0.08, m.frame, -17, deckY - 0.4 - i * 0.35, 12.55));
  for (const x of [-17.35, -16.65]) statics.add(rod(new THREE.Vector3(x, -1.8, 12.55), new THREE.Vector3(x, deckY + 0.9, 12.55), 0.04, m.frame, 5));

  // The bungalows along the deck, with the three-storey main house in the middle and two-storey
  // houses among them; the neighbours either end stand on stilts at the water's edge with verandas all round.
  const { paint, roofs, shutters } = m;
  const row: (Omit<BungalowSpec, "seed"> & { x: number })[] = [
    { x: -60, width: 10, depth: 8, wall: paint.coral, roof: roofs.blue, shutter: shutters.white, wrap: true, stilts: true, floor: 0.5, steps: false, stories: 2, guests: 2 },
    { x: -37, width: 9, depth: 7, wall: paint.aqua, roof: roofs.silver, shutter: shutters.white, shutters: "bahama", tank: true, guests: 1 },
    { x: -19, width: 10, depth: 7.5, wall: paint.yellow, roof: roofs.red, shutter: shutters.green, stories: 2, guests: 2 },
    { x: 0, width: 13, depth: 8.5, wall: paint.turquoise, roof: roofs.silver, shutter: shutters.white, wrap: true, stories: 3, guests: 3 },
    { x: 19, width: 9.5, depth: 7, wall: paint.pink, roof: roofs.green, shutter: shutters.teal, shutters: "bahama", guests: 2 },
    { x: 36, width: 9, depth: 7, wall: paint.sky, roof: roofs.red, shutter: shutters.white, stories: 2, guests: 3 },
    { x: 59, width: 10, depth: 8, wall: paint.lime, roof: roofs.blue, shutter: shutters.navy, wrap: true, stilts: true, floor: 0.5, steps: false, guests: 1 },
  ];
  row.forEach(({ x, ...spec }, i) => {
    const b = bungalow(m, { ...spec, seed: 10 + i });
    b.position.set(x, deckY, 0);
    statics.add(b);
  });

  [
    [-30, 1],
    [-12, 2],
    [8, 0],
    [26, 1],
    [40, 1],
  ].forEach(([x, guests]) => {
    const spot = sunSpot(m, rand, guests);
    spot.position.set(x, deckY, 7.5);
    statics.add(spot);
  });

  // People about the deck: two chatting by the rail, one leaning on it looking out to sea, one sitting
  // on the edge by the swim ladder with two friends in the water below.
  const place = (pose: Pose, x: number, y: number, z: number, turn = 0) => {
    const someone = person(rand, pose);
    someone.position.set(x, y, z);
    someone.rotation.y = turn;
    statics.add(someone);
  };
  place(standPose(0.6), -6.6, deckY, 11.5, Math.PI / 2 + 0.3);
  place(standPose(-0.4), -5.5, deckY, 11.7, -Math.PI / 2 - 0.2);
  place(leanPose(), -36, deckY, 12.05);
  place(groundPose(true), -15.6, deckY, 12.42);
  place(swimPose(0), -17.6, -1.3, 15.6, Math.PI);
  place(swimPose(1.3), -13.8, -1.25, 17.4, Math.PI + 0.8);

  // Paddle boards on a rack and a couple of kayaks, as on the real deck.
  statics.add(box(0.12, 1.6, 0.12, m.stilt, -47.2, deckY + 0.8, 9.8), box(0.12, 1.6, 0.12, m.stilt, -43.8, deckY + 0.8, 9.8));
  for (let i = 0; i < 4; i++) {
    const board = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 2.6, 4, 10), m.boards[i % m.boards.length]);
    // Laid flat on the rack: long along x, thin top to bottom.
    board.rotation.z = Math.PI / 2;
    board.scale.set(0.16, 1, 1);
    board.position.set(-45.5, deckY + 0.35 + i * 0.4, 9.8);
    statics.add(board);
  }
  for (const [x, i] of [
    [42, 2],
    [42, 0],
  ]) {
    const kayak = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 3, 4, 10), m.boards[i]);
    kayak.rotation.z = Math.PI / 2;
    kayak.scale.set(0.5, 1, 1);
    kayak.position.set(x, deckY + 0.2, i === 2 ? 3 : 4.2);
    statics.add(kayak);
  }

  // Lamp posts along the deck edge: they come on at dusk.
  for (let x = -44; x <= 44; x += 16) {
    statics.add(rod(new THREE.Vector3(x, deckY, 11.8), new THREE.Vector3(x, deckY + 2.4, 11.8), 0.05, m.frame, 6));
    statics.add(box(0.32, 0.42, 0.32, m.lamp, x, deckY + 2.55, 11.8));
  }

  await pause();

  // More bungalows along the island's shore either side, on stilts down the slope to the water.
  const footprints: { x: number; z: number; r: number }[] = [];
  const shoreHouses: (Pick<BungalowSpec, "wall" | "roof" | "shutter" | "shutters" | "wrap" | "stories" | "guests"> & { x: number })[] = [
    { x: -92, wall: paint.lavender, roof: roofs.red, shutter: shutters.white, guests: 1 },
    { x: -114, wall: paint.mint, roof: roofs.silver, shutter: shutters.teal, shutters: "bahama", wrap: true, stories: 2, guests: 2 },
    { x: -137, wall: paint.yellow, roof: roofs.green, shutter: shutters.white, stories: 2 },
    { x: 90, wall: paint.turquoise, roof: roofs.red, shutter: shutters.white, stories: 2, guests: 2 },
    { x: 112, wall: paint.pink, roof: roofs.blue, shutter: shutters.navy, wrap: true, guests: 1 },
    { x: 135, wall: paint.coral, roof: roofs.silver, shutter: shutters.teal, shutters: "bahama", stories: 3, guests: 3 },
  ];
  shoreHouses.forEach(({ x, ...spec }, i) => {
    let shore = 40;
    while (shore > -80 && islandHeight(x, shore) < 0.8) shore -= 0.5;
    const width = 8 + rand() * 1.5;
    const depth = 6.5 + rand();
    const front = shore - 3;
    const half = width / 2 + (spec.wrap ? 2 : 0);
    const ground = [-1, 1].flatMap((dx) => [front - depth, front + VERANDA].map((z) => islandHeight(x + dx * half, z)));
    const base = Math.max(...ground);
    const b = bungalow(m, { ...spec, width, depth, stilts: true, floor: 0.6, footing: base - Math.min(...ground) + 0.6, steps: false, seed: 30 + i });
    b.position.set(x, base, front);
    b.rotation.y = (rand() - 0.5) * 0.15;
    statics.add(b);
    footprints.push({ x, z: front - depth / 2, r: Math.max(half * 2, depth + VERANDA) / 2 + 3 });
  });

  await pause();

  const site = new THREE.Group();
  site.add(bake(statics, { shadows }), terrain(m));
  await pause();

  /** Random spots on the island whose ground height passes `accept`. */
  const scatter = (count: number, accept: (h: number, x: number, z: number) => boolean) => {
    const spots: [number, number, number][] = [];
    for (let tries = 0; spots.length < count && tries < count * 20; tries++) {
      const x = -185 + rand() * 370;
      const z = -230 + rand() * 250;
      const h = islandHeight(x, z);
      if (accept(h, x, z)) spots.push([x, h, z]);
    }
    return spots;
  };
  // Keep the houses and the deck in front of them clear.
  const nearHouses = (x: number, z: number) =>
    (Math.abs(x) < 70 && z > -18) || footprints.some((f) => Math.hypot(x - f.x, z - f.z) < f.r);

  // Palms: three shapes, around the houses, along the beaches and up the lower slopes.
  const palmSpots: [number, number, number][] = [
    ...[-46, -27, 13, 46, 30].map((x): [number, number, number] => [x, deckY, 1.5 + rand() * 2]),
    ...scatter(Math.round(10 * detail), (h, x, z) => Math.abs(x) < 68 && z < -11 && z > -26 && h > 1.5),
    ...scatter(Math.round(40 * detail), (h, x, z) => h > 0.6 && h < 9 && !nearHouses(x, z)),
  ];
  const variants = [0, 1, 2].map(() => palmGeometries(rand));
  variants.forEach((variant, vi) => {
    const matrices = palmSpots
      .filter((_, i) => i % 3 === vi)
      .map(([x, y, z]) => {
        const scale = 0.85 + rand() * 0.35;
        return new THREE.Matrix4().compose(new THREE.Vector3(x, y - 0.2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * Math.PI * 2, 0)), new THREE.Vector3(scale, scale, scale));
      });
    site.add(instanced(variant.trunk, m.bark, matrices, shadows), instanced(variant.fronds!, m.frond, matrices, shadows), instanced(variant.dead!, m.frondDead, matrices, shadows));
  });

  await pause();

  // Rainforest covering the hill.
  const crowns = [crownGeometry(rand, 5), crownGeometry(rand, 6.5)];
  const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.45, 1, 6).translate(0, 0.5, 0);
  const crownMatrices: THREE.Matrix4[][] = [[], []];
  const trunkMatrices: THREE.Matrix4[] = [];
  scatter(Math.round(340 * detail), (h, x, z) => h > 3 && !nearHouses(x, z)).forEach(([x, y, z], i) => {
    const height = 7 + rand() * 10;
    const s = 0.85 + rand() * 0.7;
    trunkMatrices.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y - 0.5, z), new THREE.Quaternion(), new THREE.Vector3(s, height, s)));
    crownMatrices[i % 2].push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y - 0.5 + height, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * Math.PI * 2, 0)),
        new THREE.Vector3(s, s * (0.75 + rand() * 0.3), s),
      ),
    );
  });
  site.add(instanced(trunkGeometry, m.trunk, trunkMatrices, shadows));
  crowns.forEach((geometry, i) => site.add(instanced(geometry, m.foliage, crownMatrices[i], shadows)));
  const islanders = createIslanders({ deckY, detail });
  site.add(islanders.group);
  return { site, people: islanders.group, update: islanders.update };
}
