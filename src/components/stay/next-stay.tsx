"use client";

import type { Stay } from "@/lib/stays";
import { SiteLink } from "../navigation";
import { StayMedia } from "../stay-art";
import { ArrowIcon } from "../ui/bits";

/** Hovering wipes the next stay's scene up from below the title. */
export function NextStay({ stay }: { stay: Stay }) {
  return (
    <section className="bg-sand px-3 pb-3 md:px-6 md:pb-6">
      <SiteLink
        href={`/stays/${stay.slug}`}
        className="group relative block overflow-hidden rounded-[32px] bg-jungle px-6 py-16 text-sand md:px-12 md:py-24"
      >
        <div className="absolute inset-0 [clip-path:inset(100%_0_0_0)] transition-[clip-path] duration-[1.1s] ease-in-out-quart group-hover:[clip-path:inset(0_0_0_0)]">
          <StayMedia stay={stay} sizes="100vw" />
          <div className="absolute inset-0 bg-jungle-deep/40" />
        </div>

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-sand/70 uppercase">Next stay</p>
            <p className="font-display mt-4 text-[clamp(3rem,9vw,8rem)] leading-[0.88] tracking-tight transition-transform duration-1000 ease-out-expo group-hover:translate-x-3">
              {stay.label}
            </p>
            <p className="font-display wonk mt-3 text-xl text-lagoon-soft italic md:text-2xl">{stay.name}</p>
          </div>
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sand text-jungle transition-all duration-700 ease-out-expo group-hover:-rotate-45 group-hover:bg-lagoon group-hover:text-sand md:h-28 md:w-28">
            <ArrowIcon className="h-6 w-6" />
          </span>
        </div>
      </SiteLink>
    </section>
  );
}
