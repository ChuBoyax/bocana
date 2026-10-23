import { site } from "@/lib/site";
import { MapFrame } from "../map-frame";
import { ArrowIcon, Reveal, SectionLabel } from "../ui/bits";
import { Magnetic } from "../ui/magnetic";
import { RevealText } from "../ui/reveal-text";

const landmarks = [
  "Across the street from the park",
  "Southern end of 5th Street",
  "Walk to restaurants and groceries",
  "2 minutes by taxi from the airport",
];

export function Location() {
  return (
    <section id="location" className="bg-sand px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1400px] gap-14 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          <SectionLabel index="06">Location</SectionLabel>
          <RevealText
            text="Right in town, on the *quiet* end."
            className="font-display mt-6 text-[clamp(2.6rem,5vw,4.75rem)] leading-[0.95] tracking-tight"
          />

          <Reveal delay={0.15}>
            <address className="font-display mt-10 text-2xl leading-snug not-italic md:text-3xl">
              {site.street}
              <br />
              <span className="text-jungle/60">{site.city}</span>
            </address>
          </Reveal>

          <ul className="mt-10 border-t border-jungle/15">
            {landmarks.map((item, i) => (
              <Reveal key={item} delay={0.2 + i * 0.08} y={20}>
                <li className="flex items-center justify-between border-b border-jungle/15 py-4 text-base">
                  {item}
                  <span className="font-display text-sm text-lagoon italic">0{i + 1}</span>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.4} className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href={site.directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-jungle px-6 py-4 text-sm font-semibold text-sand transition-colors duration-500 hover:bg-lagoon"
              >
                Get directions
                <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </a>
            </Magnetic>
            <a
              href={site.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-jungle/25 px-6 py-4 text-sm font-semibold transition-colors duration-500 hover:border-jungle"
            >
              Open in Google Maps
            </a>
          </Reveal>
        </div>

        <MapFrame className="h-[60svh] min-h-[380px] md:col-span-7 md:h-auto" />
      </div>
    </section>
  );
}
