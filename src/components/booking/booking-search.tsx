"use client";

import { useCallback, useState } from "react";
import {
  bookingHref,
  destinations,
  formatShort,
  guestsLabel,
  MAX_GUESTS,
  nightsBetween,
  type DestinationId,
  type Guests,
} from "@/lib/booking";
import { cn } from "@/lib/cn";
import type { Stay } from "@/lib/stays";
import { useNavigate } from "../navigation";
import { ArrowIcon } from "../ui/bits";
import { CalendarIcon, DestinationList, FieldButton, GuestCounters, GuestsIcon, PinIcon } from "./fields";
import { Popover } from "./popover";
import { RangeCalendar } from "./range-calendar";

type Panel = "destination" | "dates" | "guests" | null;

function useSearchState(maxGuests: number) {
  const [panel, setPanel] = useState<Panel>(null);
  const [destination, setDestination] = useState<DestinationId>("any");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [guests, setGuests] = useState<Guests>({ adults: Math.min(2, maxGuests), children: 0 });
  const close = useCallback(() => setPanel(null), []);
  const toggle = (next: Exclude<Panel, null>) => setPanel((current) => (current === next ? null : next));

  function pickDates(start: string, end: string) {
    setDates({ start, end });
    // Both picked: let the range settle on screen, then close.
    if (start && end) setTimeout(close, 450);
  }

  return { panel, close, toggle, destination, setDestination, dates, pickDates, guests, setGuests };
}

/** Hero search: destination, dates and guests, then on into the booking steps. */
export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const s = useSearchState(MAX_GUESTS);
  const destination = destinations.find((d) => d.id === s.destination);

  function search() {
    navigate(
      bookingHref({ destination: s.destination, ...s.dates, adults: s.guests.adults, children: s.guests.children }));
  }

  return (
    // Frosted glass over the film: the scene shows through, softened, so the bar belongs to it.
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-jungle-deep/40 p-2 text-sand shadow-[0_30px_80px_-30px_rgba(4,20,15,0.9),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-sand/25 backdrop-blur-2xl backdrop-saturate-150 [text-shadow:none] [&>*]:shrink-0",
        className,
      )}
    >
      <Popover
        open={s.panel === "destination"}
        onClose={s.close}
        placement="top"
        panelClassName="w-80"
        trigger={
          <FieldButton
            label="Destination"
            placeholder="Select a place"
            value={s.destination === "any" ? undefined : destination?.label}
            icon={<PinIcon />}
            active={s.panel === "destination"}
            onClick={() => s.toggle("destination")}
            className="w-48"
            tone="glass"
          />
        }
      >
        <DestinationList
          value={s.destination}
          onChange={(id) => {
            s.setDestination(id);
            s.close();
          }}
        />
      </Popover>

      <Divider />

      <Popover
        open={s.panel === "dates"}
        onClose={s.close}
        placement="top"
        panelClassName="w-[680px]"
        trigger={
          <div className="flex">
            <FieldButton
              label="Check-in"
              placeholder="Add date"
              value={s.dates.start ? formatShort(s.dates.start) : undefined}
              icon={<CalendarIcon />}
              active={s.panel === "dates"}
              onClick={() => s.toggle("dates")}
              className="w-40"
              tone="glass"
            />
            <FieldButton
              label="Check-out"
              placeholder="Add date"
              value={s.dates.end ? formatShort(s.dates.end) : undefined}
              icon={<CalendarIcon />}
              active={s.panel === "dates"}
              onClick={() => s.toggle("dates")}
              className="w-40"
              tone="glass"
            />
          </div>
        }
      >
        <RangeCalendar start={s.dates.start} end={s.dates.end} onChange={s.pickDates} />
      </Popover>

      <Divider />

      <Popover
        open={s.panel === "guests"}
        onClose={s.close}
        placement="top"
        align="end"
        panelClassName="w-80"
        trigger={
          <FieldButton
            label="Guests"
            placeholder="Add guests"
            value={guestsLabel(s.guests)}
            icon={<GuestsIcon />}
            active={s.panel === "guests"}
            onClick={() => s.toggle("guests")}
            className="w-44"
            tone="glass"
          />
        }
      >
        <GuestCounters guests={s.guests} max={MAX_GUESTS} onChange={s.setGuests} />
      </Popover>

      <button
        type="button"
        onClick={search}
        className="group ml-1 inline-flex h-14 items-center gap-2 rounded-full bg-lagoon px-7 text-sm font-semibold text-sand-soft shadow-[0_10px_30px_-10px_rgba(23,163,155,0.8)] transition-colors duration-500 hover:bg-sand hover:text-jungle"
      >
        Search
        <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      </button>
    </div>
  );
}

/** Stay page: dates and guests for this stay, then into the booking steps with it chosen. */
export function StaySearch({ stay }: { stay: Stay }) {
  const navigate = useNavigate();
  const max = stay.listing.guests;
  const s = useSearchState(max);
  const nights = s.dates.start && s.dates.end ? nightsBetween(s.dates.start, s.dates.end) : 0;

  function reserve() {
    navigate(
      bookingHref({ stay: stay.slug, ...s.dates, adults: s.guests.adults, children: s.guests.children }));
  }

  return (
    <div className="flex flex-col gap-3">
      <Popover
        open={s.panel === "dates"}
        onClose={s.close}
        align="end"
        panelClassName="w-[min(360px,calc(100vw-48px))]"
        trigger={
          <div className="grid grid-cols-2 rounded-[22px] p-1 ring-1 ring-jungle/15">
            <FieldButton
              label="Check-in"
              placeholder="Add date"
              value={s.dates.start ? formatShort(s.dates.start) : undefined}
              icon={<CalendarIcon />}
              active={s.panel === "dates"}
              onClick={() => s.toggle("dates")}
              className="rounded-[18px]"
            />
            <FieldButton
              label="Check-out"
              placeholder="Add date"
              value={s.dates.end ? formatShort(s.dates.end) : undefined}
              icon={<CalendarIcon />}
              active={s.panel === "dates"}
              onClick={() => s.toggle("dates")}
              className="rounded-[18px]"
            />
          </div>
        }
      >
        <RangeCalendar start={s.dates.start} end={s.dates.end} onChange={s.pickDates} months={1} />
      </Popover>

      <Popover
        open={s.panel === "guests"}
        onClose={s.close}
        align="end"
        panelClassName="w-[min(340px,calc(100vw-48px))]"
        trigger={
          <div className="rounded-[22px] p-1 ring-1 ring-jungle/15">
            <FieldButton
              label="Guests"
              placeholder="Add guests"
              value={guestsLabel(s.guests)}
              icon={<GuestsIcon />}
              active={s.panel === "guests"}
              onClick={() => s.toggle("guests")}
              className="rounded-[18px]"
            />
          </div>
        }
      >
        <GuestCounters guests={s.guests} max={max} onChange={s.setGuests} />
      </Popover>

      <button
        type="button"
        onClick={reserve}
        className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lagoon px-6 py-4 text-base font-semibold text-sand-soft transition-colors duration-500 hover:bg-jungle"
      >
        Reserve
        <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      </button>
      <p className="text-center text-xs text-jungle/55">
        {nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"} · ` : ""}You won&apos;t be charged yet.
      </p>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="h-8 w-px shrink-0 bg-sand/20" />;
}
