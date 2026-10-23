import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapFrame } from "@/components/map-frame";
import { Amenities } from "@/components/stay/amenities";
import { BookingCard, MobileBookBar } from "@/components/stay/booking-panel";
import { Gallery } from "@/components/stay/gallery";
import { NextStay } from "@/components/stay/next-stay";
import { StayHero } from "@/components/stay/stay-hero";
import { ArrowIcon, Reveal, SectionLabel } from "@/components/ui/bits";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { RevealText } from "@/components/ui/reveal-text";
import { site } from "@/lib/site";
import { formatHour, getNextStay, getStay, stays } from "@/lib/stays";

export function generateStaticParams() {
  return stays.map((stay) => ({ slug: stay.slug }));
}

export async function generateMetadata({ params }: PageProps<"/stays/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const stay = getStay(slug);
  if (!stay) return {};
  return {
    title: `${stay.label} · ${stay.name}`,
    description: `${stay.summary} Book direct at La Bocana Bungalows, ${site.city}.`,
    openGraph: { images: [stay.cover] },
  };
}

/** Editorial, off-grid placement for the three arrival photos. */
const photoLayout = [
  { cell: "md:col-span-7", frame: "aspect-[4/3]" },
  { cell: "md:col-span-5 md:mt-40", frame: "aspect-[4/5]" },
  { cell: "md:col-span-8 md:col-start-3", frame: "aspect-[16/10]" },
];

export default async function StayPage({ params }: PageProps<"/stays/[slug]">) {
  const { slug } = await params;
  const stay = getStay(slug);
  if (!stay) notFound();
  const next = getNextStay(slug);
  const { listing } = stay;

  const facts = [
    { label: "Guests", value: listing.guests },
    { label: listing.bedrooms === 1 ? "Bedroom" : "Bedrooms", value: listing.bedrooms },
    { label: listing.bathrooms === 1 ? "Bathroom" : "Bathrooms", value: listing.bathrooms },
    ...(listing.beds > 0 ? [{ label: listing.beds === 1 ? "Bed" : "Beds", value: listing.beds }] : []),
  ];

  return (
    <>
      <StayHero stay={stay} />

      <section className="bg-sand px-5 pt-5 md:px-10 md:pt-10">
        <div className="mx-auto max-w-[1400px]">
          <Gallery images={stay.gallery} title={`${stay.label} · ${stay.name}`} />
        </div>
      </section>

      <section className="bg-sand px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionLabel index="01">The stay</SectionLabel>
            <RevealText
              as="p"
              text={stay.summary}
              className="font-display mt-6 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] tracking-tight"
              stagger={0.03}
            />

            <dl className="mt-10 flex flex-wrap gap-px overflow-hidden rounded-[24px] bg-jungle/10">
              {facts.map((fact) => (
                <div key={fact.label} className="flex min-w-[calc(50%-1px)] flex-1 flex-col bg-sand p-5 sm:min-w-0">
                  <dt className="order-2 text-xs font-semibold tracking-[0.18em] text-jungle/55 uppercase">{fact.label}</dt>
                  <dd className="font-display text-4xl leading-none">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-12 space-y-5 text-[17px] leading-relaxed text-jungle/80">
              {stay.description.map((paragraph, i) => (
                <Reveal key={i} y={20} delay={Math.min(i, 3) * 0.05}>
                  <p>{paragraph}</p>
                </Reveal>
              ))}
            </div>

            <div className="mt-16 border-t border-jungle/15 pt-12">
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">What this place offers</h2>
              <div className="mt-8">
                <Amenities amenities={listing.amenities} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <BookingCard stay={stay} />
            </div>
          </aside>
        </div>
      </section>

      <section id="arrival" className="bg-sand px-5 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto max-w-[1400px] border-t border-jungle/15 pt-16 md:pt-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-3 md:pt-4">
              <SectionLabel index="02">Arrival guide</SectionLabel>
            </div>
            <div className="md:col-span-9">
              <RevealText
                text="Everything you need to find your way *in.*"
                className="font-display text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.95] tracking-tight"
              />
              <Reveal delay={0.15}>
                <p className="mt-8 max-w-2xl text-lg text-jungle/70">
                  Self check-in from {formatHour(listing.checkInHour)}, check-out by {formatHour(listing.checkOutHour)}. Below is a
                  map and photos to help you find {stay.unit}.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="mt-10 flex max-w-2xl gap-5 rounded-[24px] bg-jungle p-6 text-sand md:p-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lagoon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" aria-hidden>
                      <circle cx="8" cy="15" r="4" />
                      <path d="M11 12l9-9M17 6l3 3M14 9l2 2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-2xl">Entry codes</p>
                    <p className="mt-2 text-sand/75">
                      Please refer to your application for the entry codes, as we change these frequently.
                    </p>
                  </div>
                </div>
              </Reveal>

              <ol className="mt-14 border-t border-jungle/15">
                {stay.directions.map((direction, i) => (
                  <Reveal key={direction} delay={i * 0.08} y={24}>
                    <li className="group flex items-baseline gap-6 border-b border-jungle/15 py-6 md:gap-10 md:py-7">
                      <span className="font-display w-10 shrink-0 text-lg text-lagoon italic">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-display text-[clamp(1.5rem,2.8vw,2.5rem)] leading-tight tracking-tight transition-transform duration-700 ease-out-expo group-hover:translate-x-2">
                        {direction}
                      </span>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-12 md:gap-8">
            {stay.arrivalPhotos.map((photo, i) => (
              <Reveal key={photo.src} className={photoLayout[i % photoLayout.length].cell}>
                <figure>
                  <ParallaxImage
                    src={photo.src}
                    alt={photo.alt}
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className={`rounded-[28px] ${photoLayout[i % photoLayout.length].frame}`}
                  />
                  <figcaption className="mt-4 flex items-baseline gap-4 text-sm text-jungle/70">
                    <span className="font-display text-base text-lagoon italic">{String(i + 1).padStart(2, "0")}</span>
                    {photo.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand px-5 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionLabel index="03">Map</SectionLabel>
            <address className="font-display mt-8 text-3xl leading-snug not-italic">
              {site.street}
              <br />
              <span className="text-jungle/60">{site.city}</span>
            </address>
            <a
              href={site.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-jungle px-6 py-4 text-sm font-semibold text-sand transition-colors duration-500 hover:bg-lagoon"
            >
              Get directions
              <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </a>
          </div>
          <MapFrame className="h-[55svh] min-h-[360px] md:col-span-8" />
        </div>
      </section>

      <NextStay stay={next} />
      <MobileBookBar stay={stay} />
    </>
  );
}
