import type { NextConfig } from "next";

/**
 * Old Wix URLs (guests may still have them in their booking messages)
 * mapped to the new check-in pages.
 */
const legacyRedirects: Record<string, string> = {
  "/check-in-house": "/stays/house",
  "/check-in-small-apartment": "/stays/small-apartment",
  "/check-in-2-bedroom-apartment": "/stays/two-bedroom-apartment",
  "/copy-of-check-in-house": "/stays/bungalow-1",
  "/copy-of-check-in-waterfront-bungalow": "/stays/bungalow-2",
  "/copy-of-check-in-ocean-veiw-bungalow": "/stays/bungalow-3",
  "/copy-of-sunset-breeze-bungalow-1": "/stays/bungalow-4",
  "/copy-of-sunset-breeze-bungalow": "/stays/bungalows-2-and-3",
  "/copy-of-luxury-bungalow-over-the-water": "/stays/bungalows-1-and-4",
  "/experiences": "/",
};

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // No dev-tools badge over the page while developing; build and runtime errors still show.
  devIndicators: false,
  images: {
    // AVIF where the browser takes it (about a fifth smaller than WebP), WebP otherwise.
    formats: ["image/avif", "image/webp"],
    // Photos only change when the listings are re-synced: keep optimised copies for a week.
    minimumCacheTTL: 604800,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return Object.entries(legacyRedirects).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
