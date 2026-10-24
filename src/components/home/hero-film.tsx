"use client";

import { motion, useMotionTemplate, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import { site } from "@/lib/site";
import { SearchBar } from "../booking/booking-search";
import { SiteLink } from "../navigation";
import { ArrowIcon } from "../ui/bits";
import type { OceanScene } from "./ocean/ocean-scene";
import { SplitChars } from "../ui/split-chars";

type Chapter = { eyebrow: string; word: string };

/** One word per chapter of the 3D film, from dawn at sea to the bungalows in the afternoon light. */
const chapters: Chapter[] = [
  { eyebrow: "Bocas del Toro · Panamá", word: "Escape" },
  { eyebrow: "Turquoise water all around", word: "Ocean" },
  { eyebrow: "Jungle islands on the horizon", word: "Islands" },
  { eyebrow: "Golden hour, every evening", word: "Sunset" },
  { eyebrow: "Your bungalow on the water", word: "Home" },
];

/** Scroll progress at which each chapter begins. */
const CUTS = [0, 0.17, 0.34, 0.51, 0.68];
/** Past this point the film is over and the title and search appear. */
const REVEAL_AT = 0.86;
/** The camera lands a little after the title appears, so the last frame keeps settling. */
const SCENE_END = 0.95;
const FALLBACK = {
  src: "/images/hero-waterfront.webp",
  alt: "La Bocana's turquoise bungalows and sundeck, seen from the water in Bocas Town",
};

function timing(i: number) {
  const start = CUTS[i];
  const end = i === chapters.length - 1 ? REVEAL_AT - 0.02 : CUTS[i + 1];
  return { start, end };
}

/**
 * The homepage opens like a short film: scrolling flies a live 3D camera from
 * dawn at sea to the bungalows in the afternoon light, with a word per chapter.
 * Only when it ends do the title and the search bar appear.
 */
export function HeroFilm() {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? <StillHero /> : <Film />;
}

function Film() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [revealed, setRevealed] = useState(false);
  useMotionValueEvent(p, "change", (v) => setRevealed(v >= REVEAL_AT));

  const shade = useTransform(p, [0, 0.05, REVEAL_AT - 0.05, REVEAL_AT], [0.45, 0.06, 0.06, 0.14]);

  return (
    <section ref={ref} id="top" aria-label="La Bocana, a day on the water" className="relative h-[620svh] bg-jungle-deep md:h-[760svh]">
      {/* Tall as the screen with the browser bars hidden, so no strip of page shows beneath the scene on phones. */}
      <div className="sticky top-0 h-lvh overflow-hidden">
        <OceanCanvas progress={p} />

        <motion.div style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-jungle-deep" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(4,20,15,0.4)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-jungle-deep/55 to-transparent" />
        {/* A soft shade at the top so the nav reads over bright sky; nothing left behind when the nav hides. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-jungle-deep/45 to-transparent" />

        {/* The words stay within the screen that's visible even with the browser bars showing. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-svh">
          {chapters.map((chapter, i) => (
            <ChapterTitle key={chapter.word} chapter={chapter} index={i} progress={p} />
          ))}

          <FinalContent revealed={revealed} />
        </div>
      </div>
    </section>
  );
}

/**
 * The live 3D scene. three.js is only downloaded in the browser; until the scene is
 * ready a poster of its first frame stands in, and the live scene fades in over it.
 * Without WebGL the waterfront photo is shown instead.
 */
function OceanCanvas({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let scene: OceanScene | null = null;
    let cancelled = false;
    const toFilm = (v: number) => Math.min(v / SCENE_END, 1);

    import("./ocean/ocean-scene")
      .then(async ({ createOceanScene }) => {
        if (cancelled || !ref.current) return;
        // Built a step at a time, so scrolling stays smooth while it loads; it gives up if we unmount meanwhile.
        const created = await createOceanScene(ref.current, () => cancelled);
        if (cancelled) return created?.dispose();
        if (!created) return setState("failed");
        scene = created;
        scene.setProgress(toFilm(progress.get()));
        setState("ready");
      })
      .catch(() => setState("failed"));

    const unsubscribe = progress.on("change", (v) => scene?.setProgress(toFilm(v)));
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse") scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("pointermove", onPointer);
      scene?.dispose();
    };
  }, [progress]);

  return (
    <div className="absolute inset-0 bg-jungle-deep">
      {state === "failed" ? (
        <Image src={FALLBACK.src} alt={FALLBACK.alt} fill sizes="100vw" className="object-cover" />
      ) : (
        // Visible from the first paint (it's the page's largest image); it only settles in with a slow zoom.
        <motion.div
          aria-hidden
          className="absolute inset-0"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE_OUT_EXPO }}
        >
          <FilmPoster />
        </motion.div>
      )}
      <motion.div
        ref={ref}
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: state === "ready" ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </div>
  );
}

/**
 * The film's first frame, so the page opens on the real scene while three.js loads. Wide or tall to
 * match the screen, as the camera's lens widens on portrait screens; only the one that fits is downloaded.
 * Re-capture both from the running film if the opening shot changes.
 */
function FilmPoster() {
  const common = { alt: "", sizes: "100vw" };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, src: "/images/film-poster-wide.webp", width: 1920, height: 1080 });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, src: "/images/film-poster-tall.webp", width: 720, height: 1280, loading: "eager", fetchPriority: "high" });
  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={tall} />
      <source srcSet={wide} />
      <img {...rest} alt="" className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}

