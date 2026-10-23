"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

const INTERACTIVE = "a, button, [role=button], input, textarea, select, label";

/**
 * A soft follower for mouse users. Elements with data-cursor="Label"
 * turn it into a labelled lagoon disc.
 */
export function Cursor() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });
  const [label, setLabel] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!finePointer) return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target instanceof Element ? event.target : null;
      setLabel(target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null);
      setHovering(Boolean(target?.closest(INTERACTIVE)));
    };
    const hide = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, [finePointer, x, y]);

  if (!finePointer || reduceMotion) return null;

  const size = label ? 104 : hovering ? 64 : 14;

  return (
    <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[95]" style={{ x: springX, y: springY }}>
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        animate={{
          width: size,
          height: size,
          opacity: visible ? 1 : 0,
          backgroundColor: label ? "#17a39b" : "#fbf7f0",
        }}
        style={{ mixBlendMode: label ? "normal" : "difference" }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              key={label}
              className="text-[11px] font-semibold tracking-[0.2em] text-sand-soft uppercase"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
