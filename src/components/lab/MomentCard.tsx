// OWNER: Builder B. A "key moment" snippet: one real repo fact, shown while the matching part is built.
"use client";
import { motion } from "framer-motion";
import { COPY } from "@/content/copy";
import { SketchFrame } from "@/components/SketchFrame";
import type { Moment } from "./timeline";

type Props = { moment: Moment; number: number; side: "left" | "right" };

export function MomentCard({ moment, number, side }: Props) {
  const tilt = side === "left" ? 1 : -1;
  return (
    <motion.div
      className={`absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:w-[19rem] ${side === "left" ? "sm:left-5" : "sm:right-5"}`}
      style={{ transformPerspective: 700 }}
      initial={{ opacity: 0, rotateY: -38 * tilt, rotateZ: -4 * tilt, x: -40 * tilt, y: 16 }}
      animate={{ opacity: 1, rotateY: 0, rotateZ: -1.5 * tilt, x: 0, y: 0 }}
      exit={{ opacity: 0, rotateY: 30 * tilt, x: 30 * tilt, y: -10, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <SketchFrame tone="border-highlight" className="rounded-[1.6rem] bg-surface-strong px-4 py-3 backdrop-blur-sm">
        <p className="text-[0.7rem] uppercase tracking-widest text-highlight">
          {"// "}
          {COPY.lab.momentTag} {String(number).padStart(2, "0")}
        </p>
        <p className="mt-1 font-display text-lg leading-snug break-words sm:text-xl">{moment.text}</p>
        <p className="mt-1 text-[0.7rem] text-muted">
          {moment.fact.label} <span className="opacity-70">({moment.fact.id})</span>
        </p>
      </SketchFrame>
    </motion.div>
  );
}