/** The word for a chapter: drifts up out of a blur, then away before the next one. */
function ChapterTitle({ chapter, index, progress }: { chapter: Chapter; index: number; progress: MotionValue<number> }) {
  const { start, end } = timing(index);
  const range = index === 0 ? [0, 0.001, end - 0.05, end - 0.015] : [start, start + 0.035, end - 0.05, end - 0.015];

  const opacity = useTransform(progress, range, [index === 0 ? 1 : 0, 1, 1, 0]);
  const y = useTransform(progress, range, [index === 0 ? 0 : 50, 0, 0, -50]);
  const blurPx = useTransform(progress, range, [index === 0 ? 0 : 14, 0, 0, 14]);
  // A tight shadow and a soft one keep the words readable over bright frames.
  const filter = useMotionTemplate`blur(${blurPx}px) drop-shadow(0 2px 6px rgba(4,20,15,0.45)) drop-shadow(0 8px 30px rgba(4,20,15,0.55))`;
  const spacing = useTransform(progress, range, ["0.6em", "0.42em", "0.42em", "0.2em"]);

  return (
    <>
      {/* A soft shade behind the words, so they read over bright water and sky without darkening the frame. */}
      <motion.div
        style={{ opacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[70svh] bg-[radial-gradient(ellipse_60%_48%_at_50%_70%,rgba(4,20,15,0.5),rgba(4,20,15,0.2)_55%,transparent_80%)]"
      />
      <motion.div
        style={{ opacity, y, filter }}
        className="pointer-events-none absolute inset-x-0 bottom-[17svh] z-10 flex flex-col items-center px-5 text-center text-sand"
      >
        <motion.div
          initial={index === 0 ? { opacity: 0, y: 30 } : false}
          animate={index === 0 ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1.6, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="flex flex-col items-center"
        >
          <motion.p style={{ letterSpacing: spacing }} className="text-[11px] font-semibold text-sand uppercase md:text-sm">
            {chapter.eyebrow}
          </motion.p>
          <p className="font-display mt-3 bg-linear-to-b from-sand-soft via-sand to-lagoon-soft bg-clip-text text-[clamp(3.6rem,min(12vw,20svh),11rem)] leading-[0.95] tracking-[-0.02em] text-transparent">
            {chapter.word}
          </p>
        </motion.div>
      </motion.div>
    </>
  );
}

const fadeUp = (show: boolean, delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
  transition: { duration: show ? 1.1 : 0.4, delay: show ? delay : 0, ease: EASE_OUT_EXPO },
});

/** Title, tagline and search: the film's last frame. */
function FinalContent({ revealed }: { revealed: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pt-24 pb-6 text-center text-sand [text-shadow:0_1px_3px_rgba(4,20,15,0.55),0_3px_24px_rgba(4,20,15,0.5)]",
        revealed ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* A soft shade behind the title, tagline and search, fading in with them. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_52%_46%_at_50%_54%,rgba(4,20,15,0.55),rgba(4,20,15,0.22)_55%,transparent_80%)]"
      />

      <motion.p
        {...fadeUp(revealed, 0)}
        className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.34em] uppercase md:mb-6 md:text-xs"
      >
        <span className="h-px w-8 bg-sand/60" />
        Bocas del Toro · Panamá
        <span className="h-px w-8 bg-sand/60" />
      </motion.p>

      <h1 className="font-display flex items-end justify-center gap-x-[0.25em] text-[clamp(2rem,min(9.4vw,12svh),7.5rem)] leading-[0.88] tracking-[-0.035em] whitespace-nowrap">
        <span className="sr-only">La Bocana Bungalows</span>
        <span className="block overflow-hidden pb-[0.16em]">
          <SplitChars text="La Bocana" show={revealed} delay={0.05} />
        </span>
        <span className="wonk block overflow-hidden pb-[0.16em] text-lagoon-soft italic">
          <SplitChars text="Bungalows" show={revealed} delay={0.25} />
        </span>
      </h1>

      <motion.p {...fadeUp(revealed, 0.55)} className="mt-3 max-w-xl text-base font-medium text-balance text-sand md:mt-4 md:text-lg lg:max-w-none lg:whitespace-nowrap">
        {site.tagline} Waterfront bungalows, apartments and a home in a quiet corner of Bocas Town.
      </motion.p>

      <motion.div {...fadeUp(revealed, 0.7)} className="mt-10 hidden lg:block [@media(max-height:760px)]:mt-6">
        <SearchBar />
      </motion.div>

      <motion.div {...fadeUp(revealed, 0.7)} className="mt-8 lg:hidden">
        <SiteLink
          href="/book"
          className="inline-flex items-center gap-2 rounded-full bg-sand px-6 py-3.5 text-sm font-semibold whitespace-nowrap text-jungle shadow-xl"
        >
          Book your stay
          <ArrowIcon className="h-4 w-4" />
        </SiteLink>
      </motion.div>
    </div>
  );
}

/** Reduced motion: no film, just the last frame. */
function StillHero() {
  return (
    <section id="top" className="relative h-svh overflow-hidden bg-jungle-deep">
      <Image src={FALLBACK.src} alt={FALLBACK.alt} fill preload sizes="100vw" className="object-cover object-[50%_60%]" />
      <div className="absolute inset-0 bg-jungle-deep/45" />
      <FinalContent revealed />
    </section>
  );
}
