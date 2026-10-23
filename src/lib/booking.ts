import { stays } from "./stays";

export type Guests = { adults: number; children: number };

export const destinations = [
  { id: "any", label: "Any destination", hint: "All nine stays" },
  { id: "bocas-del-toro", label: "Bocas del Toro", hint: "Archipelago · Panamá" },
  { id: "colon-island", label: "Colón Island", hint: "Isla Colón · Bocas Town" },
] as const;

export type DestinationId = (typeof destinations)[number]["id"];

/** The most guests any single stay sleeps. */
export const MAX_GUESTS = Math.max(...stays.map((stay) => stay.listing.guests));

export const ARRIVAL_WINDOWS = [
  "Before 3:00 PM (luggage drop-off)",
  "3:00 PM – 6:00 PM",
  "6:00 PM – 9:00 PM",
  "After 9:00 PM (self check-in)",
];

/* ── Dates are kept as local "YYYY-MM-DD" strings ─────────────────────── */

export function isoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isValidIso(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseIso(value).getTime()));
}

export function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function nightsBetween(start: string, end: string) {
  return Math.round((parseIso(end).getTime() - parseIso(start).getTime()) / 86_400_000);
}

/** "Dec 10" */
export function formatShort(iso: string) {
  return parseIso(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Thu, Dec 10, 2026" */
export function formatLong(iso: string) {
  return parseIso(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function guestsLabel({ adults, children }: Guests) {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return children ? `${plural(adults, "adult")}, ${children} ${children === 1 ? "child" : "children"}` : plural(adults, "guest");
}

/* ── Links into the booking flow ──────────────────────────────────────── */

export type BookingParams = {
  stay?: string;
  destination?: DestinationId;
  start?: string;
  end?: string;
  adults?: number;
  children?: number;
};

export function bookingHref({ stay, destination, start, end, adults, children }: BookingParams = {}) {
  const params = new URLSearchParams();
  if (destination && destination !== "any") params.set("destination", destination);
  if (stay) params.set("stay", stay);
  if (start && end) {
    params.set("start", start);
    params.set("end", end);
  }
  if (adults) params.set("adults", String(adults));
  if (children) params.set("children", String(children));
  const query = params.toString();
  return query ? `/book?${query}` : "/book";
}

/* ── Submitting ───────────────────────────────────────────────────────── */

export type GuestDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  arrival: string;
  requests: string;
};

export const emptyDetails: GuestDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  arrival: ARRIVAL_WINDOWS[1],
  requests: "",
};

/** Returns a message per invalid field; empty when everything is fine. */
export function validateDetails(details: GuestDetails) {
  const errors: Partial<Record<keyof GuestDetails, string>> = {};
  if (!details.firstName.trim()) errors.firstName = "Please add your first name.";
  if (!details.lastName.trim()) errors.lastName = "Please add your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim())) errors.email = "Please add a valid email address.";
  if (details.phone.replace(/\D/g, "").length < 7) errors.phone = "Please add a phone number we can reach you on.";
  if (!details.country.trim()) errors.country = "Please add your country.";
  return errors;
}

export type BookingRequest = {
  stay: string;
  hostawayId: number;
  start: string;
  end: string;
  nights: number;
  guests: Guests;
  estimatedTotal: number;
  currency: string;
  guest: GuestDetails;
};

/**
 * Sends a booking request. The site is static for now, so this only
 * simulates the round trip and returns a reference.
 *
 * TODO: connect a backend here (e.g. a Route Handler that creates the
 * reservation through the Hostaway API, or emails the request to the host).
 */
export async function submitBookingRequest(request: BookingRequest): Promise<{ reference: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  console.info("Booking request (not sent anywhere yet):", request);
  const code = (Date.now().toString(36) + Math.random().toString(36).slice(2, 4)).slice(-6).toUpperCase();
  return { reference: `LB-${code}` };
}
