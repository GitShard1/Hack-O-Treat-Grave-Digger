// OWNER: Builder B. Eyes, accessories and auras that attach to any body through its anchors.
import type { CSSProperties, ReactNode } from "react";
import type { Accessory, Archetype, Aura, EyeStyle } from "@/lib/contract";
import { ART } from "./art";
import { NIGHT, OUTLINE, type Anchors, type Colors } from "./bodies";

const EYE_WHITE = ART.eye;

export function Eyes({ style, at, colors, glowId }: { style: EyeStyle; at: Anchors["eyes"]; colors: Colors; glowId: string }) {
  const { x, y, gap, size } = at;
  const eye = (cx: number, cy: number, r: number, key: string) => (
    <g key={key}>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.15} fill={EYE_WHITE} stroke={OUTLINE} strokeWidth={3} />
      <circle cx={cx + r * 0.15} cy={cy + r * 0.2} r={r * 0.48} fill={OUTLINE} />
      <circle cx={cx - r * 0.1} cy={cy - r * 0.1} r={r * 0.16} fill={EYE_WHITE} />
    </g>
  );

  switch (style) {
    case "single":
      return eye(x, y, size * 1.6, "one");
    case "many": {
      const spots: [number, number, number][] = [
        [-1.4, 0.3, 0.6],
        [-0.55, -0.5, 0.7],
        [0.55, -0.5, 0.7],
        [1.4, 0.3, 0.6],
        [0, 0.6, 0.8],
      ];
      return <>{spots.map(([dx, dy, s], i) => eye(x + dx * gap, y + dy * gap, size * s, `m${i}`))}</>;
    }
    case "hollow":
      return (
        <>
          {[-gap, gap].map((dx) => (
            <g key={dx}>
              <ellipse cx={x + dx} cy={y} rx={size} ry={size * 1.25} fill={OUTLINE} />
              <circle cx={x + dx} cy={y + 2} r={size * 0.22} fill={colors.accent} filter={`url(#${glowId})`} />
            </g>
          ))}
        </>
      );
    case "glowing":
      return (
        <>
          {[-gap, gap].map((dx) => (
            <g key={dx}>
              <ellipse cx={x + dx} cy={y} rx={size} ry={size * 1.15} fill={colors.accent} stroke={OUTLINE} strokeWidth={3} filter={`url(#${glowId})`} />
              <ellipse cx={x + dx} cy={y} rx={size * 0.35} ry={size * 0.6} fill={EYE_WHITE} />
            </g>
          ))}
        </>
      );
    case "pair":
      return <>{[-gap, gap].map((dx) => eye(x + dx, y, size, `p${dx}`))}</>;
  }
}

function TopHat({ x, y, colors }: { x: number; y: number; colors: Colors }) {
  return (
    <g transform={`rotate(-10 ${x} ${y})`}>
      <rect x={x - 20} y={y - 42} width={40} height={44} rx={4} fill={NIGHT} stroke={OUTLINE} strokeWidth={4} />
      <rect x={x - 20} y={y - 12} width={40} height={9} fill={colors.accent} stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={x} cy={y + 2} rx={32} ry={7} fill={NIGHT} stroke={OUTLINE} strokeWidth={4} />
    </g>
  );
}

function Scarf({ at, colors }: { at: Anchors["neck"]; colors: Colors }) {
  const { x, y, width } = at;
  const left = x - width / 2;
  return (
    <g>
      <path d={`M${x + width / 5} ${y} l10 46 l18 -4 l-8 -42 Z`} fill={colors.accent} stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
      <rect x={left} y={y - 9} width={width} height={18} rx={9} fill={colors.accent} stroke={OUTLINE} strokeWidth={4} />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={left + width * f} y1={y - 7} x2={left + width * f} y2={y + 7} stroke={colors.third} strokeWidth={4} />
      ))}
    </g>
  );
}

function Chains({ at }: { at: Anchors["neck"] }) {
  const x1 = at.x - at.width / 2 + 4;
  const y1 = at.y + 4;
  const x2 = at.x + at.width / 2 + 8;
  const y2 = at.y + 64;
  const links = 9;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <g>
      {Array.from({ length: links }, (_, i) => {
        const t = i / (links - 1);
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 10;
        const flat = i % 2 === 0;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={flat ? 7 : 4}
            ry={flat ? 4.5 : 6.5}
            transform={`rotate(${angle} ${cx} ${cy})`}
            fill="none"
            stroke={ART.metal}
            strokeWidth={3.5}
          />
        );
      })}
    </g>
  );
}

