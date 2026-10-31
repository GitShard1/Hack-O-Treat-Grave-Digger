// OWNER: Builder B. Shows a trait and, on click, the real repo fact behind it.
"use client";
import { useState } from "react";
import type { Fact, Trait } from "@/lib/contract";

type Props = { trait: Trait; fact: Fact | undefined };

export function TraitChip({ trait, fact }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-white/15 bg-white/5 p-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full text-left">
        <span className="font-semibold">{trait.title}</span>
        <span className="block text-sm opacity-80">{trait.description}</span>
      </button>
      {open && fact && (
        <p className="mt-2 text-xs opacity-70">
          Evidence: {fact.label}: {fact.value}
        </p>
      )}
    </li>
  );
}
