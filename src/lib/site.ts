import type { Tone } from "./stays";

// Pin from the Hostaway listings (the complex at the south end of 5th Street).
const coords = { lat: 9.3358154, lng: -82.2422087 };

export const site = {
  name: "La Bocana Bungalows",
  shortName: "La Bocana",
  tagline: "Experience paradise.",
  url: "https://www.destinationbocas.com",
  street: "Calle 5ta y Avenida Sur",
  city: "Bocas del Toro, Panamá",
  coords,
  coordsLabel: "9.3358° N · 82.2422° W",
  mapEmbedUrl: `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
};

export const navLinks = [
  { label: "Stays", href: "/#stays" },
  { label: "Included", href: "/#included" },
  { label: "Arrival", href: "/#check-in" },
  { label: "Experiences", href: "/#experiences" },
  { label: "Location", href: "/#location" },
];

export type Perk = {
  icon: "wifi" | "water" | "paddle" | "laundry" | "swim" | "deck" | "key" | "boat";
  title: string;
  text: string;
};

/** What every stay includes, from the Hostaway listing descriptions. */
export const perks: Perk[] = [
  { icon: "wifi", title: "Starlink Wi-Fi", text: "Fast Starlink internet, so working or streaming from paradise is easy." },
  { icon: "water", title: "Unlimited drinking water", text: "Fresh drinking water on tap for your whole stay." },
  { icon: "paddle", title: "Paddle boards & kayak", text: "Stand-up paddle boards and a kayak, ready at the dock." },
  { icon: "laundry", title: "Wash & fold laundry", text: "One free load a week, 9am to 3pm, Monday to Friday." },
  { icon: "swim", title: "Swim off the dock", text: "A ladder into the sea and a shower to rinse off after." },
  { icon: "deck", title: "Sundeck on the water", text: "Loungers, umbrellas and tables with sunset views." },
  { icon: "key", title: "Easy self check-in", text: "Keypad locks for late arrivals, and staff on site most days." },
  { icon: "boat", title: "Tours & water taxis", text: "We'll set up your island days. Boats can leave from our dock." },
];

export type Experience = {
  title: string;
  place: string;
  text: string;
  tone: Tone;
  /** Photo for the card. Without one, the card falls back to the colour scene for `tone`. */
  image?: string;
};

export const experiences: Experience[] = [
  {
    title: "Starfish Beach",
    place: "Playa Estrella · Boca del Drago",
    text: "Calm, clear shallows where starfish rest on the sand. Look, don't touch, and bring a snorkel.",
    tone: "dawn",
    image: "/images/bocas-aerial.webp",
  },
  {
    title: "Red Frog Beach",
    place: "Isla Bastimentos",
    text: "A short boat ride and a jungle path lead to golden sand, rolling waves and tiny red poison dart frogs.",
    tone: "jungle",
    image: "/images/bocas-aerial.webp",
  },
  {
    title: "Dolphin Bay",
    place: "Bahía de los Delfines",
    text: "Glide across a calm bay where bottlenose dolphins are often spotted. A favourite half-day boat trip.",
    tone: "lagoon",
    image: "/images/bocas-aerial.webp",
  },
  {
    title: "Zapatilla Cays",
    place: "Bastimentos Marine Park",
    text: "Two uninhabited islands ringed by white sand and coral reef. The postcard view of Bocas.",
    tone: "dusk",
    image: "/images/bocas-aerial.webp",
  },
  {
    title: "Bluff Beach",
    place: "Isla Colón",
    text: "A wild, wave-pounded stretch on the island's east coast, loved by surfers and sunrise chasers.",
    tone: "lagoon",
    image: "/images/bocas-aerial.webp",
  },
];
