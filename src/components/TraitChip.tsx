// OWNER: Builder B. A trait that reveals the real repo fact behind it. The signature trait is bigger and
// shows its evidence straight away; the others open it on tap.
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Fact, Trait } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { factOrigin } from "@/components/evidence";

type Props = { trait: Trait; fact: Fact | undefined; index: number; signature?: boolean };

export function TraitChip({ trait, fact, index, signature = false }: Props) {
  const [open, setOpen] = useState(signature);
  const reduceMotion = useReducedMotion();
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.15, duration: 0.4 }}
      className={`list-none rounded-2xl border bg-surface ${signature ? "border-highlight/60" : "border-line"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full rounded-2xl text-left transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-highlight ${signature ? "p-5" : "p-4"}`}
      >
        {signature && <span className="mb-2 block text-xs uppercase tracking-widest text-highlight">{COPY.result.signatureTag}</span>}
        <span className="flex items-start justify-between gap-3">
          <span className={signature ? "font-display text-2xl leading-tight" : "font-semibold"}>{trait.title}</span>
          <span aria-hidden className="text-xs text-muted">{open ? "-" : "why?"}</span>
        </span>
        <span className={`mt-1 block text-muted ${signature ? "text-base" : "text-sm"}`}>{trait.description}</span>
        {open && fact && (
          <span className="mt-3 block rounded-lg border border-highlight/40 bg-highlight/10 px-3 py-2 text-sm [overflow-wrap:anywhere]">
            <span className="font-semibold text-highlight">{COPY.evidenceLabel}</span>
            <span className="text-muted"> ({COPY.result.origins[factOrigin(fact.id)]})</span>: {fact.label}: {fact.value}
          </span>
        )}
      </button>
    </motion.li>
  );
}
