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

- The homepage opens with a scroll-driven 3D film rendered live with three.js: dawn over the water, past sailboats
  and jungle islands, then a turn in the golden afternoon light to reveal the bungalows, with surfers riding the reef
  break in front of them. No video or model files: everything is generated in code (see below). The only texture
  file is the ripple normal map `public/textures/waternormals.jpg`, from the three.js examples (MIT).
  The overlay (chapter words, then title and search) is
  `src/components/home/hero-film.tsx`. three.js loads only in the browser; without WebGL, or with reduced motion,
  the waterfront photo is shown instead.
- Use `SiteLink` (`src/components/navigation.tsx`) instead of `next/link` for internal links: anchors on the same page glide there with Lenis, anchors on another page are landed on properly. `useNavigate()` does the same from code.
- Smooth scrolling with Lenis. Scroll-driven effects use Motion's `useScroll`/`useTransform`.
- Everything respects `prefers-reduced-motion`.

### The 3D film (`src/components/home/ocean/`)

| To change… | Edit |
| --- | --- |
| Time of day, camera shots, mountain ranges, where boats, taxis, the surf and the cay are | `config.ts` (data only) |
| Speed vs. looks per device (pixel ratio, shadows, reflection size, terrain detail, how many people) | `quality.ts` |
| The bungalows' layout, guests on the deck | `waterfront.ts` |
| How a bungalow is built (floors, verandas, roofs, windows) | `architecture.ts` (`bungalow()`) |
| Paint, roofs, trim, foliage and the wind in the trees | `materials.ts` |
| Palms and rainforest / the island's shape | `vegetation.ts` / `island.ts` |
| Mountains on the horizon | `landscape.ts` |
| The wave and the surfers / people who move about / figures and poses | `surf.ts` / `islanders.ts` / `people.ts` |
| Sailboats and water taxis | `boats.ts` |

`ocean-scene.ts` puts it together and runs the frame loop; `timeline.ts` turns film progress into light and a
camera position; `textures.ts` paints the textures on canvases; `utils.ts` has noise, `bake()` and helpers.

Keeping it light:

- The scene is built a step at a time (`breathe()` between steps) and its shaders are compiled before the first
  frame, so the page keeps scrolling smoothly while it loads.
- Static things are baked into one mesh per material (`bake()`): every bungalow, the deck, and each boat.
- The breaking wave is shaped and coloured in its vertex shader; nothing is recomputed on the CPU per frame.
- People, spray and the surf are left out of the water's reflection pass (`NO_REFLECTION` layer) and out of the
  shadow map, and are only animated and drawn once the camera is within `LIFE_DISTANCE` of them.
- `AdaptiveResolution` lowers the pixel ratio when frames drop below about 45 fps, and raises it again when
  there's headroom. Shadows are re-rendered only when the sun moves; the film stops rendering when it's off screen.
- Photos are served as AVIF (WebP as fallback) by `next/image`; see `images` in `next.config.ts`.
- Until the scene is ready, a poster of its first frame is shown (`public/images/film-poster-wide.jpg` and
  `film-poster-tall.jpg` for portrait screens), and the live scene fades in over it. If the opening shot or light
  changes, capture new posters from the running film with the page's overlays hidden.
