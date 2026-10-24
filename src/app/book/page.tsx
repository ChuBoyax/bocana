import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingBackdrop, BookingFlow, BookingIntro } from "@/components/booking/booking-flow";

export const metadata: Metadata = {
  title: "Book your stay",
  description: "Book a waterfront bungalow, apartment or home at La Bocana in Bocas Town, Panamá, in four quick steps.",
};

export default function BookPage() {
  return (
    // The flow reads the URL (dates, guests, stay), so it renders on the client.
    <Suspense fallback={<BookingShell />}>
      <BookingFlow />
    </Suspense>
  );
}

/** Same footprint as the flow's header so nothing jumps while it loads. */
function BookingShell() {
  return (
    <>
      <section className="relative overflow-hidden rounded-b-[40px] bg-jungle-deep px-5 pt-32 pb-[19.5rem] text-sand md:rounded-b-[64px] md:px-10 md:pt-40">
        <BookingBackdrop />
        <BookingIntro done={false} />
      </section>
      <section className="relative z-10 -mt-28 px-3 pb-24 md:px-6">
        <div className="mx-auto h-[70svh] max-w-[1400px] animate-pulse rounded-[32px] bg-sand-soft" />
      </section>
    </>
  );
}
