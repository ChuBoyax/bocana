"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { addDays, isoDate, nightsBetween, parseIso } from "@/lib/booking";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import { ArrowIcon } from "../ui/bits";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const noop = () => () => {};

/** Today's date, read on the client only so prerendered HTML stays static. */
export function useToday() {
  return useSyncExternalStore(noop, () => isoDate(new Date()), () => "");
}

type RangeCalendarProps = {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  months?: 1 | 2;
  className?: string;
};

/**
 * Pick a check-in then a check-out. Past days are disabled, the stay is
 * shaded as a band, and hovering previews the range before the second click.
 */
export function RangeCalendar({ start, end, onChange, months = 2, className }: RangeCalendarProps) {
  const today = useToday();
  const anchor = start || today || isoDate(new Date());
  const [view, setView] = useState(() => {
    const d = parseIso(anchor);
    return { year: d.getFullYear(), month: d.getMonth(), direction: 0 };
  });
  const [hover, setHover] = useState<string | null>(null);

  const thisMonth = today ? parseIso(today) : null;
  const atFirstMonth = thisMonth ? view.year === thisMonth.getFullYear() && view.month === thisMonth.getMonth() : false;

  function shift(step: number) {
    setView(({ year, month }) => {
      const d = new Date(year, month + step, 1);
      return { year: d.getFullYear(), month: d.getMonth(), direction: step };
    });
  }

  function pick(day: string) {
    if (!start || end || day <= start) onChange(day, "");
    else onChange(start, day);
  }

  // While choosing the check-out, preview the band up to the hovered day.
  const rangeEnd = end || (start && hover && hover > start ? hover : "");

  return (
    <div className={cn("select-none", className)}>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atFirstMonth}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-jungle/8 disabled:opacity-25"
        >
          <ArrowIcon direction="left" className="h-4 w-4" />
        </button>
        <p className="text-xs font-semibold tracking-[0.2em] text-jungle/55 uppercase" aria-live="polite">
          {start && end
            ? `${nightsBetween(start, end)} nights selected`
            : start
              ? "Now choose your check-out"
              : "Choose your check-in"}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-jungle/8"
        >
          <ArrowIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={view.direction}>
          <motion.div
            key={`${view.year}-${view.month}`}
            custom={view.direction}
            className={cn("grid gap-8", months === 2 && "md:grid-cols-2")}
            initial={{ opacity: 0, x: view.direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view.direction * -40 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          >
            {Array.from({ length: months }, (_, i) => (
              <Month
                key={i}
                year={view.year}
                month={view.month + i}
                today={today}
                start={start}
                end={rangeEnd}
                onPick={pick}
                onHover={setHover}
                className={i === 1 ? "hidden md:block" : undefined}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Month({
  year,
  month,
  today,
  start,
  end,
  onPick,
  onHover,
  className,
}: {
  year: number;
  month: number;
  today: string;
  start: string;
  end: string;
  onPick: (day: string) => void;
  onHover: (day: string | null) => void;
  className?: string;
}) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const firstIso = isoDate(first);
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(firstIso, i));

  return (
    <div className={className} onPointerLeave={() => onHover(null)}>
      <p className="font-display mb-3 text-center text-lg">
        {first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold tracking-wider text-jungle/45">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: first.getDay() }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const disabled = Boolean(today) && day < today;
          const isStart = day === start;
          const isEnd = day === end;
          const inRange = Boolean(start && end) && day > start && day < end;
          const edge = isStart || isEnd;
          return (
            <div key={day} className={cn("relative flex h-11 items-center justify-center", inRange && "bg-lagoon/15")}>
              {/* Half band so the range runs into the round start/end markers. */}
              {isStart && end && <span className="absolute inset-y-0 right-0 left-1/2 bg-lagoon/15" />}
              {isEnd && start && <span className="absolute inset-y-0 right-1/2 left-0 bg-lagoon/15" />}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(day)}
                onPointerEnter={() => onHover(day)}
                aria-pressed={edge}
                aria-label={parseIso(day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200",
                  edge ? "bg-jungle text-sand" : "hover:ring-1 hover:ring-jungle/40",
                  disabled && "cursor-not-allowed text-jungle/25 line-through hover:ring-0",
                )}
              >
                {parseIso(day).getDate()}
                {day === today && !edge && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-lagoon" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
