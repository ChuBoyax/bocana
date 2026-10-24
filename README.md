# La Bocana Bungalows

Redesign of [destinationbocas.com](https://www.destinationbocas.com): Next.js 16 (App Router), Tailwind CSS 4, Motion and Lenis.
Listing data and photos come from the Hostaway booking site at [labocana.holidayfuture.com](https://labocana.holidayfuture.com).

```bash
npm install
npm run dev             # http://localhost:3000
npm run build           # production build
npm run sync:listings   # pull listings + photos from Hostaway
```

## Booking

Booking happens on our own `/book` page, a four-step flow: **Dates → Stay → Details → Review**, then a confirmation.

- The hero search bar (destination, dates, guests) and the card on each stay page link into it with what the guest
  already picked, e.g. `/book?stay=bungalow-2&start=2026-11-10&end=2026-11-14&adults=2`, and the flow skips ahead.
- Prices are estimates from each listing's base nightly rate (`price × nights`).
- Components live in `src/components/booking/*`; helpers, validation and the submit function in `src/lib/booking.ts`.

> **Static for now.** `submitBookingRequest()` in `src/lib/booking.ts` only simulates sending and returns a reference.
> Connect it to a backend (for example a Route Handler that creates the reservation through the Hostaway API, or
> emails the request to the host) before going live, otherwise requests go nowhere.

## Listings and photos

`npm run sync:listings` reads the nine listings from the booking site and writes:

- `src/data/listings.json`: names, guests, bedrooms, bathrooms, base price, rating, description, amenities, photo list
- `public/images/listings/<hostaway id>/NN.jpg`: every photo, resized to 1600px and recompressed

Run it whenever prices, descriptions or photos change in Hostaway, then redeploy. Existing photos are kept; use
`npm run sync:listings -- --force` to download them all again.

What isn't in Hostaway lives in `src/lib/stays.ts`: the short name guests know (e.g. "Bungalow #1"), the one-line
summary, which photo is the cover (`coverPhoto`), and the arrival directions from the old check-in pages.

## Where things live

| What | File |
| --- | --- |
| Stays (curated info + Hostaway data) | `src/lib/stays.ts`, `src/data/listings.json` |
| Address, map pin, nav links, perks, experiences | `src/lib/site.ts` |
| Colours, fonts, keyframes | `src/app/globals.css` (`@theme`) |
| Home sections | `src/components/home/*` |
| Stay page (gallery, booking card, amenities, arrival guide) | `src/app/stays/[slug]/page.tsx`, `src/components/stay/*` |
| Old Wix URLs → new pages | `next.config.ts` (`legacyRedirects`) |

## Palette

Three colours, taken from the place: **jungle** `#0d3b2e`, **lagoon** `#17a39b`, **sand** `#f4ecdd`. Everything else is a tint or shade of these.

## Motion

- The homepage opens on sunset over the bay (`src/components/home/hero.tsx`): `public/images/hero-sunset-wide.webp`,
  or `hero-sunset-tall.webp` on portrait screens (only the one that fits is downloaded). The picture settles in with
  a slow zoom and drifts behind as the page scrolls; the title, tagline and search rise in on load.
- Use `SiteLink` (`src/components/navigation.tsx`) instead of `next/link` for internal links: anchors on the same page glide there with Lenis, anchors on another page are landed on properly. `useNavigate()` does the same from code.
- Smooth scrolling with Lenis. Scroll-driven effects use Motion's `useScroll`/`useTransform`.
- Everything respects `prefers-reduced-motion`.

## Images

Photos are served as AVIF (WebP as fallback) by `next/image`; see `images` in `next.config.ts`.