function Lantern({ x, y, glowId }: { x: number; y: number; glowId: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 12} stroke={OUTLINE} strokeWidth={3} />
      <path d={`M${x - 9} ${y + 16} L${x} ${y + 9} L${x + 9} ${y + 16} Z`} fill={NIGHT} stroke={OUTLINE} strokeWidth={3} />
      <rect x={x - 11} y={y + 16} width={22} height={28} rx={4} fill={NIGHT} stroke={OUTLINE} strokeWidth={3} />
      <rect x={x - 7} y={y + 20} width={14} height={20} rx={2} fill={ART.lantern} filter={`url(#${glowId})`} />
    </g>
  );
}

function Candle({ glowId }: { glowId: string }) {
  return (
    <g>
      <rect x={30} y={222} width={14} height={38} rx={3} fill={ART.candle} stroke={OUTLINE} strokeWidth={3} />
      <path d="M30 228 q4 8 0 12" fill="none" stroke={ART.candleShade} strokeWidth={3} />
      <line x1={37} y1={222} x2={37} y2={216} stroke={OUTLINE} strokeWidth={2} />
      <ellipse className="gd-flicker" cx={37} cy={208} rx={5} ry={9} fill={ART.flame} filter={`url(#${glowId})`} />
    </g>
  );
}

function Cobwebs() {
  const strand = { stroke: ART.web, strokeWidth: 1.5, opacity: 0.55, fill: "none" };
  return (
    <g>
      {["M0 0 L70 0", "M0 0 L64 30", "M0 0 L44 52", "M0 0 L20 66", "M0 0 L0 72"].map((d) => (
        <path key={d} d={d} {...strand} />
      ))}
      {[18, 34, 52].map((r) => (
        <path key={r} d={`M${r} 0 Q${r * 0.8} ${r * 0.45} ${r * 0.65} ${r * 0.75} Q${r * 0.4} ${r * 0.85} 0 ${r}`} {...strand} />
      ))}
    </g>
  );
}

export function Accessories({
  items,
  archetype,
  anchors,
  colors,
  glowId,
}: {
  items: Accessory[];
  archetype: Archetype;
  anchors: Anchors;
  colors: Colors;
  glowId: string;
}) {
  const parts: Record<Accessory, ReactNode> = {
    // The witch already wears a hat.
    "top-hat": archetype === "witch" ? null : <TopHat x={anchors.headTop.x} y={anchors.headTop.y} colors={colors} />,
    scarf: <Scarf at={anchors.neck} colors={colors} />,
    chains: <Chains at={anchors.neck} />,
    lantern: <Lantern x={anchors.hand.x} y={anchors.hand.y} glowId={glowId} />,
    candle: <Candle glowId={glowId} />,
    cobwebs: <Cobwebs />,
  };
  return (
    <>
      {items.map((item) => (
        <g key={item}>{parts[item]}</g>
      ))}
    </>
  );
}

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

/** Drawn behind the body. */
export function AuraBack({ aura, colors }: { aura: Aura; colors: Colors }) {
  switch (aura) {
    case "embers":
      return (
        <>
          {[52, 80, 104, 140, 166, 190, 120].map((x, i) => (
            <circle key={x} className="gd-rise" style={delay(i * 0.45)} cx={x} cy={250} r={i % 2 ? 2.5 : 3.5} fill={ART.ember} />
          ))}
        </>
      );
    case "sparks":
      return (
        <>
          {[
            [40, 90],
            [200, 70],
            [28, 170],
            [214, 150],
            [60, 40],
            [182, 30],
          ].map(([x = 0, y = 0], i) => (
            <path
              key={i}
              className="gd-twinkle"
              style={delay(i * 0.3)}
              d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`}
              fill={colors.accent}
            />
          ))}
        </>
      );
    default:
      return null;
  }
}

/** Drawn in front of the body's base. */
export function AuraFront({ aura, colors }: { aura: Aura; colors: Colors }) {
  switch (aura) {
    case "fog":
      return (
        <g opacity={0.5}>
          <ellipse className="gd-drift" cx={90} cy={258} rx={90} ry={13} fill={ART.fog} opacity={0.25} />
          <ellipse className="gd-drift" style={delay(1.5)} cx={160} cy={262} rx={80} ry={11} fill={ART.fog} opacity={0.2} />
        </g>
      );
    case "drip":
      return (
        <>
          {[76, 112, 150, 172].map((x, i) => (
            <path
              key={x}
              className="gd-drip"
              style={delay(i * 0.6)}
              d={`M${x} 250 q-5 10 0 14 q5 -4 0 -14 Z`}
              fill={colors.body}
              stroke={OUTLINE}
              strokeWidth={2}
            />
          ))}
        </>
      );
    default:
      return null;
  }
}
