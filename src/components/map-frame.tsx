"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

/** The Google map, unveiled from the centre as it scrolls into view. */
export function MapFrame({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const inset = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const clipPath = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round 32px)`;

  return (
    <motion.div ref={ref} style={{ clipPath }} className={cn("relative overflow-hidden bg-sand-deep", className)}>
      <iframe
        title={`Map showing ${site.name} in ${site.city}`}
        src={site.mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0 [filter:saturate(0.8)_contrast(1.05)]"
      />
      <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full bg-sand/90 px-4 py-2 text-[11px] font-semibold tracking-[0.2em] text-jungle uppercase shadow-lg backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lagoon opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lagoon" />
        </span>
        {site.coordsLabel}
      </div>
    </motion.div>
  );
}
