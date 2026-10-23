import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Bocas del Toro, Panamá`,
    template: `%s · ${site.name}`,
  },
  description:
    "Waterfront bungalows, apartments and a home in a quiet corner of Bocas Town, Panamá. Swim off the dock, watch the sunset, book direct.",
  openGraph: {
    title: site.name,
    description: "Waterfront bungalows in Bocas del Toro, Panamá. Book direct.",
    // JPG rather than WebP: some link-preview crawlers still skip WebP.
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "La Bocana's bungalows seen from the water" }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#072219",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (password managers, colour pickers, dark-mode tools) add their own attributes to
    // <html> and <body> before React loads. This only stops React warning about those two elements'
    // attributes; everything inside is still checked.
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-jungle focus:px-5 focus:py-3 focus:text-sand"
        >
          Skip to content
        </a>
        <Providers>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
