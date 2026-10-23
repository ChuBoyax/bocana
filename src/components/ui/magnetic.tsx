"use client";

import { motion, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Pulls its child gently toward the mouse pointer. */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const spring = { stiffness: 220, damping: 16, mass: 0.5 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
