"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import { CountUp, SectionLabel } from "../ui/bits";

type Token =
  | { word: string; accent?: "italic" | "lagoon" }
  | { pill: { src: string; alt: string; position: string } };

const words = (text: string): Token[] => text.split(" ").map((word) => ({ word }));

const tokens: Token[] = [
  ...words("La Bocana is a quiet waterfront retreat in Bocas Town"),
  { pill: { src: "/images/hero-waterfront.jpg", alt: "La Bocana's bungalows seen from the water", position: "50% 60%" } },
  { word: "—" },
  { word: "bungalows,", accent: "italic" },
  ...words("apartments and a home, steps from every restaurant and right on the"),
  { pill: { src: "/images/listings/561068/37.jpg", alt: "The sundeck on the water", position: "50% 55%" } },
  { word: "Caribbean.", accent: "lagoon" },
];

const stats = [
  { value: 4, label: "Waterfront bungalows" },
  { value: 2, label: "Apartments" },
  { value: 1, label: "Three-bedroom home" },
  { value: 2, label: "Minutes from the airport" },
];

export function Welcome() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });

  return (
    <section
      id="welcome"
      className="relative z-10 -mt-[8svh] rounded-t-[40px] bg-sand px-5 pt-20 pb-28 md:rounded-t-[64px] md:px-10 md:pt-28 md:pb-40"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12">
        <div className="md:col-span-3 md:pt-4">
          <SectionLabel index="01">Welcome</SectionLabel>
        </div>
        <p
          ref={ref}
          className="font-display text-[clamp(1.9rem,4.4vw,4.25rem)] leading-[1.08] tracking-[-0.02em] md:col-span-9"
        >
          {tokens.map((token, i) => {
            const range: [number, number] = [i / tokens.length, (i + 1) / tokens.length];
            return "pill" in token ? (
              <Pill key={i} progress={scrollYProgress} range={range} {...token.pill} />
            ) : (
              <Word key={i} progress={scrollYProgress} range={range} accent={token.accent}>
                {token.word}
              </Word>
            );
          })}
        </p>
      </div>

      <dl className="mx-auto mt-24 grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-14 md:mt-36 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 1.1, delay: i * 0.1, ease: EASE_OUT_EXPO }}
          >
            <motion.span
              className="h-px origin-left bg-jungle/25"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.2 + i * 0.1, ease: EASE_OUT_EXPO }}
            />
            <dt className="order-2 mt-2 text-xs font-semibold tracking-[0.22em] text-jungle/60 uppercase">{stat.label}</dt>
            <dd className="font-display mt-5 text-[clamp(3.5rem,7vw,6.5rem)] leading-none tracking-tight">
              <CountUp to={stat.value} />
            </dd>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}

type Range = [number, number];

function Word({
  children,
  progress,
  range,
  accent,
}: {
  children: string;
  progress: MotionValue<number>;
  range: Range;
  accent?: "italic" | "lagoon";
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className={cn(accent && "wonk italic", accent === "lagoon" && "text-lagoon")}>
        {children}
      </motion.span>{" "}
    </>
  );
}

function Pill({
  src,
  alt,
  position,
  progress,
  range,
}: {
  src: string;
  alt: string;
  position: string;
  progress: MotionValue<number>;
  range: Range;
}) {
  const scale = useTransform(progress, range, [0.2, 1]);
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <>
      <motion.span
        style={{ scale, opacity }}
        className="relative inline-block h-[0.8em] w-[1.9em] translate-y-[0.06em] overflow-hidden rounded-full align-baseline"
      >
        <Image src={src} alt={alt} fill sizes="160px" className="object-cover" style={{ objectPosition: position }} />
      </motion.span>{" "}
    </>
  );
}
