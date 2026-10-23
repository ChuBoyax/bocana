"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn, EASE_IN_OUT, EASE_OUT_EXPO } from "@/lib/cn";
import { navLinks, site } from "@/lib/site";
import { SiteLink } from "./navigation";
import { ArrowIcon, Logo } from "./ui/bits";
import { Magnetic } from "./ui/magnetic";

export function Nav() {
  const { scrollY } = useScroll();
  const lenis = useLenis();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const onStayPage = usePathname().startsWith("/stays/");

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(y > previous && y > 240);
    setSolid(y > 80);
  });

  // Lets sticky things (the booking steps) sit flush with the top of the screen while the nav is away.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-nav-hidden", hidden && !open);
  }, [hidden, open]);

  useEffect(() => {
    if (!lenis || !open) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const glass = solid && !open;

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4"
        animate={{ y: hidden && !open ? "-120%" : "0%" }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1600px] items-center justify-between rounded-full py-2.5 pr-2.5 pl-5 transition-[background-color,color,box-shadow,backdrop-filter] duration-700 ease-out-expo md:pl-6",
            glass
              ? "bg-sand/75 text-jungle shadow-[0_10px_40px_-20px_rgba(7,34,25,0.45)] ring-1 ring-jungle/5 backdrop-blur-xl"
              : "text-sand",
          )}
        >
          <SiteLink href="/" className="group flex items-center gap-2.5" aria-label={`${site.name}, home`} onClick={() => setOpen(false)}>
            <Logo className="h-8 w-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
            <span className="font-display text-xl tracking-tight">
              La Bocana<span className="text-lagoon">.</span>
            </span>
          </SiteLink>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <SiteLink key={link.href} href={link.href} className="group px-3.5 py-2 text-sm font-medium xl:px-4">
                <RollingLabel>{link.label}</RollingLabel>
              </SiteLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Magnetic>
                <BookButton href={onStayPage ? "#book" : "/book"} tone={glass ? "dark" : "light"} />
              </Magnetic>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-full transition-colors lg:hidden",
                glass ? "bg-jungle text-sand" : "bg-sand/15 text-sand backdrop-blur",
              )}
            >
              <motion.span
                className="absolute h-[1.5px] w-5 bg-current"
                animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              />
              <motion.span
                className="absolute h-[1.5px] w-5 bg-current"
                animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

// One wave of the tide's crest, tiled along its top edge; the "lap" animation slides it one tile (16px) and loops.
const CREST = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 6'%3E%3Cpath d='M0 6V3q4-3 8 0t8 0v3z' fill='%2317a39b'/%3E%3C/svg%3E")`;

/**
 * The booking call to action. On hover the lagoon rises through it from below, a wave lapping along its
 * crest, and the arrow turns toward the water. `light` sits on the dark hero, `dark` on the frosted nav.
 */
function BookButton({
  href,
  tone,
  onClick,
  className,
}: {
  href: string;
  tone: "light" | "dark";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <SiteLink
      href={href}
      onClick={onClick}
      className={cn(
        "group relative isolate inline-flex items-center gap-3 overflow-hidden rounded-full py-1.5 pr-5 pl-1.5 text-sm font-semibold transition-colors duration-500 hover:text-sand-soft focus-visible:text-sand-soft",
        tone === "light" ? "bg-sand text-jungle" : "bg-jungle text-sand",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 translate-y-[125%] bg-lagoon transition-transform duration-700 ease-out-expo group-hover:translate-y-0 group-focus-visible:translate-y-0"
      >
        <span className="absolute -top-[5px] left-0 h-1.5 w-[calc(100%+16px)] motion-safe:animate-lap" style={{ backgroundImage: CREST, backgroundSize: "16px 6px" }} />
      </span>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-out-expo group-hover:-rotate-45 group-hover:bg-sand-soft group-hover:text-jungle",
          tone === "light" ? "bg-jungle text-sand" : "bg-sand text-jungle",
        )}
      >
        <ArrowIcon className="h-4 w-4" />
      </span>
      <RollingLabel>Book now</RollingLabel>
    </SiteLink>
  );
}

/** Label that rolls up on hover, swapping to the italic serif. */
export function RollingLabel({ children }: { children: string }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-out-expo group-hover:-translate-y-full">{children}</span>
      <span
        aria-hidden
        className="font-display absolute inset-0 block translate-y-full italic transition-transform duration-500 ease-out-expo group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      id="mobile-menu"
      className="fixed inset-0 z-40 flex flex-col justify-between bg-jungle-deep px-6 pt-28 pb-10 text-sand lg:hidden"
      initial={{ clipPath: "circle(0% at calc(100% - 42px) 42px)" }}
      animate={{ clipPath: "circle(150% at calc(100% - 42px) 42px)" }}
      exit={{ clipPath: "circle(0% at calc(100% - 42px) 42px)" }}
      transition={{ duration: 0.9, ease: EASE_IN_OUT }}
    >
      <nav aria-label="Mobile" className="flex flex-col">
        {[{ label: "Home", href: "/" }, ...navLinks].map((link, i) => (
          <div key={link.href} className="overflow-hidden border-b border-sand/10">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease: EASE_OUT_EXPO }}
            >
              <SiteLink href={link.href} onClick={onClose} className="flex items-baseline justify-between py-4">
                <span className="font-display text-5xl tracking-tight">{link.label}</span>
                <span className="font-display text-sm text-lagoon italic">0{i + 1}</span>
              </SiteLink>
            </motion.div>
          </div>
        ))}
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="flex items-end justify-between gap-6 text-sm text-sand/70"
      >
        <div>
          <p>{site.street}</p>
          <p>{site.city}</p>
          <a href={site.directionsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-lagoon-soft underline underline-offset-4">
            Get directions
          </a>
        </div>
        <BookButton href="/book" tone="light" onClick={onClose} className="shrink-0" />
      </motion.div>
    </motion.div>
  );
}
