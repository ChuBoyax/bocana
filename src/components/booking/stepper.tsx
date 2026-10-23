"use client";

import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const WIDTH = 960;
const HALF_WAVE = 80; // Nodes sit where the wave crosses its baseline (every 80 units).
const BASELINE = 20;
/** While a step is being filled in the boat sails this far toward the next one; it arrives on Continue. */
const LEG = 0.8;

/** A gentle line wave from 0 to WIDTH. */
const wave = (() => {
  let d = `M0 ${BASELINE} Q${HALF_WAVE / 2} ${BASELINE - 9} ${HALF_WAVE} ${BASELINE}`;
  for (let x = HALF_WAVE; x < WIDTH; x += HALF_WAVE) d += ` T${x + HALF_WAVE} ${BASELINE}`;
  return d;
})();

/** Height above the baseline (px; up is negative) and slope of the wave at `x` (0…WIDTH). */
function waveAt(x: number) {
  const k = Math.min(Math.floor(x / HALF_WAVE), WIDTH / HALF_WAVE - 1);
  const t = (x - k * HALF_WAVE) / HALF_WAVE;
  const sign = k % 2 === 0 ? -1 : 1;
  return { y: sign * 18 * t * (1 - t), slope: (sign * 18 * (1 - 2 * t)) / HALF_WAVE };
}

/**
 * Booking progress as a sea crossing: a sailboat rides the swell from step to step, edging toward the
 * next one as the current step is filled in, with the wake drawn in behind it.
 */
export function Stepper({
  steps,
  current,
  progress = 0,
  completed,
  finished = false,
  onSelect,
}: {
  steps: string[];
  /** 0-based */
  current: number;
  /** 0…1: how much of the current step is filled in. */
  progress?: number;
  /** Highest step reached; earlier steps can be revisited. */
  completed: number;
  /** Every step done: all nodes ticked, nothing clickable. */
  finished?: boolean;
  onSelect: (index: number) => void;
}) {
  const target = finished ? 1 : (current + Math.min(1, Math.max(0, progress)) * LEG) / (steps.length - 1);
  // A heavy, slightly loose spring: she gathers way, glides, and settles.
  const position = useSpring(target, { stiffness: 26, damping: 11, mass: 1.6, restDelta: 0.0002 });
  useEffect(() => position.set(target), [position, target]);
  const speed = useVelocity(position);

  // The wave is stretched to the row's width, which changes how steep it looks.
  const row = useRef<HTMLDivElement>(null);
  const scale = useMotionValue(1);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => scale.set(entry.contentRect.width / WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, [scale]);

  const left = useTransform(position, (p) => `${p * 100}%`);
  const y = useTransform(position, (p) => waveAt(p * WIDTH).y);
  const pitch = useTransform([position, scale], ([p, s]: number[]) => {
    const degrees = (Math.atan(waveAt(p * WIDTH).slope / s) * 180) / Math.PI;
    return Math.max(-12, Math.min(12, degrees));
  });

  // Turn round when sailing back to an earlier step.
  const [facing, setFacing] = useState(1);
  useMotionValueEvent(speed, "change", (v) => {
    if (v < -0.03) setFacing(-1);
    else if (v > 0.03) setFacing(1);
  });

  return (
    <nav aria-label="Booking steps" className="relative mx-auto w-full max-w-4xl px-9 sm:px-6">
      <div ref={row} className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${BASELINE * 2}`} preserveAspectRatio="none" className="block h-10 w-full overflow-visible" aria-hidden>
          <path d={wave} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <motion.path d={wave} fill="none" className="stroke-lagoon-soft" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: position }} />
        </svg>

        {/* Centred on its point of the route, pitching about the waterline as it rides the swell. */}
        <motion.div aria-hidden className="pointer-events-none absolute top-0.5 z-10 w-16 -translate-x-1/2 -translate-y-full" style={{ left, y }}>
          <motion.div className="origin-bottom" style={{ rotate: pitch }}>
            <motion.div animate={{ scaleX: facing }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}>
              <Sailboat speed={speed} />
            </motion.div>
          </motion.div>
        </motion.div>

        <ol className="absolute inset-x-0 top-0 h-10">
          {steps.map((step, i) => {
            const done = finished || i < current;
            const active = !finished && i === current;
            const reachable = !finished && i <= completed && !active;
            return (
              <li key={step} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / (steps.length - 1)) * 100}%` }}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => onSelect(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn("group flex flex-col items-center", reachable && "cursor-pointer")}
                >
                  <span
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-700",
                      done && "bg-lagoon-soft text-jungle-deep group-hover:scale-110",
                      active && "bg-sand text-jungle-deep shadow-[0_0_0_6px_rgba(143,217,207,0.25)]",
                      !done && !active && (reachable ? "bg-jungle-soft text-sand" : "bg-jungle-deep text-sand/40 ring-1 ring-sand/20"),
                    )}
                  >
                    {done ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "absolute top-12 text-[10px] font-semibold tracking-[0.2em] whitespace-nowrap uppercase transition-colors md:text-[11px]",
                      active ? "text-sand" : "text-sand/45",
                    )}
                  >
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/**
 * A little sloop under full sail, bow to the right: cambered main and jib that breathe in the wind, a
 * flag streaming from the masthead, a white hull with a teal boot stripe, and a bow wave and wake that
 * build with her speed. The hull's waterline sits at the bottom edge.
 */
