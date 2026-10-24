type SplitCharsProps = {
  text: string;
  delay?: number;
  stagger?: number;
};

/**
 * Letters rise into place one by one, `stagger` seconds apart after `delay`. Wrap in an overflow-hidden line
 * for the mask. Plain CSS (`animate-letter`), so it plays from the first paint.
 */
export function SplitChars({ text, delay = 0, stagger = 0.045 }: SplitCharsProps) {
  return (
    <span aria-hidden className="inline-block">
      {Array.from(text).map((char, i) => (
        <span key={i} className="inline-block animate-letter" style={{ animationDelay: `${delay + i * stagger}s` }}>
          {/* A plain space would collapse to nothing inside an inline-block. */}
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
