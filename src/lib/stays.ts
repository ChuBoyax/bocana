import listingsData from "@/data/listings.json";

export type Tone = "dawn" | "lagoon" | "jungle" | "dusk";

/** One listing as synced from Hostaway by `npm run sync:listings`. */
export type Listing = {
  id: number;
  name: string;
  propertyType: string | null;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  guests: number;
  price: number;
  currency: string;
  rating: number | null;
  instantBooking: boolean;
  lat: number;
  lng: number;
  checkInHour: number;
  checkOutHour: number;
  description: string;
  amenities: { name: string; category: string }[];
  images: { src: string; width: number; height: number; caption: string }[];
};

export type Photo = {
  src: string;
  alt: string;
  caption: string;
};

export type GalleryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type Curated = {
  slug: string;
  hostawayId: number;
  /** The name guests know it by. */
  label: string;
  /** Display name (tidied up from the Hostaway listing title). */
  name: string;
  kind: "Bungalow" | "Apartment" | "House" | "Pair";
  /** As written on the old check-in pages. */
  unit: string;
  summary: string;
  /** 1-based position in the Hostaway photo order to use as the cover. */
  coverPhoto: number;
  directions: string[];
  arrivalPhotos: Photo[];
  tone: Tone;
};

export type Stay = Omit<Curated, "coverPhoto"> & {
  listing: Listing;
  description: string[];
  gallery: GalleryImage[];
  cover: string;
};

const park: Photo = {
  src: "/images/checkin/park.webp",
  alt: "The park with a large tree at the southern end of 5th Street in Bocas town",
  caption: "The park at the southern end of 5th Street",
};

const parkArrow: Photo = {
  ...park,
  src: "/images/checkin/park-arrow.webp",
  alt: "The park at the southern end of 5th Street, with an arrow showing the way",
};

const fromPark: Photo = {
  src: "/images/checkin/from-park.webp",
  alt: "View from the park across the street, with the property circled",
  caption: "Across the street from the park",
};

const entrance: Photo = {
  src: "/images/checkin/entrance.webp",
  alt: "Turquoise house beside the yellow building, with an arrow pointing to the entrance",
  caption: "The entrance, to the right of the yellow building",
};

const nearPark = ["Across the street from the park", "At the southern end of 5th Street"];
const arrival = [park, fromPark, entrance];

