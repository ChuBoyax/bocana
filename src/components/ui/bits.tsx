"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";

export function SectionLabel({ index, children, className }: { index: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] uppercase", className)}>
      <span className="font-display text-base tracking-normal text-lagoon normal-case italic">({index})</span>
      <span className="h-px w-8 bg-current opacity-30" />
      {children}
    </p>
  );
}

/** Fades and lifts its children in once they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up from zero the first time it's seen. */
export function CountUp({ to, pad = 2, className }: { to: number; pad?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => Math.round(v).toString().padStart(pad, "0"));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration: 1.8, ease: EASE_OUT_EXPO });
    return () => controls.stop();
  }, [inView, to, value]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}

export function ArrowIcon({ className, direction = "right" }: { className?: string; direction?: "right" | "down" | "up" | "left" }) {
  const rotate = { right: 0, down: 90, left: 180, up: -90 }[direction];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ rotate: `${rotate}deg` }}
      aria-hidden
    >
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

/** A sun rising behind a bungalow on stilts, with the water lapping below. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="11" r="7.5" className="fill-lagoon" />
      <path d="M4.5 18.5 16 9.5l11.5 9Z" fill="currentColor" />
      <rect x="8" y="18.5" width="16" height="3.2" rx="0.8" fill="currentColor" />
      <path d="M11 21.7v4M16 21.7v4M21 21.7v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M2.5 26c2 0 3-1.4 4.9-1.4s2.9 1.4 4.9 1.4 3-1.4 4.9-1.4 2.9 1.4 4.9 1.4 3-1.4 4.9-1.4 2.9 1.4 3.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M5 29.6c1.7 0 2.6-1.1 4.2-1.1s2.5 1.1 4.2 1.1 2.6-1.1 4.2-1.1 2.5 1.1 4.2 1.1 2.6-1.1 4.2-1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
