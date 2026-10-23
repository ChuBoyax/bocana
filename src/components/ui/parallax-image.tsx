"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/cn";

type ParallaxImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** How far (in %) the image drifts against the scroll. */
  amount?: number;
};

/** An image that moves slower than the page inside its frame, and un-zooms as it enters. */
export function ParallaxImage({ src, alt, sizes, className, amount = 10 }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1.18, 1.04]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y, scale }} className="absolute inset-x-0 -inset-y-[12%]">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </motion.div>
    </div>
  );
}
