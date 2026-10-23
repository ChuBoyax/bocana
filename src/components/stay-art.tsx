import Image from "next/image";
import type { Stay, Tone } from "@/lib/stays";
import { cn } from "@/lib/cn";
import { wavePath } from "@/lib/wave";

const c = {
  jungle: "#0d3b2e",
  deep: "#072219",
  soft: "#1f5b48",
  lagoon: "#17a39b",
  lagoonSoft: "#8fd9cf",
  sand: "#f4ecdd",
  sandDeep: "#e6d5b5",
  sandSoft: "#fbf7f0",
};

type Scene = {
  sky: string;
  sun: { left: string; top: string; size: string; color: string };
  waves: [string, string, string];
  frond: string;
};

const scenes: Record<Tone, Scene> = {
  dawn: {
    sky: `linear-gradient(180deg, ${c.lagoonSoft} 0%, ${c.sand} 45%, ${c.lagoonSoft} 100%)`,
    sun: { left: "60%", top: "30%", size: "22%", color: c.sandSoft },
    waves: [c.lagoonSoft, c.lagoon, c.jungle],
    frond: c.soft,
  },
  lagoon: {
    sky: `linear-gradient(180deg, ${c.lagoonSoft} 0%, ${c.lagoon} 58%, ${c.jungle} 100%)`,
    sun: { left: "62%", top: "22%", size: "18%", color: c.sand },
    waves: ["rgba(244,236,221,0.35)", c.lagoon, c.jungle],
    frond: c.deep,
  },
  jungle: {
    sky: `linear-gradient(180deg, ${c.soft} 0%, ${c.jungle} 52%, ${c.deep} 100%)`,
    sun: { left: "60%", top: "26%", size: "20%", color: c.lagoonSoft },
    waves: [c.lagoon, c.soft, c.deep],
    frond: c.deep,
  },
  dusk: {
    sky: `linear-gradient(180deg, ${c.jungle} 0%, ${c.lagoon} 60%, ${c.sandDeep} 100%)`,
    sun: { left: "38%", top: "46%", size: "26%", color: c.sand },
    waves: [c.jungle, c.soft, c.deep],
    frond: c.deep,
  },
};

const waveLayers = [
  { path: wavePath({ width: 2400, height: 200, amplitude: 16, wavelength: 600, baseline: 40 }), height: "34%", className: "animate-drift-slow", opacity: 0.55 },
  { path: wavePath({ width: 2400, height: 200, amplitude: 12, wavelength: 400, baseline: 60 }), height: "26%", className: "animate-drift-reverse", opacity: 0.8 },
  { path: wavePath({ width: 2400, height: 200, amplitude: 9, wavelength: 300, baseline: 80 }), height: "18%", className: "animate-drift", opacity: 1 },
];

/** Leaflets laid along a curved stem, computed once. */
const frond = (() => {
  const p0 = [0, 0];
  const ctrl = [320, 10];
  const p1 = [540, 330];
  const at = (t: number, i: 0 | 1) => (1 - t) ** 2 * p0[i] + 2 * (1 - t) * t * ctrl[i] + t ** 2 * p1[i];
  const slope = (t: number, i: 0 | 1) => 2 * (1 - t) * (ctrl[i] - p0[i]) + 2 * t * (p1[i] - ctrl[i]);
  const r = (n: number) => n.toFixed(1);

  let leaves = "";
  for (let k = 1; k <= 18; k++) {
    const t = k / 19;
    const [x, y] = [at(t, 0), at(t, 1)];
    const len = Math.hypot(slope(t, 0), slope(t, 1));
    const [ux, uy] = [slope(t, 0) / len, slope(t, 1) / len];
    const size = 230 * Math.sin(Math.PI * (0.18 + t * 0.78));
    for (const side of [1, -1]) {
      // Sweep leaflets toward the tip, and let the lower side droop a little more.
      const droop = side === 1 ? 0.25 : 0;
      const dx = -uy * side * 0.85 + ux * 0.5;
      const dy = ux * side * 0.85 + uy * 0.5 + droop;
      const [tx, ty] = [x + dx * size, y + dy * size];
      const [mx, my] = [(x + tx) / 2, (y + ty) / 2];
      const w = size * 0.11;
      const [nx, ny] = [-dy * w, dx * w];
      leaves += `M${r(x)} ${r(y)}Q${r(mx + nx)} ${r(my + ny)} ${r(tx)} ${r(ty)}Q${r(mx - nx)} ${r(my - ny)} ${r(x)} ${r(y)}Z`;
    }
  }
  return { leaves, stem: `M0 0Q${ctrl[0]} ${ctrl[1]} ${p1[0]} ${p1[1]}` };
})();

/** A tropical colour scene, used where there's no photo (experiences, 404). */
export function StayArt({ tone, className }: { tone: Tone; className?: string }) {
  const scene = scenes[tone];

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={{ background: scene.sky }} aria-hidden>
      <div
        className="absolute aspect-square animate-bob rounded-full"
        style={{
          left: scene.sun.left,
          top: scene.sun.top,
          width: scene.sun.size,
          background: scene.sun.color,
          boxShadow: `0 0 60px 12px ${scene.sun.color}66, 0 0 160px 60px ${scene.sun.color}26`,
        }}
      />

      <svg
        viewBox="-40 -40 640 520"
        className="absolute -top-[6%] -left-[14%] w-[78%] rotate-[8deg]"
        style={{ color: scene.frond }}
      >
        <path d={frond.leaves} fill="currentColor" opacity="0.92" />
        <path d={frond.stem} stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>

      {waveLayers.map((layer, i) => (
        <svg
          key={i}
          viewBox="0 0 2400 200"
          preserveAspectRatio="none"
          className={cn("absolute bottom-0 left-0 w-[200%]", layer.className)}
          style={{ height: layer.height, opacity: layer.opacity }}
        >
          <path d={layer.path} fill={scene.waves[i]} />
        </svg>
      ))}
    </div>
  );
}

/** The stay's cover photo. */
export function StayMedia({ stay, sizes, preload }: { stay: Stay; sizes: string; preload?: boolean }) {
  return (
    <Image
      src={stay.cover}
      alt={`${stay.label}, ${stay.name}`}
      fill
      sizes={sizes}
      preload={preload}
      className="object-cover"
    />
  );
}
