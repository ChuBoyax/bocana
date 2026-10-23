"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { formatLong, formatMoney, guestsLabel, type Guests } from "@/lib/booking";
import { EASE_OUT_EXPO } from "@/lib/cn";
import { formatHour, type Stay } from "@/lib/stays";
import { SiteLink } from "../navigation";
import { StayArt } from "../stay-art";
import { ArrowIcon } from "../ui/bits";

/** Live summary beside the steps: the chosen stay, dates and an estimated total. */
export function BookingSummary({
  stay,
  start,
  end,
  nights,
  guests,
}: {
  stay: Stay | null;
  start: string;
  end: string;
  nights: number;
  guests: Guests;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] bg-sand-soft shadow-[0_30px_80px_-40px_rgba(7,34,25,0.45)] ring-1 ring-jungle/10">
      <div className="relative aspect-[16/10] overflow-hidden bg-jungle">
        <AnimatePresence initial={false}>
          <motion.div
            key={stay?.slug ?? "none"}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          >
            {stay ? (
              <Image src={stay.cover} alt={`${stay.label}, ${stay.name}`} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
            ) : (
              <StayArt tone="lagoon" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-linear-to-t from-jungle-deep/85 to-transparent" />
        <div className="absolute inset-x-5 bottom-4 text-sand">
          <p className="font-display text-2xl leading-tight">{stay ? stay.label : "Your stay"}</p>
          <p className="font-display text-sm text-lagoon-soft italic">{stay ? stay.name : "Choose one in step 2"}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-jungle/10 text-sm">
        <SummaryCell label="Check-in" value={start ? formatLong(start) : "—"} note={`From ${formatHour(stay?.listing.checkInHour ?? 15)}`} />
        <SummaryCell label="Check-out" value={end ? formatLong(end) : "—"} note={`By ${formatHour(stay?.listing.checkOutHour ?? 10)}`} />
        <SummaryCell label="Guests" value={guestsLabel(guests)} />
        <SummaryCell label="Nights" value={nights ? String(nights) : "—"} />
      </dl>

      <div className="p-6">
        {stay && nights > 0 ? (
          <>
            <div className="flex justify-between text-sm text-jungle/70">
              <span>
                {formatMoney(stay.listing.price, stay.listing.currency)} × {nights} {nights === 1 ? "night" : "nights"}
              </span>
              <span>{formatMoney(stay.listing.price * nights, stay.listing.currency)}</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-jungle/10 pt-4">
              <span className="font-semibold">Estimated total</span>
              <motion.span
                key={stay.listing.price * nights}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-3xl"
              >
                {formatMoney(stay.listing.price * nights, stay.listing.currency)}
              </motion.span>
            </div>
            <p className="mt-3 text-xs text-jungle/50">Rates can vary by date. The final price is confirmed with your booking.</p>
          </>
        ) : (
          <p className="text-sm text-jungle/55">Choose your dates and a stay to see the estimated total.</p>
        )}
      </div>
    </div>
  );
}

function SummaryCell({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-sand-soft px-5 py-4">
      <dt className="text-[10px] font-semibold tracking-[0.2em] text-jungle/50 uppercase">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
      {note && <dd className="text-xs text-jungle/50">{note}</dd>}
    </div>
  );
}

/** Shown once the request has gone through. */
export function Confirmation({
  reference,
  stay,
  start,
  end,
  nights,
  guests,
  firstName,
  email,
}: {
  reference: string;
  stay: Stay;
  start: string;
  end: string;
  nights: number;
  guests: Guests;
  firstName: string;
  email: string;
}) {
  const next = [
    "We check availability for your dates and confirm your booking.",
    `Confirmation and payment details go to ${email}.`,
    "Before you travel, read your arrival guide. Your entry code comes with your booking.",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className="mx-auto max-w-3xl overflow-hidden rounded-[32px] bg-sand-soft text-center shadow-[0_30px_80px_-40px_rgba(7,34,25,0.45)] ring-1 ring-jungle/10"
    >
      <div className="px-6 pt-12 pb-10 md:px-12">
        <SuccessMark />
        <p className="mt-8 text-[11px] font-semibold tracking-[0.28em] text-lagoon uppercase">Request sent</p>
        <h2 className="font-display mt-3 text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.02] tracking-tight">
          Thank you, <span className="wonk text-lagoon italic">{firstName}!</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-jungle/65">
          Your request for {stay.label}, {stay.name}, is in. Keep your reference handy.
        </p>
        <p className="mt-6 inline-flex items-center gap-3 rounded-full bg-jungle px-5 py-2.5 font-mono text-sm tracking-[0.2em] text-sand">
          {reference}
        </p>
      </div>

      <dl className="grid gap-px bg-jungle/10 text-left sm:grid-cols-3">
        <SummaryCell label="Dates" value={`${formatLong(start)} → ${formatLong(end)}`} />
        <SummaryCell label="Guests" value={`${guestsLabel(guests)} · ${nights} nights`} />
        <SummaryCell label="Estimated total" value={formatMoney(stay.listing.price * nights, stay.listing.currency)} />
      </dl>

      <div className="px-6 py-10 text-left md:px-12">
        <p className="font-display text-2xl">What happens next</p>
        <ol className="mt-5 space-y-4">
          {next.map((item, i) => (
            <motion.li
              key={item}
              className="flex gap-4"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.12, duration: 0.7, ease: EASE_OUT_EXPO }}
            >
              <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lagoon/15 text-lagoon">{i + 1}</span>
              <span className="pt-1 text-jungle/75">{item}</span>
            </motion.li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <SiteLink
            href={`/stays/${stay.slug}#arrival`}
           
            className="group inline-flex items-center gap-2 rounded-full bg-jungle px-6 py-4 text-sm font-semibold text-sand transition-colors duration-500 hover:bg-lagoon"
          >
            View arrival guide
            <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </SiteLink>
          <SiteLink href="/" className="rounded-full px-6 py-4 text-sm font-semibold ring-1 ring-jungle/25 transition-colors hover:ring-jungle">
            Back to home
          </SiteLink>
        </div>
      </div>
    </motion.div>
  );
}

/** A check that draws itself inside rippling rings. */
function SuccessMark() {
  return (
    <div className="relative mx-auto h-24 w-24">
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border border-lagoon"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: 2.4, delay: 0.4 + ring * 0.6, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-lagoon text-sand-soft"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }} />
        </svg>
      </motion.div>
    </div>
  );
}
