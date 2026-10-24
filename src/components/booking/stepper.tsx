"use client";

import { motion, useSpring } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

const WIDTH = 960;
const HALF_WAVE = 80; // Nodes sit where the wave crosses its baseline (every 80 units).
const BASELINE = 20;
/** While a step is being filled in the line runs this far toward the next one; it arrives on Continue. */
const LEG = 0.8;

/** A gentle line wave from 0 to WIDTH. */
const wave = (() => {
  let d = `M0 ${BASELINE} Q${HALF_WAVE / 2} ${BASELINE - 9} ${HALF_WAVE} ${BASELINE}`;
  for (let x = HALF_WAVE; x < WIDTH; x += HALF_WAVE) d += ` T${x + HALF_WAVE} ${BASELINE}`;
  return d;
})();

/**
 * Booking progress as a wavy line that fills in toward the next step as the current one is completed.
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
  // A heavy, slightly loose spring so the line glides and settles.
  const position = useSpring(target, { stiffness: 26, damping: 11, mass: 1.6, restDelta: 0.0002 });
  useEffect(() => position.set(target), [position, target]);

  return (
    <nav aria-label="Booking steps" className="relative mx-auto w-full max-w-4xl px-9 sm:px-6">
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${BASELINE * 2}`} preserveAspectRatio="none" className="block h-10 w-full overflow-visible" aria-hidden>
          <path d={wave} fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <motion.path d={wave} fill="none" className="stroke-lagoon-soft" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: position }} />
        </svg>

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
                      "relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-700",
                      done && "bg-lagoon-soft text-jungle-deep group-hover:scale-110",
                      active && "bg-sand text-jungle-deep shadow-[0_0_0_5px_rgba(143,217,207,0.25)]",
                      !done && !active && (reachable ? "bg-jungle-soft text-sand" : "bg-jungle-deep text-sand/80 ring-1 ring-sand/50"),
                    )}
                  >
                    {done ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "absolute top-10 text-[11px] font-bold tracking-[0.2em] whitespace-nowrap uppercase transition-colors md:text-xs",
                      active ? "text-white" : "text-sand/80",
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
