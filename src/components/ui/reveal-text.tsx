"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";

type Tag = "h1" | "h2" | "h3" | "p";

type RevealTextProps = {
  /** Wrap words in *asterisks* to set them in the italic accent style. */
  text: string;
  as?: Tag;
  className?: string;
  accentClassName?: string;
  delay?: number;
  stagger?: number;
};

/** Words rise out of a mask, one after another, when the text scrolls into view. */
export function RevealText({
  text,
  as = "h2",
  className,
  accentClassName = "wonk italic text-lagoon",
  delay = 0,
  stagger = 0.07,
}: RevealTextProps) {
  const Component = motion[as];
  const words = parse(text);

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      <span className="sr-only">{words.map((w) => w.word).join(" ")}</span>
      {words.map(({ word, accent }, i) => (
        // The space sits outside the masked word: trailing spaces inside an inline-block collapse.
        <Fragment key={i}>
          <span aria-hidden className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top">
            <motion.span
              className={cn("inline-block", accent && accentClassName)}
              variants={{
                hidden: { y: "115%", rotate: 4 },
                show: { y: "0%", rotate: 0, transition: { duration: 1.1, ease: EASE_OUT_EXPO } },
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Component>
  );
}

function parse(text: string) {
  let accent = false;
  return text.split(" ").map((raw) => {
    const opens = raw.startsWith("*");
    const closes = raw.replace(/[.,!?]$/, "").endsWith("*");
    if (opens) accent = true;
    const word = { word: raw.replaceAll("*", ""), accent };
    if (closes) accent = false;
    return word;
  });
}
