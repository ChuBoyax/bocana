"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import type { GalleryImage } from "@/lib/stays";
import { ArrowIcon } from "../ui/bits";

/** Bento preview of the first five photos; any of them opens the full lightbox. */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const preview = images.slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:h-[min(70svh,640px)] md:grid-cols-4 md:grid-rows-2 md:gap-3">
        {preview.map((image, i) => {
          // The last tile shown at each size doubles as the way into every photo.
          const moreOnMobile = i === 2 && images.length > 3;
          const moreOnDesktop = i === preview.length - 1 && images.length > preview.length;
          return (
            <motion.button
              key={image.src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={moreOnDesktop ? `Show all ${images.length} photos` : `Open photo ${i + 1} of ${images.length}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 1, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-jungle/10 md:rounded-[20px]",
                i === 0 ? "col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto" : "aspect-square md:aspect-auto",
                i > 2 && "hidden md:block",
              )}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={i === 0 ? "(min-width: 1480px) 700px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1480px) 350px, (min-width: 768px) 25vw, 50vw"}
                preload={i === 0}
                className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
              />
              {moreOnMobile && <MorePhotos count={images.length - 3} className="flex md:hidden" />}
              {moreOnDesktop && <MorePhotos count={images.length - preview.length} className="hidden md:flex" />}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox images={images} title={title} start={open} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

const slide = {
  enter: (direction: number) => ({ x: `${direction * 12}%`, opacity: 0, scale: 0.97 }),
  center: { x: "0%", opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: `${direction * -12}%`, opacity: 0, scale: 0.97 }),
};

function Lightbox({
  images,
  title,
  start,
  onClose,
}: {
  images: GalleryImage[];
  title: string;
  start: number;
  onClose: () => void;
}) {
  const lenis = useLenis();
  const [[index, direction], setState] = useState([start, 0]);
  const thumbs = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const go = useCallback(
    (step: number) => setState(([i]) => [(i + step + images.length) % images.length, step]),
    [images.length],
  );

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    lenis?.stop();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      trigger?.focus();
    };
  }, [lenis, onClose, go]);

  useEffect(() => {
    thumbs.current
      ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const image = images[index];
  const neighbours = [images[(index + 1) % images.length], images[(index - 1 + images.length) % images.length]];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      className="fixed inset-0 z-[85] flex flex-col bg-jungle-deep/95 text-sand backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <p className="font-display text-lg">
          <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          <span className="text-sand/50"> / {String(images.length).padStart(2, "0")}</span>
          <span className="ml-4 hidden text-sand/70 italic sm:inline">{title}</span>
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-sand/10 transition-colors hover:bg-sand hover:text-jungle"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={image.src}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.x < -80 || velocity.x < -500) go(1);
              else if (offset.x > 80 || velocity.x > 500) go(-1);
            }}
            className="absolute inset-x-3 inset-y-0 cursor-grab active:cursor-grabbing md:inset-x-24"
          >
            <Image src={image.src} alt={image.alt} fill sizes="100vw" loading="eager" draggable={false} className="object-contain" />
          </motion.div>
        </AnimatePresence>

        {neighbours.map((n) => (
          <Image key={`pre-${n.src}`} src={n.src} alt="" fill sizes="100vw" loading="eager" className="invisible" aria-hidden />
        ))}

        <NavButton side="left" onClick={() => go(-1)} />
        <NavButton side="right" onClick={() => go(1)} />
      </div>

      <div ref={thumbs} data-lenis-prevent className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-4 md:px-8">
        {images.map((thumb, i) => (
          <button
            key={thumb.src}
            type="button"
            data-index={i}
            onClick={() => setState(([current]) => [i, i > current ? 1 : -1])}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === index}
            className={cn(
              "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition-all duration-500 md:h-20 md:w-28",
              i === index ? "opacity-100 ring-2 ring-lagoon-soft" : "opacity-45 hover:opacity-80",
            )}
          >
            <Image src={thumb.src} alt="" fill sizes="112px" className="object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-sand/10 backdrop-blur transition-colors hover:bg-sand hover:text-jungle md:flex",
        side === "left" ? "left-6" : "right-6",
      )}
    >
      <ArrowIcon direction={side} className="h-5 w-5" />
    </button>
  );
}

function MorePhotos({ count, className }: { count: number; className: string }) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex-col items-center justify-center gap-2 bg-jungle-deep/55 text-sand transition-colors duration-500 group-hover:bg-jungle-deep/70",
        className,
      )}
    >
      <span className="font-display text-4xl leading-none md:text-5xl">+{count}</span>
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase">
        <GridIcon />
        All photos
      </span>
    </span>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}