const curated: Curated[] = [
  {
    slug: "house",
    hostawayId: 561062,
    label: "House",
    name: "Tropical Waterfront Home",
    kind: "House",
    unit: "3-bedroom house",
    summary: "Three bedrooms, three bathrooms and a balcony over the water. Room for the whole crew.",
    coverPhoto: 10,
    directions: [...nearPark, "The entrance is to the right of the yellow building", "Enter through the door on the right"],
    arrivalPhotos: arrival,
    tone: "jungle",
  },
  {
    slug: "small-apartment",
    hostawayId: 561061,
    label: "Small Apartment",
    name: "Small Caribbean Apartment on the Water",
    kind: "Apartment",
    unit: "Apartment #6",
    summary: "A cosy hideaway for two with its own little deck over the water.",
    coverPhoto: 1,
    directions: [...nearPark, "Next door to the yellow building", "Enter through the door on the right"],
    arrivalPhotos: arrival,
    tone: "dawn",
  },
  {
    slug: "two-bedroom-apartment",
    hostawayId: 561060,
    label: "2 Bed Apartment",
    name: "Caribbean Apartment on the Sea",
    kind: "Apartment",
    unit: "Apartment #5",
    summary: "Two bedrooms and two bathrooms in a boutique three-unit building, with a private patio on the sea.",
    coverPhoto: 6,
    directions: [...nearPark, "The entrance is to the right of the yellow building", "Enter through the door on the right"],
    arrivalPhotos: arrival,
    tone: "dusk",
  },
  {
    slug: "bungalow-1",
    hostawayId: 561059,
    label: "Bungalow #1",
    name: "Waterfront Bungalow",
    kind: "Bungalow",
    unit: "Bungalow #1",
    summary: "A brand-new studio with a king bed, full kitchen and a private patio that steps down to the sundeck.",
    coverPhoto: 15,
    directions: nearPark,
    arrivalPhotos: [parkArrow, fromPark, entrance],
    tone: "lagoon",
  },
  {
    slug: "bungalow-2",
    hostawayId: 561063,
    label: "Bungalow #2",
    name: "Ocean View Bungalow",
    kind: "Bungalow",
    unit: "Bungalow #2",
    summary: "Brand new, with wide Caribbean views from the porch and the sundeck at your door.",
    coverPhoto: 1,
    directions: nearPark,
    arrivalPhotos: arrival,
    tone: "dawn",
  },
  {
    slug: "bungalow-3",
    hostawayId: 561065,
    label: "Bungalow #3",
    name: "Over the Water Bungalow",
    kind: "Bungalow",
    unit: "Bungalow #3",
    summary: "Brand new and built right over the water, with sunset views from the porch.",
    coverPhoto: 17,
    directions: nearPark,
    arrivalPhotos: arrival,
    tone: "dusk",
  },
  {
    slug: "bungalow-4",
    hostawayId: 564039,
    label: "Bungalow #4",
    name: "Luxury Bungalow on the Water",
    kind: "Bungalow",
    unit: "Bungalow #4",
    summary: "A brand-new waterfront bungalow with its own porch, steps from the dock.",
    coverPhoto: 1,
    directions: nearPark,
    arrivalPhotos: arrival,
    tone: "lagoon",
  },
  {
    slug: "bungalows-2-and-3",
    hostawayId: 561068,
    label: "Bungalows #2 & #3",
    name: "Two Tropical Bungalows",
    kind: "Pair",
    unit: "Bungalows #2 & #3",
    summary: "Two brand-new over-the-water bungalows, right next to each other.",
    coverPhoto: 1,
    directions: nearPark,
    arrivalPhotos: arrival,
    tone: "jungle",
  },
  {
    slug: "bungalows-1-and-4",
    hostawayId: 564420,
    label: "Bungalows #1 & #4",
    name: "Double Waterfront Bungalows",
    kind: "Pair",
    unit: "Bungalows #1 & #4",
    summary: "Two over-the-water bungalows side by side, for families and friends travelling together.",
    coverPhoto: 5,
    directions: nearPark,
    arrivalPhotos: arrival,
    tone: "lagoon",
  },
];

const listings = listingsData as Listing[];

export const stays: Stay[] = curated.map(({ coverPhoto, ...stay }) => {
  const listing = listings.find((l) => l.id === stay.hostawayId);
  if (!listing) throw new Error(`No synced Hostaway listing ${stay.hostawayId} for "${stay.slug}". Run npm run sync:listings.`);
  return {
    ...stay,
    listing,
    description: listing.description
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 1),
    gallery: listing.images.map((image, i) => ({
      src: image.src,
      width: image.width,
      height: image.height,
      alt: image.caption || `${stay.label}, ${stay.name}: photo ${i + 1} of ${listing.images.length}`,
    })),
    cover: listing.images[coverPhoto - 1]?.src ?? listing.images[0].src,
  };
});

export function getStay(slug: string) {
  return stays.find((stay) => stay.slug === slug);
}

export function getNextStay(slug: string) {
  const index = stays.findIndex((stay) => stay.slug === slug);
  return stays[(index + 1) % stays.length];
}

export function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:00 ${suffix}`;
}

export function formatPrice(listing: Listing) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: listing.currency, maximumFractionDigits: 0 }).format(listing.price);
}

/** "2 guests · 1 bedroom · 1 bath" */
export function stayFacts(listing: Listing) {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return [plural(listing.guests, "guest"), plural(listing.bedrooms, "bedroom"), plural(listing.bathrooms, "bath")].join(" · ");
}
