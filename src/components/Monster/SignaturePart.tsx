// OWNER: Builder B. The big signature part that makes each monster about its repo: a wireframe cage,
// one continuous filament, an orbiting swarm of data tablets, a rig of labelled limbs, or a ring of words.
// Drawn in two layers so parts can pass behind and in front of the body. Same 240 x 280 canvas as bodies.tsx.
"use client";
import { useEffect, useState } from "react";
import { ART } from "./art";
import type { Colors } from "./bodies";
import type { Signature } from "./signature";

type Layer = "back" | "front";
type Props = { signature: Signature; colors: Colors; layer: Layer; glowId: string; animated: boolean };

const CENTER = { x: 120, y: 155 };
/** One decimal place, so server and browser render the same numbers (no hydration mismatch). */
const r1 = (n: number) => Math.round(n * 10) / 10;
const LABEL = { fontFamily: "var(--font-sans)", paintOrder: "stroke" as const, stroke: ART.outline, strokeWidth: 3 };

/** Seconds since mount, updated every frame. Stays at 0 when not animated or the viewer prefers less motion. */
function useClock(animated: boolean): number {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!animated || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated]);
  return time;
}

export function SignaturePart({ signature, colors, layer, glowId, animated }: Props) {
  const time = useClock(animated);
  const phase = (signature.seed % 628) / 100; // 0-2 pi, stable per repo
  return (
    <g aria-hidden>
      {signature.motif === "filament" && <Filament layer={layer} colors={colors} glowId={glowId} phase={phase} animated={animated} />}
      {signature.motif === "swarm" && <Swarm layer={layer} colors={colors} labels={signature.labels} angle={phase + time * 0.35} />}
      {signature.motif === "rig" && <Rig layer={layer} colors={colors} labels={signature.labels} time={time} seed={signature.seed} />}
      {signature.motif === "glyphs" && <Glyphs layer={layer} colors={colors} labels={signature.labels} angle={phase + time * 0.3} />}
      {(signature.motif === "cage" || signature.cage) && (
        <Cage layer={layer} colors={colors} glowId={glowId} angle={phase + time * 0.6} />
      )}
    </g>
  );
}

// ---------- cage: a rotating wireframe cube around the monster ----------

const CUBE = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as const)));
const CUBE_EDGES = CUBE.flatMap((a, i) =>
  CUBE.slice(i + 1).flatMap((b, j) => (a.filter((v, k) => v !== b[k]).length === 1 ? [[i, i + 1 + j] as const] : [])),
);

