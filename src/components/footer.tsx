"use client";

import { useLenis } from "lenis/react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { navLinks, site } from "@/lib/site";
import { stays } from "@/lib/stays";
import { wavePath } from "@/lib/wave";
import { SiteLink } from "./navigation";
import { ArrowIcon } from "./ui/bits";
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

/**
 * Giant wordmark with the sunset video showing through the letters: the video plays underneath, and a
 * jungle-green sheet with the letters cut out of it sits on top.
 */
function Wordmark({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0.3, 0.9], ["45%", "0%"]);
  const opacity = useTransform(progress, [0.3, 0.7], [0, 1]);

  return (
    <motion.div aria-hidden style={{ y, opacity }} className="relative mx-auto mt-16 aspect-[1000/250] w-full max-w-[1500px] select-none">
      <video
        className="absolute inset-[2px] h-[calc(100%-4px)] w-[calc(100%-4px)] object-cover"
        src="/video/luma-e922d390.mp4"
        poster="/video/luma-poster.webp"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <svg viewBox="0 0 1000 250" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <mask id="wordmark-cutout">
            <rect width="1000" height="250" fill="#fff" />
            <text x="500" y="205" textAnchor="middle" textLength="970" lengthAdjust="spacingAndGlyphs" fontSize="250" fill="#000" className="font-display wonk italic">
              {WORDMARK}
            </text>
          </mask>
        </defs>
        <rect x="-2" y="-2" width="1004" height="254" mask="url(#wordmark-cutout)" className="fill-jungle-deep" />
      </svg>
    </motion.div>
  );
}
