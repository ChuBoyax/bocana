export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * For the CSS entrances that play on load (`animate-rise`, `animate-settle`…, see `globals.css`): start this
 * many seconds after the first paint. Use as an element's `style`.
 */
export const entranceDelay = (seconds: number) => ({ animationDelay: `${seconds}s` });

/** Shared easing curves, in the [x1, y1, x2, y2] form Motion expects. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
