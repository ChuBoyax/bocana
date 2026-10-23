/*
 * Everything the film is made of, as data: the time of day along it, the camera's shots, the
 * mountain ranges, and where the boats, taxis, surf break and cay are. Edit here to re-cut the film;
 * the scene code reads it.
 */

type Vec3 = [number, number, number];

/* ── Time of day ──────────────────────────────────────────────────────── */

export type Light = {
  t: number;
  elevation: number;
  azimuth: number;
  exposure: number;
  turbidity: number;
  rayleigh: number;
  clouds: number;
  sun: string;
  sky: string;
  ground: string;
  water: string;
  fog: string;
  sunIntensity: number;
  windows: number;
};

// The sun starts ahead of the camera at dawn and stays low and golden; as the camera turns toward the
// bungalows it swings round behind, so the last shot is a bright afternoon with the houses lit full on.
export const DAY: Light[] = [
  { t: 0, elevation: 0.8, azimuth: 172, exposure: 0.34, turbidity: 6, rayleigh: 3.2, clouds: 0.45, sun: "#ffb38a", sky: "#8a7fa8", ground: "#2a2a35", water: "#0b3a44", fog: "#b8a2a8", sunIntensity: 1.2, windows: 0.4 },
  { t: 0.18, elevation: 7, azimuth: 178, exposure: 0.36, turbidity: 3, rayleigh: 1.8, clouds: 0.4, sun: "#ffe2c2", sky: "#9ec7e0", ground: "#2f4a44", water: "#0f6468", fog: "#c3d7e2", sunIntensity: 2.4, windows: 0 },
  { t: 0.36, elevation: 16, azimuth: 186, exposure: 0.3, turbidity: 2, rayleigh: 1.2, clouds: 0.35, sun: "#fff6e8", sky: "#a9d3ee", ground: "#335a52", water: "#14807d", fog: "#bfd8e6", sunIntensity: 3, windows: 0 },
  { t: 0.54, elevation: 9, azimuth: 205, exposure: 0.35, turbidity: 4, rayleigh: 2, clouds: 0.42, sun: "#ffc890", sky: "#a8b8cc", ground: "#3a4a3c", water: "#0f6466", fog: "#dccbb6", sunIntensity: 2.4, windows: 0.1 },
  { t: 0.72, elevation: 11, azimuth: 195, exposure: 0.38, turbidity: 3.5, rayleigh: 1.8, clouds: 0.4, sun: "#ffd2a0", sky: "#a9c6de", ground: "#3c5444", water: "#107070", fog: "#dcd6c8", sunIntensity: 2.7, windows: 0.1 },
  { t: 0.9, elevation: 16, azimuth: 128, exposure: 0.37, turbidity: 2.6, rayleigh: 1.4, clouds: 0.36, sun: "#ffe0b8", sky: "#a9d3ee", ground: "#41604a", water: "#138480", fog: "#cfdde4", sunIntensity: 4.2, windows: 0.15 },
  { t: 1, elevation: 15, azimuth: 122, exposure: 0.37, turbidity: 2.6, rayleigh: 1.4, clouds: 0.36, sun: "#ffdcb0", sky: "#a9d3ee", ground: "#41604a", water: "#138480", fog: "#cfdde4", sunIntensity: 4.2, windows: 0.2 },
];

/* ── Camera: out at sea, past the boats, then a turn to reveal the bungalows ── */

/** Where the waterfront sits: off to the left, out of shot until the camera turns in the last chapters. */
export const SITE = { x: -520, z: -240 };

export const SHOTS: { t: number; pos: Vec3; look: Vec3 }[] = [
  { t: 0, pos: [-18, 10, 300], look: [0, 40, -2000] },
  { t: 0.18, pos: [8, 8, 190], look: [0, 24, -1500] },
  { t: 0.36, pos: [-6, 7, 80], look: [-60, 16, -1100] },
  { t: 0.54, pos: [-70, 6.5, -40], look: [-420, 12, -700] },
  { t: 0.72, pos: [-250, 6, -170], look: [-560, 9, -320] },
  { t: 0.9, pos: [-400, 5.2, -229], look: [SITE.x - 5, 8, SITE.z - 4] },
  { t: 1, pos: [-424, 4.8, -235], look: [SITE.x, 8.5, SITE.z] },
];

/* ── Landscape ────────────────────────────────────────────────────────── */

export type Range = {
  z: number;
  depth: number;
  height: number;
  seed: number;
  /** 0…1: how much of the range's length is open water between massifs (or islands). */
  spread: number;
  /** How much of the scene's distance haze this range takes: below 1 so its relief still reads far away. */
  haze: number;
  /** 0…1: rounded, forested hills (0) to sharp ridges and peaks (1). */
  rugged: number;
  /** Close enough to need a finer mesh. */
  near?: boolean;
  /** Placed and turned in the world (ranges run along x before this). */
  position?: Vec3;
  turn?: number;
};

// Layer on layer, each paler with distance: the mainland's high mountains, a nearer range, jungle
// islands in front; and more mountains to the west behind the waterfront.
export const RANGES: Range[] = [
  { z: -3300, depth: 900, height: 440, seed: 3, spread: 0.12, haze: 0.85, rugged: 0.65 },
  { z: -2300, depth: 700, height: 240, seed: 7, spread: 0.3, haze: 0.7, rugged: 0.45 },
  { z: -1350, depth: 420, height: 110, seed: 11, spread: 0.4, haze: 0.55, rugged: 0.25, near: true },
  { z: 0, depth: 700, height: 320, seed: 23, spread: 0.25, haze: 0.7, rugged: 0.55, position: [-3000, 0, 0], turn: Math.PI / 2 },
];

/* ── Life on the water ────────────────────────────────────────────────── */

/**
 * Sailboats at anchor, kept clear of the camera path; the first ones are close to it so their crews are
 * seen up close, the last sits off the waterfront for the final shot. Phones get the first four and the last.
 */
export const MOORINGS: [number, number][] = [
  [20, 140],
  [-55, 235],
  [42, 170],
  [-62, 128],
  [80, -20],
  [-120, 140],
  [-135, -10],
  [25, -60],
  [-210, -70],
  [-465, -300],
];

/** A water taxi's run: back and forth along one axis, turning round before the island. */
export type Lane = { axis: "x" | "z"; fixed: number; start: number; dir: number; speed: number; min: number; max: number };

// One crossing the bay, two along the front of the waterfront between the deck and the surf (seen in
// the final shot). Phones get the first two.
export const LANES: Lane[] = [
  { axis: "x", fixed: -120, start: 150, dir: -1, speed: 9, min: -470, max: 250 },
  { axis: "z", fixed: -490, start: -330, dir: 1, speed: 6, min: -520, max: 40 },
  { axis: "z", fixed: -494, start: -60, dir: 1, speed: 6, min: -520, max: 40 },
];

/** The surf break on the reef in front of the bungalows, turned so the wave faces look at the camera at the end. */
export const SURF = { position: [-410, 0, -239] as Vec3, turn: Math.atan2(-0.34, -0.94) };

/** A little palm cay, passed on the way out at sea. */
export const CAY: Vec3 = [-32, 0, 112];

/** Beyond this many metres the surfers and the people about the waterfront are too small to see: skip them. */
export const LIFE_DISTANCE = 450;
