// OWNER: Builder B. A trait that reveals the real repo fact behind it.
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Fact, Trait } from "@/lib/contract";
import { COPY } from "@/content/copy";

type Props = { trait: Trait; fact: Fact | undefined; index: number };

export function TraitChip({ trait, fact, index }: Props) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.15, duration: 0.4 }}
      className="rounded-2xl border border-line bg-surface"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full rounded-2xl p-4 text-left transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-highlight"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="font-semibold">{trait.title}</span>
          <span aria-hidden className="text-xs text-muted">{open ? "-" : "why?"}</span>
        </span>
        <span className="mt-1 block text-sm text-muted">{trait.description}</span>
        {open && fact && (
          <span className="mt-3 block rounded-lg border border-highlight/40 bg-highlight/10 px-3 py-2 text-sm">
            <span className="font-semibold text-highlight">{COPY.evidenceLabel}:</span> {fact.label}: {fact.value}
          </span>
        )}
      </button>
    </motion.li>
  );
}
