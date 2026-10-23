"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { EASE_OUT_EXPO } from "@/lib/cn";
import { formatHour, formatPrice, type Stay } from "@/lib/stays";
import { StaySearch } from "../booking/booking-search";

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className}>
      <svg viewBox="0 0 24 24" className="mr-1 inline h-4 w-4 -translate-y-px text-lagoon" fill="currentColor" aria-hidden>
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
      </svg>
      {value.toFixed(1)}
      <span className="sr-only"> out of 10</span>
    </span>
  );
}

/** Price, rating and the booking form; sticky beside the content on large screens. */
export function BookingCard({ stay }: { stay: Stay }) {
  const { listing } = stay;
  return (
    <div id="book" className="scroll-mt-28 rounded-[28px] bg-sand-soft p-6 shadow-[0_30px_80px_-40px_rgba(7,34,25,0.45)] ring-1 ring-jungle/10 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <p>
          <span className="text-xs font-semibold tracking-[0.2em] text-jungle/55 uppercase">From</span>
          <span className="font-display block text-4xl leading-none tracking-tight">
            {formatPrice(listing)}
            <span className="ml-1 font-sans text-base font-medium tracking-normal text-jungle/60">/ night</span>
          </span>
        </p>
        {listing.rating !== null && <Rating value={listing.rating} className="mt-1 text-sm font-semibold" />}
      </div>

      <div className="mt-6">
        <StaySearch stay={stay} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-jungle/10 pt-5 text-sm">
        <div>
          <dt className="text-jungle/55">Check-in</dt>
          <dd className="font-semibold">From {formatHour(listing.checkInHour)}</dd>
        </div>
        <div>
          <dt className="text-jungle/55">Check-out</dt>
          <dd className="font-semibold">By {formatHour(listing.checkOutHour)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-jungle/50">Rates vary by date and length of stay.</p>
    </div>
  );
}

/** Small screens: a bar pinned to the bottom that jumps to the booking card. */
export function MobileBookBar({ stay }: { stay: Stay }) {
  const lenis = useLenis();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const rect = document.getElementById("book")?.getBoundingClientRect();
    const cardInView = rect ? rect.top < window.innerHeight && rect.bottom > 0 : false;
    setVisible(y > window.innerHeight * 0.6 && !cardInView);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-4 rounded-full bg-jungle-deep/90 py-2.5 pr-2.5 pl-6 text-sand shadow-2xl backdrop-blur-xl lg:hidden"
          initial={{ y: "150%" }}
          animate={{ y: "0%" }}
          exit={{ y: "150%" }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          <p className="text-sm">
            <span className="font-display text-xl">{formatPrice(stay.listing)}</span>
            <span className="text-sand/60"> / night</span>
          </p>
          <button
            type="button"
            onClick={() => lenis?.scrollTo("#book", { offset: -100, duration: 1.4 })}
            className="rounded-full bg-lagoon px-5 py-3 text-sm font-semibold text-sand-soft"
          >
            Check availability
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
