"use client";

import { motion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/cn";

type SplitCharsProps = {
  text: string;
  show: boolean;
  delay?: number;
  stagger?: number;
};

/** Letters rise into place one by one. Wrap in an overflow-hidden line for the mask. */
export function SplitChars({ text, show, delay = 0, stagger = 0.045 }: SplitCharsProps) {
  return (
    <motion.span
      aria-hidden
      className="inline-block"
      initial="hidden"
      animate={show ? "show" : "hidden"}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {Array.from(text).map((char, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-transform"
          variants={{
            hidden: { y: "118%", rotate: 9 },
            show: { y: "0%", rotate: 0, transition: { duration: 1.3, ease: EASE_OUT_EXPO } },
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
