"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { EASE_OUT_EXPO, entranceDelay } from "@/lib/cn";
import { formatPrice, type Stay } from "@/lib/stays";
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
  const { listing } = stay;

  const details: { label: string; value: ReactNode }[] = [
    { label: "Guests", value: listing.guests },
    { label: listing.bedrooms === 1 ? "Bedroom" : "Bedrooms", value: listing.bedrooms },
    { label: listing.bathrooms === 1 ? "Bath" : "Baths", value: listing.bathrooms },
    ...(listing.rating !== null ? [{ label: "Rating", value: <Rating value={listing.rating} /> }] : []),
    {
      label: "From",
      value: (
        <>
          {formatPrice(listing)}
          <span className="font-sans text-xs text-sand/60"> / night</span>
        </>
      ),
    },
  ];

  return (
    <section ref={ref} className="relative h-svh min-h-[640px] overflow-hidden bg-jungle-deep text-sand">
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
      {/* Darker at the foot and on the left, where the text sits; the photo stays clear top right. */}
      <div className="absolute inset-0 bg-linear-to-t from-jungle-deep via-jungle-deep/50 to-jungle-deep/25" />
      <div className="absolute inset-0 bg-linear-to-r from-jungle-deep/70 via-jungle-deep/20 to-transparent" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col px-5 pt-28 pb-10 md:px-10 md:pt-32 md:pb-14"
      >
        <div style={entranceDelay(0.1)} className="animate-rise">
          <SiteLink
            href="/#stays"
            className="group inline-flex items-center gap-2 rounded-full border border-sand/20 bg-jungle-deep/30 px-4 py-2 text-[11px] font-semibold tracking-[0.2em] uppercase backdrop-blur-md transition-colors hover:border-sand hover:bg-sand hover:text-jungle"
          >
            <ArrowIcon direction="left" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-x-1" />
            All stays
          </SiteLink>
        </div>

        <div className="mt-auto max-w-4xl">
          <p
            style={entranceDelay(0.2)}
            className="flex animate-rise items-center gap-3 text-[11px] font-semibold tracking-[0.32em] text-sand/80 uppercase"
          >
            <span className="h-px w-8 bg-lagoon-soft" />
            {stay.kind === "Pair" ? "Two bungalows" : stay.kind} · Bocas Town
          </p>

          <h1 className="font-display mt-5 text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.92] tracking-[-0.03em]">
            <span className="sr-only">
              {stay.label}, {stay.name}
            </span>
            <span className="block overflow-hidden pb-[0.1em]">
              <SplitChars text={stay.label} delay={0.25} stagger={0.035} />
            </span>
          </h1>
          <p style={entranceDelay(0.7)} className="font-display wonk mt-2 animate-rise text-[clamp(1.25rem,2.2vw,1.9rem)] text-lagoon-soft italic">
            {stay.name}
          </p>
        </div>

        <div
          style={entranceDelay(0.9)}
          className="mt-10 flex animate-rise flex-col gap-6 border-t border-sand/20 pt-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <dl className="grid grid-cols-3 gap-x-4 gap-y-5 md:flex md:divide-x md:divide-sand/20">
            {details.map((detail) => (
              <div key={detail.label} className="flex flex-col gap-2 md:px-6 md:first:pl-0 lg:px-8">
                <dt className="text-[10px] font-semibold tracking-[0.24em] text-sand/60 uppercase">{detail.label}</dt>
                <dd className="font-display text-2xl leading-none whitespace-nowrap tabular-nums">{detail.value}</dd>
              </div>
            ))}
          </dl>
          <SiteLink
            href="#book"
            className="hidden shrink-0 items-center gap-2 self-start rounded-full lg:self-auto bg-sand px-6 py-3.5 text-sm font-semibold text-jungle transition-colors duration-500 hover:bg-lagoon hover:text-sand-soft md:inline-flex"
          >
            Book this stay
            <ArrowIcon direction="down" className="h-4 w-4" />
          </SiteLink>
        </div>
      </motion.div>
    </section>
  );
}
