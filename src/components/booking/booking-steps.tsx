"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ARRIVAL_WINDOWS,
  destinations,
  formatLong,
  formatMoney,
  guestsLabel,
  nightsBetween,
  type DestinationId,
  type GuestDetails,
  type Guests,
} from "@/lib/booking";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import { formatHour, stayFacts, stays, type Stay } from "@/lib/stays";
import { GuestCounters, PinIcon } from "./fields";
import { RangeCalendar } from "./range-calendar";

export function StepHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-lagoon uppercase">{eyebrow}</p>
      <h2 data-step-heading tabIndex={-1} className="font-display mt-3 text-[clamp(2rem,3.4vw,3rem)] leading-[1.02] tracking-tight outline-none">
        {title}
      </h2>
      {children && <p className="mt-3 max-w-xl text-jungle/65">{children}</p>}
    </div>
  );
}

/* ── 1 · Dates & guests ───────────────────────────────────────────────── */

export function StepDates({
  destination,
  onDestination,
  start,
  end,
  onDates,
  guests,
  onGuests,
  maxGuests,
}: {
  destination: DestinationId;
  onDestination: (id: DestinationId) => void;
  start: string;
  end: string;
  onDates: (start: string, end: string) => void;
  guests: Guests;
  onGuests: (guests: Guests) => void;
  maxGuests: number;
}) {
  const nights = start && end ? nightsBetween(start, end) : 0;

  return (
    <div>
      <StepHeading eyebrow="Step 1 of 4" title="When are you coming?">
        Pick your dates and who&apos;s travelling. Check-in is from 3:00 PM, check-out by 10:00 AM.
      </StepHeading>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold tracking-[0.2em] text-jungle/55 uppercase">Destination</legend>
        <div className="flex flex-wrap gap-2">
          {destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={destination === d.id}
              onClick={() => onDestination(d.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ring-1 transition-colors duration-300",
                destination === d.id ? "bg-jungle text-sand ring-jungle" : "ring-jungle/20 hover:ring-jungle/50",
              )}
            >
              <PinIcon />
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 rounded-[28px] p-5 ring-1 ring-jungle/12 md:p-7">
        <RangeCalendar start={start} end={end} onChange={onDates} months={1} className="mx-auto max-w-md" />
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-[24px] bg-jungle/12 sm:grid-cols-3">
        <DateTile label="Check-in" value={start ? formatLong(start) : "Add date"} note="From 3:00 PM" muted={!start} />
        <DateTile label="Check-out" value={end ? formatLong(end) : "Add date"} note="By 10:00 AM" muted={!end} />
        <DateTile label="Length of stay" value={nights ? `${nights} ${nights === 1 ? "night" : "nights"}` : "—"} note="Choose two dates" muted={!nights} />
      </div>

      <div className="mt-8 rounded-[28px] px-5 py-3 ring-1 ring-jungle/12 md:px-7">
        <GuestCounters guests={guests} max={maxGuests} onChange={onGuests} />
      </div>
    </div>
  );
}

function DateTile({ label, value, note, muted }: { label: string; value: string; note: string; muted: boolean }) {
  return (
    <div className="bg-sand-soft p-5">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-jungle/50 uppercase">{label}</p>
      <p className={cn("font-display mt-1 text-xl", muted && "text-jungle/35")}>{value}</p>
      <p className="mt-0.5 text-xs text-jungle/50">{note}</p>
    </div>
  );
}

/* ── 2 · Choose a stay ────────────────────────────────────────────────── */

export function StepStay({
  selected,
  onSelect,
  nights,
  guests,
  destination,
}: {
  selected: string | null;
  onSelect: (slug: string) => void;
  nights: number;
  guests: Guests;
  destination: DestinationId;
}) {
  const total = guests.adults + guests.children;
  // Every stay is in Bocas Town on Isla Colón, so all destinations match; those that fit come first.
  const sorted = [...stays].sort(
    (a, b) => Number(b.listing.guests >= total) - Number(a.listing.guests >= total) || a.listing.price - b.listing.price,
  );
  const place = destinations.find((d) => d.id === destination)?.label ?? "Bocas del Toro";

  return (
    <div>
      <StepHeading eyebrow="Step 2 of 4" title="Choose your stay">
        {nights} {nights === 1 ? "night" : "nights"} · {guestsLabel(guests)} · {destination === "any" ? "Bocas Town, Isla Colón" : place}
      </StepHeading>

      <div role="radiogroup" aria-label="Stays" className="grid gap-4 sm:grid-cols-2">
        {sorted.map((stay, i) => (
          <StayOption
            key={stay.slug}
            stay={stay}
            index={i}
            nights={nights}
            fits={stay.listing.guests >= total}
            selected={selected === stay.slug}
            onSelect={() => onSelect(stay.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function StayOption({
  stay,
  index,
  nights,
  fits,
  selected,
  onSelect,
}: {
  stay: Stay;
  index: number;
  nights: number;
  fits: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { listing } = stay;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: EASE_OUT_EXPO }}
      className={cn(
        "group relative overflow-hidden rounded-[24px] bg-sand-soft ring-1 transition-[box-shadow,transform] duration-500",
        selected ? "ring-2 ring-lagoon shadow-[0_20px_50px_-25px_rgba(23,163,155,0.7)]" : "ring-jungle/12",
        fits ? "hover:-translate-y-1" : "opacity-55",
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={!fits}
        onClick={onSelect}
        className="block w-full text-left disabled:cursor-not-allowed"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={stay.cover}
            alt={`${stay.label}, ${stay.name}`}
            fill
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105"
          />
          <span
            className={cn(
              "absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500",
              selected ? "scale-100 bg-lagoon text-sand-soft" : "scale-90 bg-sand/85 text-transparent ring-1 ring-jungle/15",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          {!fits && (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-jungle-deep/80 px-3 py-1.5 text-center text-xs font-semibold text-sand backdrop-blur">
              Sleeps up to {listing.guests}
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl leading-tight">{stay.label}</h3>
            <p className="shrink-0 text-sm text-jungle/60">
              <span className="font-display text-xl text-jungle">{formatMoney(listing.price, listing.currency)}</span> / night
            </p>
          </div>
          <p className="font-display text-sm text-lagoon italic">{stay.name}</p>
          <p className="mt-3 text-xs text-jungle/55">{stayFacts(listing)}</p>
          {nights > 0 && (
            <p className="mt-3 border-t border-jungle/10 pt-3 text-sm">
              <span className="font-semibold">{formatMoney(listing.price * nights, listing.currency)}</span>
              <span className="text-jungle/55"> estimated for {nights} {nights === 1 ? "night" : "nights"}</span>
            </p>
          )}
        </div>
      </button>
      <a
        href={`/stays/${stay.slug}`}
        target="_blank"
        rel="noreferrer"
        className="absolute top-3 left-3 rounded-full bg-sand/90 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-jungle uppercase opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
      >
        Photos & details ↗
      </a>
    </motion.div>
  );
}

/* ── 3 · Guest details ────────────────────────────────────────────────── */

export function StepDetails({
  details,
  errors,
  onChange,
}: {
  details: GuestDetails;
  errors: Partial<Record<keyof GuestDetails, string>>;
  onChange: (details: GuestDetails) => void;
}) {
  const set = (key: keyof GuestDetails) => (value: string) => onChange({ ...details, [key]: value });

  return (
    <div>
      <StepHeading eyebrow="Step 3 of 4" title="Who's checking in?">
        We&apos;ll use these details for your booking and to send your arrival information.
      </StepHeading>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName}>
          <input autoComplete="given-name" value={details.firstName} onChange={(e) => set("firstName")(e.target.value)} />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <input autoComplete="family-name" value={details.lastName} onChange={(e) => set("lastName")(e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" inputMode="email" value={details.email} onChange={(e) => set("email")(e.target.value)} />
        </Field>
        <Field label="Phone / WhatsApp" error={errors.phone}>
          <input type="tel" autoComplete="tel" inputMode="tel" placeholder="+1 555 123 4567" value={details.phone} onChange={(e) => set("phone")(e.target.value)} />
        </Field>
        <Field label="Country" error={errors.country}>
          <input autoComplete="country-name" value={details.country} onChange={(e) => set("country")(e.target.value)} />
        </Field>
        <Field label="Estimated arrival">
          <select value={details.arrival} onChange={(e) => set("arrival")(e.target.value)}>
            {ARRIVAL_WINDOWS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </Field>
        <Field label="Special requests (optional)" className="sm:col-span-2">
          <textarea
            rows={4}
            placeholder="Celebrating something? Need a water taxi or a tour arranged? Let us know."
            value={details.requests}
            onChange={(e) => set("requests")(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-semibold tracking-[0.16em] text-jungle/60 uppercase">{label}</span>
      <span
        className={cn(
          "mt-2 block rounded-2xl bg-sand-soft ring-1 transition-shadow duration-300 focus-within:ring-2 focus-within:ring-lagoon",
          error ? "ring-red-700/60" : "ring-jungle/15",
          "[&>*]:w-full [&>*]:resize-none [&>*]:bg-transparent [&>*]:px-4 [&>*]:py-3.5 [&>*]:text-base [&>*]:outline-none [&>*]:placeholder:text-jungle/35",
        )}
      >
        {children}
      </span>
      {error && (
        <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 block text-sm text-red-700">
          {error}
        </motion.span>
      )}
    </label>
  );
}

/* ── 4 · Review ───────────────────────────────────────────────────────── */

export function StepReview({
  stay,
  start,
  end,
  guests,
  details,
  confirmed,
  onConfirm,
  onEdit,
}: {
  stay: Stay;
  start: string;
  end: string;
  guests: Guests;
  details: GuestDetails;
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
  onEdit: (step: number) => void;
}) {
  const hasLuggageDrop = stay.listing.amenities.some((a) => a.name.toLowerCase().includes("luggage"));

  return (
    <div>
      <StepHeading eyebrow="Step 4 of 4" title="Review your request">
        Check everything over. Nothing is charged until your booking is confirmed.
      </StepHeading>

      <div className="divide-y divide-jungle/10 rounded-[24px] ring-1 ring-jungle/12">
        <ReviewRow title="Stay" onEdit={() => onEdit(1)}>
          <div className="flex items-center gap-4">
            <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image src={stay.cover} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span>
              <span className="font-display block text-xl">{stay.label}</span>
              <span className="block text-sm text-jungle/60">{stay.name}</span>
            </span>
          </div>
        </ReviewRow>
        <ReviewRow title="Dates" onEdit={() => onEdit(0)}>
          <p>
            {formatLong(start)} → {formatLong(end)}
          </p>
          <p className="text-sm text-jungle/60">
            {nightsBetween(start, end)} nights · check-in from {formatHour(stay.listing.checkInHour)}, check-out by{" "}
            {formatHour(stay.listing.checkOutHour)}
          </p>
        </ReviewRow>
        <ReviewRow title="Guests" onEdit={() => onEdit(0)}>
          <p>{guestsLabel(guests)}</p>
        </ReviewRow>
        <ReviewRow title="Your details" onEdit={() => onEdit(2)}>
          <p>
            {details.firstName} {details.lastName}
          </p>
          <p className="text-sm text-jungle/60">
            {details.email} · {details.phone} · {details.country}
          </p>
          <p className="text-sm text-jungle/60">Estimated arrival: {details.arrival}</p>
          {details.requests && <p className="mt-1 text-sm text-jungle/60 italic">“{details.requests}”</p>}
        </ReviewRow>
      </div>

      <div className="mt-6 rounded-[24px] bg-jungle p-6 text-sand md:p-7">
        <p className="font-display text-xl">Good to know</p>
        <ul className="mt-3 space-y-2 text-sm text-sand/80">
          <li>· Self check-in with keypad locks. Your entry code comes with your booking.</li>
          {hasLuggageDrop && <li>· Arriving early? Luggage drop-off is allowed.</li>}
          <li>· Staff are on site during the day most days, and happy to arrange tours and water taxis.</li>
        </ul>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirm(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-lagoon"
        />
        <span className="text-sm text-jungle/75">I&apos;ve checked my dates and details, and I&apos;d like to request this booking.</span>
      </label>
    </div>
  );
}

function ReviewRow({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 md:p-6">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-jungle/50 uppercase">{title}</p>
        {children}
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold text-lagoon underline-offset-4 hover:underline">
        Edit
      </button>
    </div>
  );
}
