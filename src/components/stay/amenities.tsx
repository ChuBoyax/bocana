"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { EASE_OUT_EXPO } from "@/lib/cn";
import type { Listing } from "@/lib/stays";

const CATEGORY_ORDER = ["Location", "General", "Kitchen & dining", "Bathroom", "Outdoors", "Parking", "Safety", "Policy"];
const PREVIEW = 12;

/** Amenities grouped by category; the first dozen show, the rest expand. */
export function Amenities({ amenities }: { amenities: Listing["amenities"] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...amenities].sort(
    (a, b) => rank(a.category) - rank(b.category) || a.name.localeCompare(b.name),
  );
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW);
  const groups = new Map<string, typeof visible>();
  for (const amenity of visible) groups.set(amenity.category, [...(groups.get(amenity.category) ?? []), amenity]);

  return (
    <div>
      <div className="space-y-10">
        {[...groups].map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] font-semibold tracking-[0.24em] text-jungle/50 uppercase">{category}</p>
            <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <AnimatePresence initial={false}>
                {items.map((amenity) => (
                  <motion.li
                    key={amenity.name}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                    className="flex items-center gap-3 text-[15px]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lagoon/12 text-lagoon">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                    {amenity.name}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>

      {sorted.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-10 rounded-full border border-jungle/25 px-6 py-3 text-sm font-semibold transition-colors duration-500 hover:border-jungle hover:bg-jungle hover:text-sand"
        >
          {expanded ? "Show fewer" : `Show all ${sorted.length} amenities`}
        </button>
      )}
    </div>
  );
}

function rank(category: string) {
  const i = CATEGORY_ORDER.indexOf(category);
  return i < 0 ? CATEGORY_ORDER.length : i;
}
