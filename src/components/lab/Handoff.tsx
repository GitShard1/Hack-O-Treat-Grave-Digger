// OWNER: Builder B. Pieces that carry the lab into the result card without a cut:
// a panel backdrop that morphs size (shared layoutId), the monster flying into its slot, and content fading in.
"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animate, motion } from "framer-motion";
import { SketchFrame } from "@/components/SketchFrame";

export type Rect = { x: number; y: number; width: number; height: number };

/** Shared by the lab panel and the result card, so one morphs into the other. */
export const PANEL_LAYOUT_ID = "gd-result-panel";

/** The panel background and sketchy outline, drawn behind the content. */
export function PanelPlate({ layoutId }: { layoutId?: string }) {
  return (
    <motion.div aria-hidden layoutId={layoutId} className="absolute inset-0" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      <SketchFrame className="h-full rounded-[1.6rem] bg-surface-strong backdrop-blur-sm">{null}</SketchFrame>
    </motion.div>
  );
}

/** Animates its child from `from` (a screen rect measured in the lab) into its own place. Transform only. */
export function FlipIn({ from, children, className }: { from?: Rect | null; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !from) return;
    const to = el.getBoundingClientRect();
    if (!to.width || !from.width) return;
    const scale = from.width / to.width;
    const x = from.x + from.width / 2 - (to.x + to.width / 2);
    const y = from.y + from.height / 2 - (to.y + to.height / 2);
    // Start where the lab left off before the first paint, then glide home.
    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const controls = animate(el, { x: [x, 0], y: [y, 0], scale: [scale, 1] }, { duration: 0.85, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [from]);
  return (
    <div ref={ref} className={className} style={{ transformOrigin: "50% 50%" }}>
      {children}
    </div>
  );
}

/** Fades content in after the hand-off. With `show` false it renders plainly. */
export function FadeIn({ show, delay = 0, children, className }: { show: boolean; delay?: number; children: ReactNode; className?: string }) {
  if (!show) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}>
      {children}
    </motion.div>
  );
}
