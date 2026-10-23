"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatPrice, stays, stayFacts, type Stay } from "@/lib/stays";
import { SiteLink } from "../navigation";
import { StayMedia } from "../stay-art";
import { ArrowIcon, SectionLabel } from "../ui/bits";
import { RevealText } from "../ui/reveal-text";

/**
 * On desktop the section pins and vertical scroll drives the cards sideways.
 * On touch screens it's a plain swipeable row.
 */
export function StaysRail() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const distance = useMotionValue(0);
  const [current, setCurrent] = useState(1);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(() => -scrollYProgress.get() * distance.get());

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setCurrent(Math.min(stays.length, Math.floor(v * stays.length) + 1));
  });

  useEffect(() => {
    const trackEl = track.current;
    const sectionEl = section.current;
    if (!trackEl || !sectionEl) return;
    const desktop = window.matchMedia("(min-width: 768px)");

    const measure = () => {
      const d = desktop.matches ? Math.max(0, trackEl.scrollWidth - window.innerWidth) : 0;
      distance.set(d);
      sectionEl.style.setProperty("--rail-distance", `${d}px`);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(trackEl);
    desktop.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
    };
  }, [distance]);

  return (
    <section
      ref={section}
      id="stays"
      className="relative rounded-t-[40px] bg-jungle text-sand md:h-[calc(100svh+var(--rail-distance,0px))] md:rounded-t-[64px]"
    >
      <div className="flex flex-col justify-center py-24 md:sticky md:top-0 md:h-svh md:overflow-hidden md:py-0">
        <div className="mb-10 flex flex-col gap-8 px-5 md:mb-12 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <SectionLabel index="02" className="text-sand/80">
              Stays
            </SectionLabel>
            <RevealText
              text="Nine hideaways, *one* address."
              className="font-display mt-6 max-w-3xl text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.95] tracking-tight"
              accentClassName="wonk italic text-lagoon-soft"
            />
          </div>
          <div className="hidden w-56 md:block">
            <div className="font-display flex items-baseline justify-between text-sm">
              <span className="text-3xl tabular-nums">{String(current).padStart(2, "0")}</span>
              <span className="text-sand/50">/ {String(stays.length).padStart(2, "0")}</span>
            </div>
            <div className="mt-3 h-px bg-sand/20">
              <motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-lagoon-soft" />
            </div>
          </div>
        </div>

        <div className="no-scrollbar snap-x snap-mandatory scroll-px-5 overflow-x-auto md:overflow-visible">
          <motion.div ref={track} style={{ x }} className="flex w-max gap-4 px-5 md:gap-6 md:px-10">
            {stays.map((stay, i) => (
              <StayCard key={stay.slug} stay={stay} index={i} progress={scrollYProgress} />
            ))}
            <EndCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StayCard({ stay, index, progress }: { stay: Stay; index: number; progress: MotionValue<number> }) {
  // The scene slides inside the card against the rail's motion.
  const innerX = useTransform(progress, [0, 1], ["-8%", "8%"]);

  return (
    <SiteLink
      href={`/stays/${stay.slug}`}
     
      data-cursor="View"
      className="group relative block aspect-[3/4] w-[80vw] shrink-0 snap-start overflow-hidden rounded-[28px] bg-jungle-deep sm:w-[46vw] md:h-[min(58svh,36vw)] md:w-auto"
    >
      <motion.div style={{ x: innerX }} className="absolute inset-y-0 -inset-x-[10%]">
        <div className="absolute inset-0 transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.07]">
          <StayMedia stay={stay} sizes="(min-width: 768px) 32vw, 80vw" />
        </div>
      </motion.div>

      <div className="absolute inset-0 bg-linear-to-t from-jungle-deep/90 via-jungle-deep/10 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-jungle-deep/45 to-transparent" />

      <div className="absolute inset-x-5 top-5 flex items-center justify-between text-sand">
        <span className="font-display text-lg italic">{String(index + 1).padStart(2, "0")}</span>
        <span className="rounded-full bg-sand/15 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] uppercase backdrop-blur-md">
          {stay.kind === "Pair" ? "Two bungalows" : stay.kind}
        </span>
      </div>

      <div className="absolute inset-x-5 bottom-5 text-sand">
        <h3 className="font-display text-[clamp(1.9rem,2.6vw,2.6rem)] leading-none tracking-tight">{stay.label}</h3>
        <p className="font-display mt-2 text-base text-lagoon-soft italic">{stay.name}</p>
        <p className="mt-3 text-xs text-sand/75">{stayFacts(stay.listing)}</p>
        <div className="mt-4 flex items-center justify-between border-t border-sand/20 pt-4">
          <p className="text-sm text-sand/75">
            From <span className="font-display text-2xl text-sand">{formatPrice(stay.listing)}</span> / night
          </p>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-jungle transition-all duration-700 ease-out-expo group-hover:-rotate-45 group-hover:bg-lagoon group-hover:text-sand">
            <ArrowIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </SiteLink>
  );
}

function EndCard() {
  return (
    <div className="flex aspect-[3/4] w-[80vw] shrink-0 snap-start flex-col justify-between rounded-[28px] bg-sand p-6 text-jungle sm:w-[46vw] md:h-[min(58svh,36vw)] md:w-auto md:p-8">
      <p className="text-[11px] font-semibold tracking-[0.28em] uppercase opacity-60">Book direct</p>
      <div>
        <p className="font-display text-[clamp(2rem,3vw,3rem)] leading-[1] tracking-tight">
          Know your dates? Let&apos;s find your <span className="wonk text-lagoon italic">spot.</span>
        </p>
        <p className="mt-4 text-sm text-jungle/65">Pick dates and guests, and we&apos;ll show every stay that fits.</p>
        <SiteLink
          href="/book"
          className="group mt-8 inline-flex items-center gap-3 rounded-full bg-jungle px-5 py-3 text-sm font-semibold text-sand transition-colors duration-500 hover:bg-lagoon"
        >
          Start booking
          <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
        </SiteLink>
      </div>
    </div>
  );
}
