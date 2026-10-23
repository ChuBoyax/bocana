"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { NavigationProvider } from "./navigation";

export function Providers({ children }: { children: ReactNode }) {
  // Native wheel scrolling for people who prefer reduced motion.
  const reduceMotion = useReducedMotion();

  return (
    <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: !reduceMotion }}>
      <MotionConfig reducedMotion="user">
        <NavigationProvider>{children}</NavigationProvider>
      </MotionConfig>
    </ReactLenis>
  );
}
