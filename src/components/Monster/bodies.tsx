// OWNER: Builder B. One body per archetype, in a shared 240 x 280 canvas.
// Every body also says where the eyes, head top, neck and hand are, so parts can attach to any body.
import type { ReactNode } from "react";
import type { Archetype } from "@/lib/contract";
import { ART } from "./art";

export const OUTLINE = ART.outline;
export const NIGHT = ART.night;
const STROKE = { stroke: OUTLINE, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const SHADE = { fill: ART.shade, opacity: 0.16 };

export type Colors = { body: string; accent: string; third: string };

export type Anchors = {
  eyes: { x: number; y: number; gap: number; size: number };
  headTop: { x: number; y: number };
  neck: { x: number; y: number; width: number };
  hand: { x: number; y: number };
};

type Body = { anchors: Anchors; draw: (c: Colors) => ReactNode };

const ghost: Body = {
  anchors: {
    eyes: { x: 120, y: 116, gap: 24, size: 12 },
    headTop: { x: 120, y: 66 },
    neck: { x: 120, y: 176, width: 96 },
    hand: { x: 194, y: 184 },
  },
  draw: (c) => (
    <>
      <path d="M66 150 Q38 160 42 188 Q58 180 72 172" fill={c.body} {...STROKE} />
      <path d="M174 150 Q202 160 198 188 Q182 180 168 172" fill={c.body} {...STROKE} />
      <path
        d="M62 258 C58 170 66 70 120 64 C174 70 182 170 178 258 Q168 244 158 258 Q148 244 138 258 Q128 244 118 258 Q108 244 98 258 Q88 244 78 258 Q70 246 62 258 Z"
        fill={c.body}
        {...STROKE}
      />
      <path d="M150 82 C172 104 176 180 172 248 L160 250 C164 180 160 112 150 82 Z" {...SHADE} />
      <ellipse cx={120} cy={160} rx={12} ry={16} fill={OUTLINE} />
    </>
  ),
};

const zombie: Body = {
  anchors: {
    eyes: { x: 120, y: 98, gap: 20, size: 11 },
    headTop: { x: 120, y: 64 },
    neck: { x: 120, y: 146, width: 80 },
    hand: { x: 214, y: 156 },
  },
  draw: (c) => (
    <>
      <rect x={92} y={208} width={22} height={50} rx={6} fill={c.third} {...STROKE} />
      <rect x={126} y={208} width={22} height={50} rx={6} fill={c.third} {...STROKE} />
      <rect x={76} y={140} width={88} height={82} rx={16} fill={c.accent} {...STROKE} />
      <path d="M90 222 L98 206 L106 222 L116 204 L126 222 L136 206 L146 222" fill="none" {...STROKE} strokeWidth={3} />
      <rect x={150} y={146} width={64} height={20} rx={9} fill={c.body} {...STROKE} />
      <rect x={150} y={172} width={58} height={18} rx={9} fill={c.body} {...STROKE} />
      <rect x={84} y={62} width={72} height={82} rx={20} fill={c.body} {...STROKE} />
      <rect x={136} y={66} width={16} height={74} rx={8} {...SHADE} />
      <path d="M92 80 L148 76" fill="none" {...STROKE} strokeWidth={3} />
      {[100, 112, 124, 136].map((x) => (
        <path key={x} d={`M${x} 72 L${x + 2} 84`} fill="none" {...STROKE} strokeWidth={3} />
      ))}
      <path d="M100 122 L108 128 L116 122 L124 128 L132 122 L140 128" fill="none" {...STROKE} strokeWidth={4} />
    </>
  ),
};

const golem: Body = {
  anchors: {
    eyes: { x: 121, y: 92, gap: 20, size: 10 },
    headTop: { x: 121, y: 66 },
    neck: { x: 120, y: 126, width: 84 },
    hand: { x: 212, y: 214 },
  },
  draw: (c) => (
    <>
      <path d="M84 220 L114 218 L116 258 L80 258 Z" fill={c.body} {...STROKE} />
      <path d="M126 218 L156 220 L160 258 L124 258 Z" fill={c.body} {...STROKE} />
      <path d="M84 220 L114 218 L116 258 L80 258 Z" {...SHADE} />
      <path d="M60 146 L36 170 L34 214 L58 222 L72 190 Z" fill={c.body} {...STROKE} />
      <path d="M184 146 L208 168 L212 212 L188 220 L172 188 Z" fill={c.body} {...STROKE} />
      <path d="M60 140 L100 118 L150 120 L184 146 L176 224 L64 226 Z" fill={c.body} {...STROKE} />
      <path d="M150 120 L184 146 L176 224 L150 224 Z" {...SHADE} />
      <path d="M100 140 L110 160 L102 178 L114 200" fill="none" {...STROKE} strokeWidth={3} />
      <path d="M150 152 L160 172 L154 188" fill="none" {...STROKE} strokeWidth={3} />
      <circle cx={126} cy={176} r={11} fill={c.accent} {...STROKE} strokeWidth={4} />
      <path d="M96 66 L146 64 L156 92 L150 122 L92 124 L86 94 Z" fill={c.body} {...STROKE} />
      <rect x={106} y={106} width={30} height={7} rx={2} fill={OUTLINE} />
    </>
  ),
};

const vampire: Body = {
  anchors: {
    eyes: { x: 120, y: 106, gap: 20, size: 10 },
    headTop: { x: 120, y: 68 },
    neck: { x: 120, y: 152, width: 60 },
    hand: { x: 188, y: 214 },
  },
  draw: (c) => (
    <>
      <path d="M120 120 L40 258 L200 258 Z" fill={NIGHT} {...STROKE} />
      <path d="M120 134 L70 258 L170 258 Z" fill={c.accent} />
      <path d="M92 150 L148 150 L160 258 L80 258 Z" fill={NIGHT} {...STROKE} />
      <path d="M108 150 L132 150 L120 190 Z" fill={ART.eye} {...STROKE} strokeWidth={3} />
      <path d="M90 152 L58 102 L104 140 Z" fill={c.accent} {...STROKE} />
      <path d="M150 152 L182 102 L136 140 Z" fill={c.accent} {...STROKE} />
      <ellipse cx={120} cy={108} rx={34} ry={40} fill={c.body} {...STROKE} />
      <path d="M86 100 C84 64 156 64 154 100 C146 84 134 80 120 94 C106 80 94 84 86 100 Z" fill={OUTLINE} />
      <path d="M108 128 Q120 136 132 128" fill="none" {...STROKE} strokeWidth={3} />
      <path d="M111 130 L114 140 L118 131 Z" fill={ART.eye} stroke={OUTLINE} strokeWidth={1.5} />
      <path d="M122 131 L126 140 L129 130 Z" fill={ART.eye} stroke={OUTLINE} strokeWidth={1.5} />
    </>
  ),
};

const witch: Body = {
  anchors: {
    eyes: { x: 120, y: 118, gap: 18, size: 9 },
    headTop: { x: 130, y: 24 },
    neck: { x: 120, y: 154, width: 56 },
    hand: { x: 178, y: 200 },
  },
  draw: (c) => (
    <>
      <path d="M120 142 L64 258 L176 258 Z" fill={c.body} {...STROKE} />
      <path d="M120 142 L150 258 L176 258 Z" {...SHADE} />
      <path d="M72 246 L168 246" fill="none" stroke={c.third} strokeWidth={6} />
      <circle cx={68} cy={196} r={10} fill={c.accent} {...STROKE} strokeWidth={4} />
      <circle cx={174} cy={196} r={10} fill={c.accent} {...STROKE} strokeWidth={4} />
      <circle cx={120} cy={124} r={30} fill={c.accent} {...STROKE} />
      <path d="M120 124 L134 136 L120 136" fill={c.accent} {...STROKE} strokeWidth={3} />
      <path d="M106 142 Q120 150 134 142" fill="none" {...STROKE} strokeWidth={3} />
      <ellipse cx={120} cy={96} rx={54} ry={10} fill={NIGHT} {...STROKE} />
      <path d="M88 96 L128 24 Q148 18 156 34 Q142 30 136 40 L152 96 Z" fill={NIGHT} {...STROKE} />
      <path d="M92 84 L148 84 L150 96 L90 96 Z" fill={c.third} {...STROKE} strokeWidth={3} />
    </>
  ),
};

const swampThing: Body = {
  anchors: {
    eyes: { x: 120, y: 164, gap: 26, size: 12 },
    headTop: { x: 120, y: 110 },
    neck: { x: 120, y: 196, width: 120 },
    hand: { x: 208, y: 234 },
  },
  draw: (c) => (
    <>
      <path d="M54 196 Q26 208 30 244" fill="none" stroke={OUTLINE} strokeWidth={20} strokeLinecap="round" />
      <path d="M54 196 Q26 208 30 244" fill="none" stroke={c.body} strokeWidth={11} strokeLinecap="round" />
      <path d="M186 196 Q214 208 208 236" fill="none" stroke={OUTLINE} strokeWidth={20} strokeLinecap="round" />
      <path d="M186 196 Q214 208 208 236" fill="none" stroke={c.body} strokeWidth={11} strokeLinecap="round" />
      <circle cx={80} cy={152} r={16} fill={c.body} {...STROKE} />
      <circle cx={164} cy={158} r={18} fill={c.body} {...STROKE} />
      <path
        d="M44 258 C38 200 60 140 98 122 C112 104 136 104 150 122 C186 140 206 200 198 258 Z"
        fill={c.body}
        {...STROKE}
      />
      <path d="M160 140 C186 160 200 210 196 254 L176 256 C180 212 176 170 160 140 Z" {...SHADE} />
      <path d="M70 172 Q64 198 74 218" fill="none" stroke={c.accent} strokeWidth={6} strokeLinecap="round" />
      <path d="M170 180 Q178 204 168 226" fill="none" stroke={c.accent} strokeWidth={6} strokeLinecap="round" />
      <path d="M120 112 Q114 130 124 146" fill="none" stroke={c.accent} strokeWidth={6} strokeLinecap="round" />
      <path d="M96 204 Q120 222 144 204" fill="none" {...STROKE} />
    </>
  ),
};

export const BODIES: Record<Archetype, Body> = {
  ghost,
  zombie,
  golem,
  vampire,
  witch,
  "swamp-thing": swampThing,
};
