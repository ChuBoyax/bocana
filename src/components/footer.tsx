"use client";

import { useLenis } from "lenis/react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { navLinks, site } from "@/lib/site";
import { stays } from "@/lib/stays";
import { wavePath } from "@/lib/wave";
import { SiteLink } from "./navigation";
import { ArrowIcon } from "./ui/bits";
import { Magnetic } from "./ui/magnetic";
import { RevealText } from "./ui/reveal-text";

const WORDMARK = "La Bocana";

const waves = [
  { d: wavePath({ width: 2400, height: 120, amplitude: 14, wavelength: 600, baseline: 34 }), className: "fill-lagoon/25 animate-drift-slow" },
  { d: wavePath({ width: 2400, height: 120, amplitude: 12, wavelength: 400, baseline: 48 }), className: "fill-lagoon/40 animate-drift-reverse" },
];
const shore = wavePath({ width: 2400, height: 120, amplitude: 10, wavelength: 300, baseline: 60 });

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const lift = useTransform(scrollYProgress, [0, 1], ["-25%", "0%"]);

  return (
    <footer ref={ref} className="relative overflow-hidden bg-jungle-deep text-sand">
      <div aria-hidden className="relative h-[90px] overflow-hidden bg-sand md:h-[120px]">
        {waves.map((wave, i) => (
          <svg key={i} viewBox="0 0 2400 120" preserveAspectRatio="none" className={`absolute inset-y-0 left-0 h-full w-[200%] ${wave.className}`}>
            <path d={wave.d} />
          </svg>
        ))}
        <svg viewBox="0 0 2400 120" preserveAspectRatio="none" className="absolute inset-y-0 left-0 h-full w-[200%] animate-drift fill-jungle-deep">
          <path d={shore} />
        </svg>
      </div>

      <div className="overflow-hidden">
        <motion.div style={{ y: lift }} className="relative px-5 pt-16 md:px-10 md:pt-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
              <RevealText
                text="Your bungalow is *waiting.*"
                className="font-display text-[8vw] leading-[0.9] tracking-tight whitespace-nowrap md:text-[clamp(2.5rem,6vw,6.5rem)]"
                accentClassName="wonk italic text-lagoon-soft"
              />
              <Magnetic strength={0.45}>
                <SiteLink
                  href="/#stays"
                  className="group flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full bg-lagoon text-center text-sm font-semibold text-sand-soft transition-transform duration-700 ease-out-expo hover:scale-105 md:h-44 md:w-44"
                >
                  <ArrowIcon className="h-5 w-5 transition-transform duration-700 ease-out-expo group-hover:-rotate-45" />
                  Find your stay
                </SiteLink>
              </Magnetic>
            </div>

            <div className="mt-20 grid gap-12 border-t border-sand/10 pt-12 sm:grid-cols-2 md:grid-cols-12">
              <div className="md:col-span-5">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-sand/50 uppercase">Stays</p>
                <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {stays.map((stay) => (
                    <li key={stay.slug}>
                      <SiteLink href={`/stays/${stay.slug}`} className="text-sand/80 transition-colors hover:text-lagoon-soft">
                        {stay.label}
                      </SiteLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-3">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-sand/50 uppercase">Explore</p>
                <ul className="mt-5 space-y-2.5">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <SiteLink href={link.href} className="text-sand/80 transition-colors hover:text-lagoon-soft">
                        {link.label}
                      </SiteLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-4">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-sand/50 uppercase">Visit</p>
                <address className="mt-5 leading-relaxed text-sand/80 not-italic">
                  {site.street}
                  <br />
                  {site.city}
                </address>
                <a
                  href={site.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-2 text-lagoon-soft underline-offset-4 hover:underline"
                >
                  Get directions <ArrowIcon className="h-4 w-4" />
                </a>
                <SiteLink
                  href="/book"
                  className="mt-2 flex items-center gap-2 text-lagoon-soft underline-offset-4 hover:underline"
                >
                  Book direct <ArrowIcon className="h-4 w-4" />
                </SiteLink>
              </div>
            </div>
          </div>

          <Wordmark progress={scrollYProgress} />

          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 border-t border-sand/10 py-6 text-xs text-sand/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {site.name} · {site.city}
            </p>
            <button
              type="button"
              onClick={() => (lenis ? lenis.scrollTo(0, { duration: 2.2 }) : window.scrollTo({ top: 0, behavior: "smooth" }))}
              className="group inline-flex items-center gap-2 self-start font-semibold tracking-[0.2em] text-sand/70 uppercase hover:text-sand sm:self-auto"
            >
              Back to top
              <ArrowIcon direction="up" className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

/** Giant wordmark; each letter rises on its own beat as the footer settles. */
function Wordmark({ progress }: { progress: MotionValue<number> }) {
  return (
    <p aria-hidden className="font-display wonk mt-16 flex justify-center overflow-hidden text-[19.5vw] leading-[0.8] tracking-[-0.05em] italic select-none">
      {Array.from(WORDMARK).map((char, i) => (
        <Letter key={i} char={char} progress={progress} index={i} />
      ))}
    </p>
  );
}

function Letter({ char, progress, index }: { char: string; progress: MotionValue<number>; index: number }) {
  const start = 0.35 + index * 0.04;
  const y = useTransform(progress, [start, Math.min(start + 0.35, 1)], ["100%", "0%"]);
  return (
    <motion.span style={{ y }} className="inline-block pb-[0.12em] text-sand/95">
      {char === " " ? " " : char}
    </motion.span>
  );
}