function Cage({ layer, colors, glowId, angle }: { layer: Layer; colors: Colors; glowId: string; angle: number }) {
  const tilt = 0.45;
  const r = 96;
  const points = CUBE.map(([x, y, z]) => {
    const x1 = x * Math.cos(angle) + z * Math.sin(angle);
    const z1 = -x * Math.sin(angle) + z * Math.cos(angle);
    const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
    const f = 1 + z2 * 0.16;
    return { x: r1(CENTER.x + x1 * r * f), y: r1(CENTER.y + y2 * r * 0.92 * f), z: z2 };
  });
  return (
    <g filter={layer === "front" ? `url(#${glowId})` : undefined}>
      {CUBE_EDGES.map(([i, j]) => {
        const a = points[i];
        const b = points[j];
        if (!a || !b) return null;
        const z = (a.z + b.z) / 2;
        if ((layer === "back") !== z < 0) return null;
        return (
          <line
            key={`${i}-${j}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={colors.accent}
            strokeWidth={layer === "front" ? 3 : 2}
            strokeLinecap="round"
            opacity={layer === "front" ? 0.95 : 0.4}
          />
        );
      })}
      {points.map((p, i) =>
        (layer === "back") === p.z < 0 ? <circle key={i} cx={p.x} cy={p.y} r={layer === "front" ? 4 : 3} fill={ART.sketch} /> : null,
      )}
    </g>
  );
}

// ---------- filament: one unbroken line knotted through the whole body ----------

function filamentPath(phase: number): string {
  const steps = 180;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = CENTER.x + 70 * Math.sin(2 * t + phase) + 16 * Math.sin(5 * t);
    const y = CENTER.y + 82 * Math.sin(3 * t) + 10 * Math.cos(4 * t + phase);
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${points.join(" L")} Z`;
}

function Filament({
  layer,
  colors,
  glowId,
  phase,
  animated,
}: {
  layer: Layer;
  colors: Colors;
  glowId: string;
  phase: number;
  animated: boolean;
}) {
  const d = filamentPath(phase);
  if (layer === "back") {
    return <path d={d} fill="none" stroke={ART.outline} strokeWidth={13} strokeLinejoin="round" opacity={0.7} />;
  }
  return (
    <g filter={`url(#${glowId})`}>
      <path d={d} fill="none" stroke={colors.accent} strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
      <path
        d={d}
        fill="none"
        stroke={ART.sketch}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray="22 46"
        className={animated ? "gd-flow" : undefined}
      />
    </g>
  );
}

// ---------- swarm: data tablets orbiting a small body ----------

function Swarm({ layer, colors, labels, angle }: { layer: Layer; colors: Colors; labels: string[]; angle: number }) {
  const rings = [
    { count: 11, rx: 118, ry: 34, cy: 182, dir: 1 },
    { count: 8, rx: 92, ry: 26, cy: 92, dir: -1.3 },
  ];
  return (
    <g>
      {rings.flatMap((ring, r) =>
        Array.from({ length: ring.count }, (_, i) => {
          const a = angle * ring.dir + (i / ring.count) * Math.PI * 2;
          const z = Math.sin(a);
          if ((layer === "back") !== z < 0) return null;
          const s = 0.7 + 0.3 * ((z + 1) / 2);
          const x = CENTER.x + Math.cos(a) * ring.rx;
          const y = ring.cy + z * ring.ry;
          const label = labels[(i + r) % Math.max(labels.length, 1)];
          return (
            <g key={`${r}-${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`} opacity={layer === "back" ? 0.55 : 1}>
              <rect x={-17} y={-12} width={34} height={24} rx={4} fill={ART.night} stroke={colors.accent} strokeWidth={2.5} />
              <path d="M-11 -5 H11 M-11 1 H6" stroke={colors.accent} strokeWidth={1.5} opacity={0.6} />
              {label && (
                <text y={9} textAnchor="middle" fontSize={7.5} fill={ART.sketch} fontFamily="var(--font-sans)">
                  {label}
                </text>
              )}
            </g>
          );
        }),
      )}
    </g>
  );
}

// ---------- rig: articulated limbs, one per real file name ----------

function Rig({ layer, colors, labels, time, seed }: { layer: Layer; colors: Colors; labels: string[]; time: number; seed: number }) {
  const socket = { x: CENTER.x, y: CENTER.y + 15 };
  const count = Math.max(labels.length, 4);
  const limbs = Array.from({ length: count }, (_, i) => {
    const spread = (i / (count - 1)) * 200 - 190; // degrees, from left-down round the top to right-down
    const sway = Math.sin(time * 1.7 + i * 1.3 + (seed % 7)) * 6;
    const base = ((spread + sway) * Math.PI) / 180;
    // Elbows bend away from the middle so neighbouring tips (and their labels) spread apart.
    const bend = (((Math.cos(base) < 0 ? -28 : 28) + Math.sin(time * 2.3 + i) * 10) * Math.PI) / 180;
    const elbow = { x: r1(socket.x + Math.cos(base) * 86), y: r1(socket.y + Math.sin(base) * 86) };
    const tip = { x: r1(elbow.x + Math.cos(base + bend) * 58), y: r1(elbow.y + Math.sin(base + bend) * 58) };
    return { elbow, tip, label: labels[i], out: base + bend };
  });

  if (layer === "back") {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        {limbs.map(({ elbow, tip }, i) => {
          const d = `M${socket.x} ${socket.y} L${elbow.x.toFixed(1)} ${elbow.y.toFixed(1)} L${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={ART.outline} strokeWidth={11} />
              <path d={d} fill="none" stroke={i % 2 === 0 ? colors.accent : colors.third} strokeWidth={6} />
              <circle cx={elbow.x} cy={elbow.y} r={6} fill={ART.metal} stroke={ART.outline} strokeWidth={3} />
              <path
                d={`M${tip.x - 7} ${tip.y - 7} L${tip.x} ${tip.y} L${tip.x + 7} ${tip.y - 7}`}
                fill="none"
                stroke={ART.metal}
                strokeWidth={3}
              />
            </g>
          );
        })}
      </g>
    );
  }
  return (
    <g>
      {limbs.map(({ tip, label, out }, i) =>
        label ? (
          <text
            key={i}
            x={r1(tip.x + Math.cos(out) * 10)}
            y={r1(tip.y + Math.sin(out) * 10 + 3)}
            textAnchor={Math.cos(out) < -0.3 ? "end" : Math.cos(out) > 0.3 ? "start" : "middle"}
            fontSize={11}
            fill={ART.sketch}
            {...LABEL}
          >
            {label}
          </text>
        ) : null,
      )}
    </g>
  );
}

// ---------- glyphs: words from the signature fact circling the monster ----------

function Glyphs({ layer, colors, labels, angle }: { layer: Layer; colors: Colors; labels: string[]; angle: number }) {
  if (labels.length === 0) return null;
  const words = labels.length < 5 ? [...labels, ...labels] : labels;
  return (
    <g>
      {words.map((word, i) => {
        const a = angle + (i / words.length) * Math.PI * 2;
        const z = Math.sin(a);
        if ((layer === "back") !== z < 0) return null;
        return (
          <text
            key={i}
            x={r1(CENTER.x + Math.cos(a) * 112)}
            y={r1(140 + z * 30)}
            textAnchor="middle"
            fontSize={r1(9 + z * 2)}
            fill={i % 2 === 0 ? colors.accent : ART.sketch}
            opacity={layer === "back" ? 0.45 : 1}
            {...LABEL}
          >
            {word}
          </text>
        );
      })}
    </g>
  );
}
