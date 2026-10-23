"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  bookingHref,
  destinations,
  emptyDetails,
  isValidIso,
  MAX_GUESTS,
  nightsBetween,
  submitBookingRequest,
  validateDetails,
  type DestinationId,
  type GuestDetails,
  type Guests,
} from "@/lib/booking";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";
import { getStay } from "@/lib/stays";
import { ArrowIcon } from "../ui/bits";
import { StepDates, StepDetails, StepReview, StepStay } from "./booking-steps";
import { BookingSummary, Confirmation } from "./booking-summary";
import { Stepper } from "./stepper";

const STEPS = ["Dates", "Stay", "Details", "Review"];

type Initial = {
  destination: DestinationId;
  start: string;
  end: string;
  guests: Guests;
  stay: string | null;
  step: number;
};

function readParams(params: Pick<URLSearchParams, "get">): Initial {
  const start = params.get("start");
  const end = params.get("end");
  const datesOk = isValidIso(start) && isValidIso(end) && nightsBetween(start, end) > 0;
  const adults = Math.max(1, Math.min(MAX_GUESTS, Number(params.get("adults")) || 2));
  const children = Math.max(0, Math.min(MAX_GUESTS - adults, Number(params.get("children")) || 0));
  const stay = getStay(params.get("stay") ?? "");
  const fits = stay ? stay.listing.guests >= adults + children : false;
  const destination = destinations.find((d) => d.id === params.get("destination"))?.id ?? "any";

  return {
    destination,
    start: datesOk ? start : "",
    end: datesOk ? end : "",
    guests: { adults, children },
    stay: stay && fits ? stay.slug : null,
    // Skip ahead past whatever the guest already chose before arriving here.
    step: datesOk ? (stay && fits ? 2 : 1) : 0,
  };
}

