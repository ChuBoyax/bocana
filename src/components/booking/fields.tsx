"use client";

import type { ReactNode } from "react";
import { destinations, MAX_GUESTS, type DestinationId, type Guests } from "@/lib/booking";
import { cn } from "@/lib/cn";

/** − 2 + */
export function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const button =
    "flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-jungle/20 text-lg transition-colors hover:bg-jungle hover:text-sand hover:ring-jungle disabled:pointer-events-none disabled:opacity-25";
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-jungle/55">{hint}</p>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
          −
        </button>
        <span className="font-display w-6 text-center text-2xl tabular-nums" aria-live="polite">
          {value}
        </span>
        <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}

/** Adults and children, capped at `max` together. */
export function GuestCounters({ guests, max, onChange }: { guests: Guests; max: number; onChange: (guests: Guests) => void }) {
  const total = guests.adults + guests.children;
  return (
    <div className="divide-y divide-jungle/10">
      <Counter
        label="Adults"
        hint="Ages 13 and up"
        value={guests.adults}
        min={1}
        max={guests.adults + (max - total)}
        onChange={(adults) => onChange({ ...guests, adults })}
      />
      <Counter
        label="Children"
        hint="Ages 2 to 12"
        value={guests.children}
        min={0}
        max={guests.children + (max - total)}
        onChange={(children) => onChange({ ...guests, children })}
      />
      <p className="pt-3 text-xs text-jungle/55">
        {max === MAX_GUESTS ? `Our largest stay sleeps ${max}.` : `This stay sleeps up to ${max}.`}
      </p>
    </div>
  );
}

export function DestinationList({ value, onChange }: { value: DestinationId; onChange: (id: DestinationId) => void }) {
  return (
    <ul role="listbox" aria-label="Destination" className="flex flex-col gap-1">
      {destinations.map((destination) => {
        const selected = destination.id === value;
        return (
          <li key={destination.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(destination.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors",
                selected ? "bg-jungle text-sand" : "hover:bg-jungle/6",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  selected ? "bg-lagoon text-sand-soft" : "bg-lagoon/12 text-lagoon",
                )}
              >
                <PinIcon />
              </span>
              <span>
                <span className={cn("block font-semibold", destination.id === "any" && "font-display italic")}>{destination.label}</span>
                <span className={cn("block text-sm", selected ? "text-sand/65" : "text-jungle/55")}>{destination.hint}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** A labelled trigger used in the search bar and booking card. `glass` is for sitting on frosted glass over a picture. */
export function FieldButton({
  label,
  value,
  placeholder,
  icon,
  active,
  onClick,
  className,
  tone = "light",
}: {
  label: string;
  value?: string;
  placeholder: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
  className?: string;
  tone?: "light" | "glass";
}) {
  const glass = tone === "glass";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={cn(
        "group flex w-full items-center gap-3 rounded-full px-3 py-2 text-left transition-colors duration-300",
        glass ? (active ? "bg-sand/15" : "hover:bg-sand/10") : active ? "bg-jungle/8" : "hover:bg-jungle/5",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 group-hover:bg-lagoon group-hover:text-sand-soft",
          glass ? "bg-sand/12 text-lagoon-soft ring-1 ring-sand/15" : "bg-lagoon/12 text-lagoon",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 whitespace-nowrap">
        <span className={cn("block text-xs font-semibold", glass ? "tracking-wide text-sand" : "text-jungle")}>{label}</span>
        <span className={cn("block truncate text-sm", glass ? (value ? "text-sand-soft" : "text-sand/70") : value ? "text-jungle" : "text-jungle/50")}>
          {value || placeholder}
        </span>
      </span>
    </button>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-[18px] w-[18px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l7 3v5.5c0 4.3-2.9 7.9-7 9.5-4.1-1.6-7-5.2-7-9.5V6l7-3Z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M11 12.5l8.5-8.5M16.5 7l2.5 2.5M14.5 9l2 2" />
    </svg>
  );
}

export function BoatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v12M12 4.5l6 9.5h-6M3.5 17.5h17l-2.2 3H5.7z" />
    </svg>
  );
}

export function WifiIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4 4 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function GuestsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
    </svg>
  );
}
