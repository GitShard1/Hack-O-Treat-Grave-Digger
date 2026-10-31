// OWNER: Builder B. Dev-only control on /lab: replay the monster lab sequence for any sample result.
"use client";
import { useState } from "react";
import type { SummonSuccess } from "@/lib/contract";
import { SummonReveal } from "./SummonReveal";

export function LabReplay({ samples }: { samples: SummonSuccess[] }) {
  const [run, setRun] = useState<{ result: SummonSuccess; id: number } | null>(null);
  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-muted">Play the build sequence:</span>
        {samples.map((sample) => (
          <button
            key={sample.facts.repo}
            type="button"
            onClick={() => setRun({ result: sample, id: Date.now() })}
            className="rounded-full border border-line px-3 py-1 text-muted hover:border-highlight hover:text-ink"
          >
            {sample.facts.repo}
          </button>
        ))}
      </div>
      {run && (
        <div className="mt-6">
          <SummonReveal key={run.id} result={run.result} />
        </div>
      )}
    </section>
  );
}
