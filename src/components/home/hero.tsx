"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { entranceDelay } from "@/lib/cn";
import { site } from "@/lib/site";
import { SearchBar } from "../booking/booking-search";
import { SiteLink } from "../navigation";
import { ArrowIcon } from "../ui/bits";
import { SplitChars } from "../ui/split-chars";
import sundeck from "../../../public/homepage/hmimage.webp";

/** The photo behind it: La Bocana's own sundeck on a bright day. */
const backdrop = {
  // Imported rather than referenced by path, so Next knows its size and makes a tiny blurred copy to show at once.
  src: sundeck,
  alt: "La Bocana's sundeck on the water: tables and umbrellas over the turquoise bay",
};

/**
 * The homepage's first screen: the sundeck and the bay behind the name, a line about the place, and the
 * search. As the page scrolls on, the picture drifts down behind and the words lift away.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    // A screen tall (with the browser bars hidden, the tallest it gets), plus the next section's overlap
    // (`--hero-overlap`), so that section starts just below the fold.
    <section
      ref={ref}
      id="top"
      className="relative h-[calc(100lvh+var(--hero-overlap))] min-h-[calc(640px+var(--hero-overlap))] overflow-hidden bg-jungle-deep text-sand"
    >
      <motion.div style={{ y: backdropY }} className="absolute inset-0">
        {/* The page's largest image, so it's fetched first, its blurred copy showing until it's in; it settles in with a slow zoom. */}
        <Image src={backdrop.src} alt={backdrop.alt} fill preload placeholder="blur" sizes="100vw" className="animate-settle object-cover" />
      </motion.div>
      {/* One even wash of the brand's jungle green over the photo, so the words read anywhere on it. */}
      <div className="absolute inset-0 bg-jungle/70" />

      {/* Centred in the first screen, as it is with the browser bars showing. */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="absolute inset-x-0 top-0 z-10 flex h-svh min-h-[640px] flex-col items-center justify-center px-4 pt-24 pb-6 text-center"
      >

        <p style={entranceDelay(0)} className="mb-5 flex animate-rise items-center gap-3 text-[11px] font-semibold tracking-[0.34em] uppercase md:mb-6 md:text-xs">
          <span className="h-px w-8 bg-sand/60" />
          Bocas del Toro · Panamá
          <span className="h-px w-8 bg-sand/60" />
        </p>

        <h1 className="font-display flex items-end justify-center gap-x-[0.25em] text-[clamp(2rem,min(9.4vw,12svh),7.5rem)] leading-[0.88] tracking-[-0.035em] whitespace-nowrap">
          <span className="sr-only">La Bocana Bungalows</span>
          <span className="block overflow-hidden pb-[0.16em]">
            <SplitChars text="La Bocana" delay={0.05} />
          </span>
          <span className="wonk block overflow-hidden pb-[0.16em] text-lagoon-soft italic">
            <SplitChars text="Bungalows" delay={0.25} />
          </span>
        </h1>

        <p style={entranceDelay(0.55)} className="mt-3 max-w-xl animate-rise text-base font-medium text-balance md:mt-4 md:text-lg lg:max-w-none lg:whitespace-nowrap">
          {site.tagline} Waterfront stays in a quiet corner of Bocas Town.
        </p>

        <div style={entranceDelay(0.7)} className="mt-10 hidden animate-rise lg:block [@media(max-height:760px)]:mt-6">
          <SearchBar />
        </div>

        <div style={entranceDelay(0.7)} className="mt-8 animate-rise lg:hidden">
          <SiteLink
            href="/book"
            className="inline-flex items-center gap-2 rounded-full bg-sand px-6 py-3.5 text-sm font-semibold whitespace-nowrap text-jungle shadow-xl"
          >
            Book your stay
            <ArrowIcon className="h-4 w-4" />
          </SiteLink>
        </div>
      </motion.div>
    </section>
  );
}
