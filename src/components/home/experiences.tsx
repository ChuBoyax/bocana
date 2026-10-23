"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { experiences, type Experience } from "@/lib/site";
import { StayArt } from "../stay-art";
import { Reveal, SectionLabel } from "../ui/bits";
import { RevealText } from "../ui/reveal-text";

const cardColors = [
  "bg-sand text-jungle",
  "bg-lagoon text-sand-soft",
  "bg-jungle-soft text-sand",
  "bg-sand-deep text-jungle",
  "bg-lagoon-soft text-jungle-deep",
];

/** Cards pin and stack; each one shrinks back as the next slides over it. */
export function Experiences() {
  const stack = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stack, offset: ["start start", "end end"] });

  return (
    <section id="experiences" className="relative rounded-t-[40px] bg-jungle-deep text-sand md:rounded-t-[64px]">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 pt-28 md:grid-cols-12 md:px-10 md:pt-40">
        <div className="md:col-span-3 md:pt-4">
          <SectionLabel index="05" className="text-sand/80">
            Experiences
          </SectionLabel>
        </div>
        <div className="md:col-span-9">
          <RevealText
            text="Island days, *Bocas* style."
            className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.95] tracking-tight"
            accentClassName="wonk italic text-lagoon-soft"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg text-sand/70">
              A few favourite ways to spend a day in the archipelago. We&apos;re happy to arrange tours and water taxis, and boats
              can pick you up right at our dock.
            </p>
          </Reveal>
        </div>
      </div>

      <div ref={stack} className="relative px-3 pb-[8svh] md:px-10">
        {experiences.map((experience, i) => (
          <ExperienceCard
            key={experience.title}
            experience={experience}
            index={i}
            progress={scrollYProgress}
            range={[i / experiences.length, 1]}
            targetScale={1 - (experiences.length - 1 - i) * 0.04}
            last={i === experiences.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function ExperienceCard({
  experience,
  index,
  progress,
  range,
  targetScale,
  last,
}: {
  experience: Experience;
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  last: boolean;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const { scrollYProgress: enter } = useScroll({ target: wrapper, offset: ["start end", "start start"] });
  const artScale = useTransform(enter, [0, 1], [1.5, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);
  const dim = useTransform(progress, range, [0, last ? 0 : 0.35]);

  return (
    <div ref={wrapper} className="sticky top-0 flex h-svh items-center justify-center">
      <motion.article
        style={{ scale, top: `calc(-4svh + ${index * 26}px)` }}
        className={cn(
          "relative grid h-[min(74svh,640px)] w-full max-w-[1300px] origin-top grid-rows-[40%_1fr] overflow-hidden rounded-[32px] md:grid-cols-[1fr_1.15fr] md:grid-rows-1",
          cardColors[index % cardColors.length],
        )}
      >
        <div className="relative z-10 flex flex-col justify-between p-6 md:p-12">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.28em] uppercase opacity-70">
            <span>{experience.place}</span>
            <span className="font-display text-base tracking-normal italic">
              {String(index + 1).padStart(2, "0")} / {String(experiences.length).padStart(2, "0")}
            </span>
          </div>
          <div>
            <h3 className="font-display text-[clamp(2.4rem,5vw,4.75rem)] leading-[0.95] tracking-tight">{experience.title}</h3>
            <p className="mt-5 max-w-md text-base opacity-80 md:text-lg">{experience.text}</p>
          </div>
        </div>

        <div className="relative order-first overflow-hidden md:order-none">
          <motion.div style={{ scale: artScale }} className="absolute inset-0">
            <StayArt tone={experience.tone} />
          </motion.div>
        </div>

        <motion.div style={{ opacity: dim }} className="pointer-events-none absolute inset-0 z-20 bg-jungle-deep" />
      </motion.article>
    </div>
  );
}
