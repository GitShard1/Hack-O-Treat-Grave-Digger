// OWNER: Builder B. What plays after a summon: the monster lab, then the result card it morphs into.
// With reduced motion, it goes straight to the result card. Give it a new `key` per result so it replays.
"use client";
import { useEffect, useRef, useState } from "react";
import { LayoutGroup, useReducedMotion } from "framer-motion";
import type { SummonSuccess } from "@/lib/contract";
import { ResultCard } from "@/components/ResultCard";
import type { Rect } from "./Handoff";
import { LabSequence } from "./LabSequence";

export function SummonReveal({ result }: { result: SummonSuccess }) {
  const reduceMotion = useReducedMotion();
  const [handoff, setHandoff] = useState<{ monsterFrom: Rect | null } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [reduceMotion]);

  return (
    <div ref={rootRef} className="scroll-mt-4">
      <LayoutGroup>
        {reduceMotion ? (
          <ResultCard result={result} />
        ) : handoff ? (
          <ResultCard result={result} handoff={handoff} />
        ) : (
          <LabSequence result={result} onDone={(monsterFrom) => setHandoff({ monsterFrom })} />
        )}
      </LayoutGroup>
    </div>
  );
}
