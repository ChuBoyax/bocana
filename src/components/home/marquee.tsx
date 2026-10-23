"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/**
 * Two crossing ribbons. They drift on their own, speed up with scroll
 * velocity, flip direction with it, and lean into fast scrolls.
 */
export function Marquee() {
  return (
    <div
      aria-hidden
      className="relative h-[clamp(150px,20vw,300px)] overflow-x-clip bg-[linear-gradient(to_bottom,var(--color-jungle)_50%,var(--color-sand)_50%)]"
    >
      <Ribbon
        items={["Experience paradise", "Barefoot days", "Boat docks", "Golden sunsets"]}
        baseVelocity={2.2}
        className="rotate-[3deg] bg-jungle-deep text-sand"
        outline
      />
      <Ribbon
        items={["Isla Colón", "Bastimentos", "Carenero", "Playa Estrella", "Red Frog", "Zapatilla"]}
        baseVelocity={-3}
        className="-rotate-[3deg] bg-lagoon text-sand-soft"
      />
    </div>
  );
}

function Ribbon({
  items,
  baseVelocity,
  className,
  outline,
}: {
  items: string[];
  baseVelocity: number;
  className?: string;
  outline?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(velocity, [-2500, 2500], [12, -12]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduceMotion) return;
    let move = direction.current * baseVelocity * (delta / 1000);
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    move += direction.current * move * b;
    baseX.set(baseX.get() + move);
  });

  return (
    <div className={cn("absolute top-1/2 left-[-5%] w-[110%] -translate-y-1/2 py-[clamp(10px,1.4vw,22px)]", className)}>
      <motion.div style={{ x, skewX }} className="flex w-max whitespace-nowrap">
        {[0, 1, 2, 3].map((copy) => (
          <span key={copy} className="flex items-center">
            {items.map((item) => (
              <span key={item} className="flex items-center">
                <span
                  className={cn(
                    "font-display px-[0.4em] text-[clamp(2.2rem,6vw,5.5rem)] leading-none tracking-tight",
                    outline ? "text-outline" : "wonk italic",
                  )}
                >
                  {item}
                </span>
                <Star className="h-[clamp(18px,2.4vw,34px)] w-[clamp(18px,2.4vw,34px)] shrink-0 text-lagoon-soft" />
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
    </svg>
  );
}
