#!/usr/bin/env node
/**
 * Pulls the live listings from the Hostaway booking site into the project:
 *   - src/data/listings.json          (details, amenities, prices, photo list)
 *   - public/images/listings/<id>/    (photos, resized and recompressed)
 *
 * Run after changing listings in Hostaway:  npm run sync:listings
 * Photos already on disk are kept; pass --force to download them again.
 *
 * The booking site has no public API, so this reads the data its pages are
 * rendered from. If Hostaway changes their page format this may need updating;
 * the generated JSON can always be edited by hand in the meantime.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BOOKING_SITE = "https://labocana.holidayfuture.com";
const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_FILE = path.join(ROOT, "src/data/listings.json");
const IMAGE_DIR = path.join(ROOT, "public/images/listings");
const MAX_EDGE = 1600;
const force = process.argv.includes("--force");

async function getText(url) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (La Bocana listing sync)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** Joins the React Server Components payload chunks embedded in a Next.js page. */
function flightPayload(html) {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let out = "";
  for (const match of html.matchAll(re)) out += JSON.parse(match[1]);
  return out;
}

/** Parses the JSON object that starts at `start` in `text`. */
function objectAt(text, start) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error("Unbalanced JSON object");
}

/** Long strings are stored as separate "<id>:T<hex byte length>,<text>" rows, referenced as "$<id>". */
function resolveText(payload, value) {
  if (typeof value !== "string" || !/^\$[0-9a-f]+$/.test(value)) return value;
  const id = value.slice(1);
  // Rows aren't always newline-separated (a text row has no terminator), so match on a non-hex boundary.
  const match = new RegExp(`(?:^|[^0-9a-f])${id}:T([0-9a-f]+),`).exec(payload);
  if (!match) return null;
  const length = parseInt(match[1], 16);
  const rest = Buffer.from(payload.slice(match.index + match[0].length), "utf8");
  return rest.subarray(0, length).toString("utf8");
}

function findListing(payload, id) {
  let best = null;
  for (let from = 0; ; ) {
    const at = payload.indexOf(`{"id":${id},`, from);
    if (at < 0) break;
    try {
      const candidate = objectAt(payload, at);
      if (candidate.listing && (!best || JSON.stringify(candidate).length > JSON.stringify(best).length)) best = candidate;
    } catch {
      // Not a complete object at this position; keep looking.
    }
    from = at + 1;
  }
  if (!best) throw new Error(`Listing ${id} not found in page payload`);
  return best;
}

async function savePhoto(url, file) {
  if (!force && existsSync(file)) return sharp(file).metadata();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const input = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  await writeFile(file, data);
  return info;
}

async function syncListing(id) {
  const html = await getText(`${BOOKING_SITE}/listings/${id}`);
  const payload = flightPayload(html);
  const raw = findListing(payload, id);
  const l = raw.listing;
  const dir = path.join(IMAGE_DIR, String(id));
  await mkdir(dir, { recursive: true });

  const sorted = [...raw.listingImage].sort((a, b) => a.sortOrder - b.sortOrder);
  const images = [];
  for (const [i, image] of sorted.entries()) {
    const name = `${String(i + 1).padStart(2, "0")}.webp`;
    const meta = await savePhoto(image.url, path.join(dir, name));
    images.push({
      src: `/images/listings/${id}/${name}`,
      width: meta.width,
      height: meta.height,
      caption: image.bookingEngineCaption || image.caption || "",
    });
  }

  console.log(`  ${id}  ${l.name}  (${images.length} photos)`);
  return {
    id,
    name: l.name,
    propertyType: l.propertyType?.name ?? null,
    bedrooms: l.bedroomsNumber,
    bathrooms: l.bathroomsNumber,
    beds: l.bedsNumber,
    guests: l.personCapacity,
    price: l.price,
    currency: l.currencyCode,
    rating: raw.averageReviewRating,
    instantBooking: Boolean(raw.allowInstantBooking),
    lat: l.lat,
    lng: l.lng,
    checkInHour: l.checkInTimeStart,
    checkOutHour: l.checkOutTime,
    description: resolveText(payload, l.description) ?? "",
    amenities: raw.listingAmenity.filter((a) => a.isPresent).map((a) => ({ name: a.amenity.name, category: a.amenity.category })),
    images,
  };
}

const index = (await Promise.all([getText(BOOKING_SITE), getText(`${BOOKING_SITE}/all-listings`)])).join("");
const ids = [...new Set([...index.matchAll(/\/listings\/(\d+)/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
if (!ids.length) throw new Error("No listings found on the booking site");

console.log(`Syncing ${ids.length} listings from ${BOOKING_SITE}`);
const listings = [];
for (const id of ids) listings.push(await syncListing(id));

await mkdir(path.dirname(DATA_FILE), { recursive: true });
await writeFile(DATA_FILE, `${JSON.stringify(listings, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, DATA_FILE)}`);
