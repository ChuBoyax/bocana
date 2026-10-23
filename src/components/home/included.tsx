"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO } from "@/lib/cn";
import { perks, type Perk } from "@/lib/site";
import { Reveal, SectionLabel } from "../ui/bits";
import { ParallaxImage } from "../ui/parallax-image";
import { RevealText } from "../ui/reveal-text";

/** What comes with every stay, beside a tall parallax photo of the sundeck. */
export function Included() {
  return (
    <section id="included" className="bg-sand px-5 pt-28 pb-10 md:px-10 md:pt-40">
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionLabel index="03">Included</SectionLabel>
          <RevealText
            text="Little luxuries, *included.*"
            className="font-display mt-6 text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.95] tracking-tight"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-lg text-jungle/70">
              Every bungalow, apartment and the home share the same waterfront complex, and the same easy island extras.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="relative mt-10">
            <ParallaxImage
              src="/images/listings/561068/37.webp"
              alt="The shared sundeck with umbrellas and loungers over the turquoise water"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/5] rounded-[32px]"
              amount={8}
            />
            <p className="absolute bottom-5 left-5 rounded-full bg-sand/90 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-jungle uppercase backdrop-blur">
              The sundeck
            </p>
          </Reveal>
        </div>

        <ul className="grid content-start gap-px self-start overflow-hidden rounded-[32px] bg-jungle/10 sm:grid-cols-2 lg:col-span-7 lg:mt-24">
          {perks.map((perk, i) => (
            <motion.li
              key={perk.title}
              className="group flex flex-col gap-5 bg-sand p-7 transition-colors duration-700 hover:bg-sand-soft md:p-9"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 1, delay: (i % 2) * 0.1, ease: EASE_OUT_EXPO }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-jungle text-lagoon-soft transition-all duration-700 ease-out-expo group-hover:-rotate-12 group-hover:bg-lagoon group-hover:text-sand-soft">
                <PerkIcon icon={perk.icon} />
              </span>
              <div>
                <h3 className="font-display text-2xl tracking-tight">{perk.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-jungle/65">{perk.text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const paths: Record<Perk["icon"], ReactNode> = {
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0" />
      <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" />
      <path d="M8.7 16a5 5 0 0 1 6.6 0" />
      <circle cx="12" cy="19.2" r="1" fill="currentColor" />
    </>
  ),
  water: <path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z" />,
  paddle: (
    <>
      <path d="M15 3.5c2.6-.6 5 1.8 4.4 4.4-.4 1.9-2.6 3.4-4.6 3.3L8.6 17.4" />
      <path d="M15 3.5c-1.9.4-3.4 2.6-3.3 4.6L5.5 14.3" />
      <path d="M4 19.9 8.6 17.4M4 19.9l1.5-5.6" />
    </>
  ),
  laundry: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M4 7.5h16" />
      <circle cx="12" cy="14" r="4" />
      <path d="M10 14.5c.7-.6 1.3-.6 2 0s1.3.6 2 0" />
    </>
  ),
  swim: (
    <>
      <path d="M2.5 17c1.6 0 2.4-1.2 4-1.2s2.4 1.2 4 1.2 2.4-1.2 4-1.2 2.4 1.2 4 1.2 2.4-1.2 3-1.2" />
      <path d="M2.5 21c1.6 0 2.4-1.2 4-1.2s2.4 1.2 4 1.2 2.4-1.2 4-1.2 2.4 1.2 4 1.2 2.4-1.2 3-1.2" />
      <path d="M8 13V5.5a2 2 0 0 1 4 0M16 13V5.5a2 2 0 0 0-4 0M8 8h8" />
    </>
  ),
  deck: (
    <>
      <path d="M3 10a9 9 0 0 1 18 0Z" />
      <path d="M12 10v11M8 21h8" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8 20 3M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  boat: (
    <>
      <path d="M3 16h18l-2.5 4.5h-13Z" />
      <path d="M12 3v13M12 4.5l6 9.5h-6" />
    </>
  ),
};

function PerkIcon({ icon }: { icon: Perk["icon"] }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[icon]}
    </svg>
  );
}
