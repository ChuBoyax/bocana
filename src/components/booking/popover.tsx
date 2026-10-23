"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn, EASE_OUT_EXPO } from "@/lib/cn";

type PopoverProps = {
  open: boolean;
  onClose: () => void;
  /** The field that toggles the panel. */
  trigger: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
};

/** A panel anchored to its trigger; closes on outside click or Escape. */
export function Popover({
  open,
  onClose,
  trigger,
  children,
  placement = "bottom",
  align = "start",
  className,
  panelClassName,
}: PopoverProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const top = placement === "top";

  return (
    <div ref={root} className={cn("relative", className)}>
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            className={cn(
              "absolute z-30 rounded-[28px] bg-sand-soft p-5 text-jungle shadow-[0_30px_80px_-20px_rgba(7,34,25,0.55)] ring-1 ring-jungle/10",
              top ? "bottom-full mb-3" : "top-full mt-3",
              align === "start" ? "left-0" : "right-0",
              panelClassName,
            )}
            style={{ transformOrigin: `${align === "start" ? "left" : "right"} ${top ? "bottom" : "top"}` }}
            initial={{ opacity: 0, scale: 0.94, y: top ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: top ? 6 : -6 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
