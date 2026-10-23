"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { EASE_OUT_EXPO } from "@/lib/cn";
import { formatPrice, stayFacts, type Stay } from "@/lib/stays";
import { SiteLink } from "../navigation";
import { StayMedia } from "../stay-art";
import { ArrowIcon } from "../ui/bits";
import { SplitChars } from "../ui/split-chars";
import { Rating } from "./booking-panel";

export function StayHero({ stay }: { stay: Stay }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.1, delay, ease: EASE_OUT_EXPO },
  });

  return (
    <section ref={ref} className="relative h-svh min-h-[620px] overflow-hidden bg-jungle-deep text-sand">
      <motion.div style={{ scale: mediaScale, y: mediaY }} className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: EASE_OUT_EXPO }}
        >
          <StayMedia stay={stay} sizes="100vw" preload />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-linear-to-t from-jungle-deep via-jungle-deep/40 to-jungle-deep/30" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-12 md:px-10 md:pb-20"
      >
        <motion.div {...fadeUp(0.1)}>
          <SiteLink
            href="/#stays"
            className="group inline-flex items-center gap-2 rounded-full bg-sand/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md transition-colors hover:bg-sand hover:text-jungle"
          >
            <ArrowIcon direction="left" className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-1" />
            All stays
          </SiteLink>
        </motion.div>

        <motion.p {...fadeUp(0.2)} className="mt-10 text-[11px] font-semibold tracking-[0.32em] text-sand/75 uppercase">
          {stay.kind === "Pair" ? "Two bungalows" : stay.kind} · Bocas Town
        </motion.p>

        <h1 className="font-display mt-4 text-[clamp(3.4rem,11vw,11rem)] leading-[0.86] tracking-[-0.04em]">
          <span className="sr-only">
            {stay.label}, {stay.name}
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <SplitChars text={stay.label} show delay={0.25} stagger={0.035} />
          </span>
        </h1>
        <motion.p {...fadeUp(0.7)} className="font-display wonk mt-3 text-[clamp(1.5rem,3vw,2.5rem)] text-lagoon-soft italic">
          {stay.name}
        </motion.p>

        <motion.div
          {...fadeUp(0.9)}
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-sand/20 pt-6 text-sm text-sand/85"
        >
          <span>{stayFacts(stay.listing)}</span>
          {stay.listing.rating !== null && <Rating value={stay.listing.rating} className="font-semibold" />}
          <span>
            From <span className="font-semibold text-sand">{formatPrice(stay.listing)}</span> / night
          </span>
          <SiteLink
            href="#book"
            className="ml-auto hidden items-center gap-2 rounded-full bg-sand px-6 py-3.5 text-sm font-semibold text-jungle transition-colors duration-500 hover:bg-lagoon hover:text-sand-soft md:inline-flex"
          >
            Book this stay
            <ArrowIcon direction="down" className="h-4 w-4" />
          </SiteLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
