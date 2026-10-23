"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { cn, EASE_IN_OUT } from "@/lib/cn";
import { stays } from "@/lib/stays";
import { SiteLink } from "../navigation";
import { Reveal, SectionLabel } from "../ui/bits";
import { RevealText } from "../ui/reveal-text";

type Step = {
  title: string;
  text: string;
  image?: { src: string; alt: string };
};

const steps: Step[] = [
  {
    title: "Head to the south end of 5th Street",
    text: "La Bocana sits at the southern end of Calle 5ta, where the street meets the little park with the big tree.",
    image: { src: "/images/checkin/park.webp", alt: "The park at the southern end of 5th Street" },
  },
  {
    title: "Look across from the park",
    text: "Stand by the park and look across the street. You'll spot the turquoise house next to the yellow building.",
    image: { src: "/images/checkin/from-park.webp", alt: "View from the park, with the property circled across the street" },
  },
  {
    title: "Enter to the right of the yellow building",
    text: "The entrance is just to the right of the yellow building. Follow the arrow and you're home.",
    image: { src: "/images/checkin/entrance.webp", alt: "The entrance beside the yellow building, marked with an arrow" },
  },
  {
    title: "Use the code from your application",
    text: "Entry codes are in your application. We change them frequently, so always use the latest one.",
  },
];

/** Steps scroll past on the right while a pinned frame swaps photos on the left. */
export function CheckIn() {
  const [active, setActive] = useState(0);

  return (
    <section id="check-in" className="bg-sand px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-3 md:pt-4">
            <SectionLabel index="04">Arrival</SectionLabel>
          </div>
          <div className="md:col-span-9">
            <RevealText
              text="Finding your way home is *easy.*"
              className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.95] tracking-tight"
            />
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl text-lg text-jungle/70">
                Self check-in from 3:00 PM with keypad locks, so late arrivals are easy. Every stay shares the same address and
                the same short walk in.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-2 md:gap-20">
          <div className="hidden md:block">
            <div className="sticky top-[12svh] h-[76svh]">
              <Frame active={active} />
            </div>
          </div>

          <ol>
            {steps.map((step, i) => (
              <StepItem key={step.title} step={step} index={i} active={active === i} setActive={setActive} />
            ))}
          </ol>
        </div>

        <Reveal className="mt-20 border-t border-jungle/15 pt-10 md:mt-28">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-jungle/60 uppercase">Arrival guide for each stay</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {stays.map((stay) => (
              <SiteLink
                key={stay.slug}
                href={`/stays/${stay.slug}`}
               
                className="rounded-full border border-jungle/20 px-4 py-2 text-sm font-medium transition-colors duration-500 hover:border-jungle hover:bg-jungle hover:text-sand"
              >
                {stay.label}
              </SiteLink>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StepItem({
  step,
  index,
  active,
  setActive,
}: {
  step: Step;
  index: number;
  active: boolean;
  setActive: Dispatch<SetStateAction<number>>;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) setActive(index);
  }, [inView, index, setActive]);

  return (
    <li
      ref={ref}
      className={cn(
        "flex min-h-[auto] flex-col justify-center py-10 transition-opacity duration-700 md:min-h-[72svh] md:py-0",
        active ? "md:opacity-100" : "md:opacity-25",
      )}
    >
      <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-[24px] md:hidden">
        {step.image ? (
          <Image src={step.image.src} alt={step.image.alt} fill sizes="90vw" className="object-cover" />
        ) : (
          <CodeCard active />
        )}
      </div>
      <span className="font-display text-outline text-[clamp(4rem,8vw,7rem)] leading-none [--outline:var(--color-jungle)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="font-display mt-4 text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.02] tracking-tight">{step.title}</h3>
      <p className="mt-4 max-w-md text-lg text-jungle/70">{step.text}</p>
    </li>
  );
}

function Frame({ active }: { active: number }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[32px] bg-jungle">
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          className="absolute inset-0"
          style={{ zIndex: i }}
          initial={false}
          animate={{ clipPath: i <= active ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
          transition={{ duration: 1.1, ease: EASE_IN_OUT }}
        >
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ scale: i === active ? 1 : 1.15 }}
            transition={{ duration: 1.6, ease: EASE_IN_OUT }}
          >
            {step.image ? (
              <Image src={step.image.src} alt={step.image.alt} fill sizes="45vw" className="object-cover" />
            ) : (
              <CodeCard active={i === active} />
            )}
          </motion.div>
        </motion.div>
      ))}

      <div className="absolute inset-x-6 bottom-6 z-10 flex items-center gap-3">
        {steps.map((step, i) => (
          <span key={step.title} className="h-1 flex-1 overflow-hidden rounded-full bg-sand/30">
            <motion.span
              className="block h-full origin-left bg-sand"
              initial={false}
              animate={{ scaleX: i <= active ? 1 : 0 }}
              transition={{ duration: 0.8, ease: EASE_IN_OUT }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function CodeCard({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-jungle text-sand">
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((dot) => (
          <span
            key={dot}
            className={cn("h-5 w-5 rounded-full bg-lagoon-soft md:h-7 md:w-7", active && "animate-pulse-dot")}
            style={{ animationDelay: `${dot * 0.25}s` }}
          />
        ))}
      </div>
      <p className="font-display px-8 text-center text-2xl italic md:text-3xl">Your code is in your application</p>
    </div>
  );
}
