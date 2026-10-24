"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { getImageProps } from "next/image";
import { useRef } from "react";
import { entranceDelay } from "@/lib/cn";
import { site } from "@/lib/site";
import { SearchBar } from "../booking/booking-search";
import { SiteLink } from "../navigation";
import { ArrowIcon } from "../ui/bits";
import { SplitChars } from "../ui/split-chars";

/**
 * The homepage's first screen: sunset over the bay behind the name, a line about the place, and the search.
 * As the page scrolls on, the picture drifts down behind and the words lift away.
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
        <Backdrop />
      </motion.div>
      <div className="absolute inset-0 bg-jungle-deep/15" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(4,20,15,0.4)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-jungle-deep/55 to-transparent" />
      {/* A soft shade at the top so the nav reads over the bright sky. */}
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-jungle-deep/45 to-transparent" />

      {/* Centred in the first screen, as it is with the browser bars showing. */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="absolute inset-x-0 top-0 z-10 flex h-svh min-h-[640px] flex-col items-center justify-center px-4 pt-24 pb-6 text-center [text-shadow:0_1px_3px_rgba(4,20,15,0.55),0_3px_24px_rgba(4,20,15,0.5)]"
      >
        {/* A soft shade behind the title, tagline and search, so they read over the bright horizon. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_52%_46%_at_50%_54%,rgba(4,20,15,0.55),rgba(4,20,15,0.22)_55%,transparent_80%)]"
        />

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
          {site.tagline} Waterfront bungalows, apartments and a home in a quiet corner of Bocas Town.
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

/**
 * Sunset over the bay, wide or tall to suit the screen (only the one that fits is downloaded). It's the
 * page's largest image, so it's fetched first; it settles in with a slow zoom.
 */
function Backdrop() {
  const common = { alt: "", sizes: "100vw" };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, src: "/images/hero-sunset-wide.webp", width: 1920, height: 1080 });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, src: "/images/hero-sunset-tall.webp", width: 720, height: 1280, loading: "eager", fetchPriority: "high" });
  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={tall} />
      <source srcSet={wide} />
      <img {...rest} alt="" className="absolute inset-0 h-full w-full animate-settle object-cover" />
    </picture>
  );
}
