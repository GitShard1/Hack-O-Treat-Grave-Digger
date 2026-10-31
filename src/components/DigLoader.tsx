// OWNER: Builder B. Loading state: a shovel digging, with rotating status lines.
"use client";
import { useEffect, useState } from "react";
import { COPY } from "@/content/copy";
import { ART } from "@/components/Monster/art";

export function DigLoader() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLine((n) => (n + 1) % COPY.loading.length), 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div role="status" aria-live="polite" className="mx-auto flex max-w-xl flex-col items-center gap-3 py-8">
      <svg viewBox="0 0 120 90" width={120} height={90} aria-hidden>
        <path d="M10 82 Q60 52 110 82 Z" fill={ART.hill} stroke={ART.outline} strokeWidth={3} />
        <g className="gd-dig">
          <rect x={56} y={8} width={6} height={50} rx={3} fill={ART.candleShade} stroke={ART.outline} strokeWidth={2} />
          <path d="M50 56 L68 56 L66 76 Q59 82 52 76 Z" fill={ART.metal} stroke={ART.outline} strokeWidth={3} />
        </g>
      </svg>
      <p className="text-center text-muted">{COPY.loading[line]}</p>
    </div>
  );
}
