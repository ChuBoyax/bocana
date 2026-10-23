"use client";

import { useLenis } from "lenis/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ComponentProps, type MouseEvent, type ReactNode } from "react";

type Navigate = (href: string) => void;

const NavigateContext = createContext<Navigate>(() => {});

/** Navigate to another route from code (after a search, say), landing on its #anchor if it has one. */
export function useNavigate() {
  return useContext(NavigateContext);
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** "/book?x=1#top" → { path: "/book", hash: "top", query: true } */
function splitHref(href: string) {
  const [beforeHash, hash] = href.split("#");
  const [path, query] = beforeHash.split("?");
  return { path, hash, query: query !== undefined };
}

/**
 * Plain Next.js route changes, plus one fix for smooth scrolling: when the new route has an #anchor,
 * we land on it once the page has rendered. Lenis still holds the previous page's height at that point,
 * so it is refreshed first or the jump gets clamped.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const pendingHash = useRef<{ path: string; hash: string } | null>(null);
  const previousPath = useRef(pathname);
  const wentBack = useRef(false);

  useEffect(() => {
    const onPop = () => {
      // Hash-only history steps stay on the same page and never reach the effect below.
      if (window.location.pathname !== previousPath.current) wentBack.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A new page starts at the top. Lenis can still be gliding towards the old page's scroll target
  // (cards in the stays rail are often clicked mid-scroll) and would carry the new page down to its footer.
  // Back/forward and #anchor navigations keep their own position.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    const back = wentBack.current;
    wentBack.current = false;
    if (back || pendingHash.current?.path === pathname) return;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);

  const navigate = useCallback<Navigate>(
    (href) => {
      const { path, hash } = splitHref(href);
      pendingHash.current = hash ? { path: path || pathname, hash } : null;
      router.push(href);
    },
    [router, pathname],
  );

  useEffect(() => {
    const pending = pendingHash.current;
    if (!pending || pathname !== pending.path) return;
    pendingHash.current = null;
    requestAnimationFrame(() => {
      const target = document.getElementById(pending.hash);
      if (!target) return;
      if (lenis) {
        lenis.resize();
        lenis.scrollTo(target, { immediate: true, force: true });
      } else {
        target.scrollIntoView();
      }
    });
  }, [pathname, lenis]);

  return <NavigateContext value={navigate}>{children}</NavigateContext>;
}

type SiteLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * Drop-in for next/link for links within the site: anchors on the same page glide there with Lenis,
 * anchors on another page are landed on properly, everything else is an ordinary Next.js navigation.
 */
export function SiteLink({ href, onClick, ...props }: SiteLinkProps) {
  const navigate = useContext(NavigateContext);
  const pathname = usePathname();
  const lenis = useLenis();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const { path, hash, query } = splitHref(href);
    if ((path || pathname) === pathname && !query) {
      event.preventDefault();
      const target = hash ? `#${hash}` : 0;
      if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: easeOutQuart });
      else if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (hash) {
      event.preventDefault();
      navigate(href);
    }
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