function Sailboat({ speed }: { speed: MotionValue<number> }) {
  const way = useTransform(speed, (v) => Math.min(1, Math.abs(v) / 0.22));
  const wakeLength = useTransform(way, [0, 1], [0.3, 1]);

  return (
    <svg viewBox="0 0 64 52" className="block h-[52px] w-16 overflow-visible drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)]">
      <defs>
        <linearGradient id="sloop-main" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e4dac8" />
          <stop offset="0.55" stopColor="#fbf7f0" />
          <stop offset="1" stopColor="#f1ebdf" />
        </linearGradient>
        <linearGradient id="sloop-jib" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bfece4" />
          <stop offset="1" stopColor="#7ccabf" />
        </linearGradient>
        <linearGradient id="sloop-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ddd6c9" />
        </linearGradient>
        {/* The patch of sea under her fades out at both ends instead of stopping square. */}
        <linearGradient id="sloop-sea-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.25" stopColor="#fff" />
          <stop offset="0.75" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="sloop-sea">
          <rect width="72" height="8" fill="url(#sloop-sea-fade)" />
        </mask>
      </defs>

      <g className="motion-safe:animate-sway" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Wake streaming back from the stern, longer and brighter the faster she goes. */}
        <motion.g style={{ opacity: way, scaleX: wakeLength, transformBox: "fill-box", transformOrigin: "100% 50%" }}>
          <path d="M11 49.2 C 2 48.6, -8 49.6, -22 51" fill="none" stroke="#f4fbf9" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.75" />
          <path d="M12 50.6 C 4 51.4, -6 52.6, -16 53.8" fill="none" stroke="#bfece4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
        </motion.g>

        {/* Mast, flag, boom. */}
        <rect x="33.3" y="2.6" width="1.3" height="38" rx="0.6" fill="#e2dbcd" />
        <g className="motion-safe:animate-flutter" style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}>
          <path d="M33.4 2.2 L26.2 3.9 L33.4 5.6 Z" fill="#17a39b" />
        </g>
        <rect x="11" y="37.2" width="23.4" height="1.4" rx="0.7" fill="#cbc2b1" />

        {/* Mainsail, bellied aft of the mast, with faint panel seams. */}
        <g className="motion-safe:animate-billow" style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}>
          <path d="M33 5.2 C 25.6 14.2, 17.6 25.8, 12.2 37 L33 37 Z" fill="url(#sloop-main)" />
          <path d="M33 13 L23.8 16.4 M33 21 L19.6 24.2 M33 29 L15.8 31.4" stroke="#8a7d68" strokeOpacity="0.18" strokeWidth="0.5" />
        </g>
        {/* Jib, from the masthead forward to the bow. */}
        <g className="motion-safe:animate-billow" style={{ transformBox: "fill-box", transformOrigin: "0% 50%", animationDelay: "-1.2s" }}>
          <path d="M35.4 7.4 C 41.8 17, 48.8 27.4, 55.2 38.2 L 37.2 37.6 Z" fill="url(#sloop-jib)" />
        </g>

        {/* Hull: raked bow to the right, transom to the left, cabin with portlights. */}
        <rect x="26.6" y="35.6" width="13.6" height="3.4" rx="1.5" fill="#f3eee4" />
        <path d="M4.2 38.9 H 60.4 Q 57.6 44.6 51.6 47.4 H 12.4 Q 6.6 46.4 4.2 38.9 Z" fill="url(#sloop-hull)" />
        <path d="M6.6 43.6 Q 30 44.6 58.2 43" fill="none" stroke="#1f5b48" strokeWidth="1.1" />
        <path d="M4.4 39 H 60.2" stroke="#ffffff" strokeWidth="0.8" />
        {[29.6, 33.4, 37.2].map((cx) => (
          <circle key={cx} cx={cx} cy="37.3" r="0.65" fill="#1f5b48" />
        ))}

        {/* Bow wave, building with speed. */}
        <motion.path d="M51 47.4 Q 56 45.6 60.8 47.8" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" style={{ opacity: way }} />
      </g>

      {/* The water she sits in: a short swell that laps along under the hull. */}
      <svg x="-4" y="46" width="72" height="8" viewBox="0 0 72 8" overflow="hidden">
        <g mask="url(#sloop-sea)">
          <path
            className="motion-safe:animate-lap"
            d="M0 3 q 4 -2.4 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 V8 H0 Z"
            fill="#17a39b"
            fillOpacity="0.35"
          />
          <path className="motion-safe:animate-lap" d="M0 3 q 4 -2.4 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0 t 8 0" fill="none" stroke="#bfece4" strokeOpacity="0.7" strokeWidth="0.8" />
        </g>
      </svg>
    </svg>
  );
}
