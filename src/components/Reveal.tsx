// OWNER: Builder B. The reveal moment: fog clears and the result rises into view.
// Respects reduced-motion settings. Give it a new `key` per result so it replays.
"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function Reveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div>{children}</div>;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,var(--art-fog)_0%,transparent_70%)]"
        initial={{ opacity: 0.55 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.4, delay: 0.15 }}
      />
    </div>
  );
}