/** The four-step booking: dates → stay → details → review, then a confirmation. */
export function BookingFlow() {
  const params = useSearchParams();
  const lenis = useLenis();
  const [initial] = useState(() => readParams(params));
  const [destination, setDestination] = useState(initial.destination);
  const [dates, setDates] = useState({ start: initial.start, end: initial.end });
  const [guests, setGuests] = useState(initial.guests);
  const [staySlug, setStaySlug] = useState(initial.stay);
  const [details, setDetails] = useState<GuestDetails>(emptyDetails);
  const [errors, setErrors] = useState<ReturnType<typeof validateDetails>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [[step, direction], setStepState] = useState([initial.step, 0]);
  const [reached, setReached] = useState(initial.step);
  const [hint, setHint] = useState("");
  const [status, setStatus] = useState<"editing" | "sending" | "done">("editing");
  const [reference, setReference] = useState("");
  const card = useRef<HTMLDivElement>(null);
  const stickLine = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  const stay = staySlug ? (getStay(staySlug) ?? null) : null;
  const nights = dates.start && dates.end ? nightsBetween(dates.start, dates.end) : 0;
  const totalGuests = guests.adults + guests.children;
  // How much of the current step is filled in: the stepper's boat sails toward the next step as it fills.
  const stepProgress = [
    (dates.start ? 0.5 : 0) + (nights ? 0.5 : 0),
    stay ? 1 : 0,
    1 - Object.keys(validateDetails(details)).length / 5,
    confirmed ? 1 : 0,
  ][step];

  // The steps stick to the top once the page scrolls past where they sit; they get a shadow then.
  useEffect(() => {
    const line = stickLine.current;
    if (!line) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      rootMargin: "-85px 0px 0px 0px",
    });
    observer.observe(line);
    return () => observer.disconnect();
  }, []);

  // Keep the address bar shareable without re-rendering the page.
  useEffect(() => {
    const href = bookingHref({ destination, stay: staySlug ?? undefined, ...dates, ...guests });
    window.history.replaceState(null, "", href);
  }, [destination, dates, guests, staySlug]);

  // A stay that no longer fits the party is dropped.
  function changeGuests(next: Guests) {
    setGuests(next);
    if (stay && stay.listing.guests < next.adults + next.children) setStaySlug(null);
  }

  function goTo(next: number) {
    setHint("");
    setStepState([next, next > step ? 1 : -1]);
    setReached((r) => Math.max(r, next));
    // Bring the new step's top into view, below the nav and the sticky steps.
    const top = card.current?.getBoundingClientRect().top ?? 0;
    if (top < 208 && card.current) lenis?.scrollTo(card.current, { offset: -204, duration: 1.1 });
  }

  // Move focus to the new step's heading for keyboard and screen reader users.
  useEffect(() => {
    const id = setTimeout(() => card.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus({ preventScroll: true }), 450);
    return () => clearTimeout(id);
  }, [step]);

  async function next() {
    if (step === 0) {
      if (!dates.start) return setHint("Choose your check-in date to continue.");
      if (!nights) return setHint("Now choose your check-out date.");
      return goTo(1);
    }
    if (step === 1) {
      if (!stay) return setHint("Choose a stay to continue.");
      return goTo(2);
    }
    if (step === 2) {
      const found = validateDetails(details);
      setErrors(found);
      if (Object.keys(found).length) return setHint("A few details need another look.");
      return goTo(3);
    }
    if (!confirmed) return setHint("Tick the box to confirm your details.");
    if (!stay) return;
    setStatus("sending");
    const result = await submitBookingRequest({
      stay: stay.slug,
      hostawayId: stay.hostawayId,
      start: dates.start,
      end: dates.end,
      nights,
      guests,
      estimatedTotal: stay.listing.price * nights,
      currency: stay.listing.currency,
      guest: details,
    });
    setReference(result.reference);
    setStatus("done");
    lenis?.scrollTo(0, { duration: 1 });
  }

  const done = status === "done";

  return (
    <>
      <section className="relative overflow-hidden rounded-b-[40px] bg-jungle-deep px-5 pt-32 pb-[19.5rem] text-sand md:rounded-b-[64px] md:px-10 md:pt-40">
        <div className="mx-auto max-w-[1400px] text-center">
          <p className="text-[11px] font-semibold tracking-[0.32em] text-sand/60 uppercase">Book direct · La Bocana</p>
          <h1 className="font-display mt-5 text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-[-0.03em]">
            {done ? "See you on the " : "Book your "}
            <span className="wonk text-lagoon-soft italic">{done ? "water." : "stay."}</span>
          </h1>
          {!done && <p className="mx-auto mt-5 max-w-md text-sand/70">Four quick steps, and you&apos;re on your way to the water.</p>}
        </div>
        {/* Where the steps sit until the page scrolls past them. */}
        <div ref={stickLine} aria-hidden className="absolute inset-x-0 bottom-[16rem] h-px" />
      </section>

      {/* The steps stay in view while the form scrolls: pinned under the nav, or to the very top while it's away. */}
      <div
        className={cn(
          "sticky top-(--nav-offset) z-30 -mt-[16rem] bg-jungle-deep pt-9 pb-6 text-sand transition-[top,border-radius,box-shadow] duration-700 ease-out-expo",
          stuck && "rounded-b-[28px] shadow-[0_24px_40px_-24px_rgba(4,20,15,0.75)]",
        )}
      >
        <Stepper steps={STEPS} current={step} progress={stepProgress} completed={reached} finished={done} onSelect={goTo} />
      </div>

      <section className="relative z-10 mt-11 bg-transparent px-3 pb-24 md:px-6 md:pb-32">
        {done && stay ? (
          <Confirmation
            reference={reference}
            stay={stay}
            start={dates.start}
            end={dates.end}
            nights={nights}
            guests={guests}
            firstName={details.firstName.trim()}
            email={details.email.trim()}
          />
        ) : (
          <div className="mx-auto grid max-w-[1400px] items-start gap-6 lg:grid-cols-12">
            <div ref={card} className="rounded-[32px] bg-sand p-6 shadow-[0_30px_80px_-40px_rgba(7,34,25,0.45)] ring-1 ring-jungle/10 md:p-10 lg:col-span-8">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -48 }}
                  transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                >
                  {step === 0 && (
                    <StepDates
                      destination={destination}
                      onDestination={setDestination}
                      start={dates.start}
                      end={dates.end}
                      onDates={(start, end) => setDates({ start, end })}
                      guests={guests}
                      onGuests={changeGuests}
                      maxGuests={MAX_GUESTS}
                    />
                  )}
                  {step === 1 && (
                    <StepStay selected={staySlug} onSelect={setStaySlug} nights={nights} guests={guests} destination={destination} />
                  )}
                  {step === 2 && (
                    <StepDetails
                      details={details}
                      errors={errors}
                      onChange={(value) => {
                        setDetails(value);
                        if (Object.keys(errors).length) setErrors(validateDetails(value));
                      }}
                    />
                  )}
                  {step === 3 && stay && (
                    <StepReview
                      stay={stay}
                      start={dates.start}
                      end={dates.end}
                      guests={guests}
                      details={details}
                      confirmed={confirmed}
                      onConfirm={setConfirmed}
                      onEdit={goTo}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col-reverse items-stretch gap-4 border-t border-jungle/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    className="group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold ring-1 ring-jungle/20 transition-colors hover:ring-jungle"
                  >
                    <ArrowIcon direction="left" className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-1" />
                    Back
                  </button>
                ) : (
                  <span className="hidden sm:block" />
                )}

                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-5">
                  <AnimatePresence>
                    {hint && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-sm text-red-700 sm:text-right"
                      >
                        {hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={next}
                    disabled={status === "sending"}
                    className={cn(
                      "group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold transition-colors duration-500",
                      step === 3 ? "bg-lagoon text-sand-soft hover:bg-jungle" : "bg-jungle text-sand hover:bg-lagoon",
                      status === "sending" && "cursor-wait opacity-80",
                    )}
                  >
                    {status === "sending" ? (
                      <>
                        <Spinner /> Sending request…
                      </>
                    ) : (
                      <>
                        {step === 3 ? "Request to book" : step === 2 ? "Review booking" : "Continue"}
                        <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-[calc(var(--nav-offset)+7.5rem)] lg:col-span-4 lg:transition-[top] lg:duration-700 lg:ease-out-expo">
              <BookingSummary stay={stay} start={dates.start} end={dates.end} nights={nights} guests={guests} />
              {stay && totalGuests > stay.listing.guests && (
                <p className="mt-3 text-center text-sm text-red-700">This stay sleeps up to {stay.listing.guests}.</p>
              )}
            </aside>
          </div>
        )}
      </section>
    </>
  );
}

function Spinner() {
  return (
    <motion.span
      aria-hidden
      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  );
}
