// OWNER: Builder B. Lab set pieces around the monster: floor grid, pedestal, glass capsule, robot arms,
// welding sparks and foreground cables. All sizes are in lab pixels so they line up with the monster.
"use client";
import { motion } from "framer-motion";
import { ART, SKETCH_FILTER } from "@/components/Monster/art";
import type { Box, Point } from "./camera";

const OUTLINE = { stroke: ART.outline, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** A floor plane hinged at the monster's feet and tilted toward the viewer, so the grid recedes in 3D. */
export function Floor({ box, y }: { box: Box; y: number }) {
  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        left: -box.w * 0.5,
        width: box.w * 2,
        top: y,
        height: box.h,
        transformOrigin: "50% 0",
        transform: "rotateX(78deg)",
        backgroundImage: `linear-gradient(${ART.labFloorGrid} 2px, transparent 2px), linear-gradient(90deg, ${ART.labFloorGrid} 2px, transparent 2px)`,
        backgroundSize: "46px 46px",
        backgroundPosition: "center top",
        maskImage: "radial-gradient(ellipse 50% 70% at 50% 0%, black 30%, transparent 75%)",
      }}
    />
  );
}

export function Pedestal({ center, width }: { center: Point; width: number }) {
  return (
    <svg
      aria-hidden
      className="absolute overflow-visible"
      style={{ left: center.x - width / 2, top: center.y - width * 0.12, width, height: width * 0.3 }}
      viewBox="0 0 100 30"
    >
      <g filter={SKETCH_FILTER}>
        <path d="M4 12 L4 20 Q50 34 96 20 L96 12" fill={ART.labSteel} {...OUTLINE} strokeWidth={2} />
        <ellipse cx={50} cy={12} rx={46} ry={9} fill={ART.labSteelLight} {...OUTLINE} strokeWidth={2} />
        <ellipse cx={50} cy={12} rx={36} ry={6} fill="none" stroke={ART.labScreenText} strokeWidth={1.5} opacity={0.7} />
      </g>
    </svg>
  );
}

type CapsuleProps = { center: Point; floorY: number; size: number; filled: boolean; liquid: string; lift: boolean };

/** Glass tube around the monster. Bubbles start once the ectoplasm is in; it lifts away in the finale. */
export function Capsule({ center, floorY, size, filled, liquid, lift }: CapsuleProps) {
  const w = size * 1.14;
  const h = size * 1.36;
  return (
    <motion.div
      aria-hidden
      className="absolute"
      style={{ left: center.x - w / 2, top: floorY - h + size * 0.04, width: w, height: h }}
      animate={lift ? { y: -h * 1.25, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.5, 0, 0.75, 0] }}
    >
      {filled &&
        [0.22, 0.4, 0.58, 0.76].map((x, i) => (
          <span
            key={x}
            className="gd-rise absolute rounded-full"
            style={{ left: `${x * 100}%`, bottom: "8%", width: 6 + (i % 2) * 4, height: 6 + (i % 2) * 4, background: liquid, opacity: 0.7, animationDelay: `${i * 0.5}s` }}
          />
        ))}
      <svg viewBox="0 0 100 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <rect x={5} y={7} width={90} height={106} rx={16} fill={ART.labGlass} stroke={ART.labGlassEdge} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <rect x={13} y={16} width={4} height={80} rx={2} fill={ART.labGlassEdge} opacity={0.35} />
        <rect x={20} y={16} width={1.5} height={60} rx={1} fill={ART.labGlassEdge} opacity={0.3} />
        <rect x={0} y={0} width={100} height={10} rx={3} fill={ART.labSteel} stroke={ART.outline} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        <rect x={42} y={-8} width={16} height={9} fill={ART.labSteelLight} stroke={ART.outline} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </motion.div>
  );
}

const ARM_TRANSITION = { type: "spring", stiffness: 90, damping: 15 } as const;

function Arm({ pivot, tip, side }: { pivot: Point; tip: Point; side: -1 | 1 }) {
  const elbow = { x: (pivot.x + tip.x) / 2 + side * 46, y: Math.min(pivot.y, tip.y) + Math.abs(tip.y - pivot.y) * 0.35 };
  const segment = (from: Point, to: Point, width: number, stroke: string) => (
    <motion.line
      initial={false}
      animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
      transition={ARM_TRANSITION}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
  return (
    <g>
      {segment(pivot, elbow, 13, ART.outline)}
      {segment(elbow, tip, 11, ART.outline)}
      {segment(pivot, elbow, 8, ART.labSteel)}
      {segment(elbow, tip, 6, ART.labSteelLight)}
      <motion.circle initial={false} animate={{ cx: elbow.x, cy: elbow.y }} transition={ARM_TRANSITION} r={8} fill={ART.labSteel} stroke={ART.outline} strokeWidth={3} />
      <motion.g initial={false} animate={{ x: tip.x, y: tip.y }} transition={ARM_TRANSITION}>
        <path d="M-9 -2 L-6 10 M9 -2 L6 10" stroke={ART.outline} strokeWidth={5} strokeLinecap="round" />
        <path d="M-9 -2 L-6 10 M9 -2 L6 10" stroke={ART.labSteelLight} strokeWidth={2.5} strokeLinecap="round" />
        <circle r={7} fill={ART.labSteel} stroke={ART.outline} strokeWidth={3} />
      </motion.g>
    </g>
  );
}

/** Two ceiling arms that reach for whatever is being built. `target` null = folded away. */
export function Arms({ box, target, reach }: { box: Box; target: Point | null; reach: number }) {
  const left = { x: box.w * 0.1, y: -12 };
  const right = { x: box.w * 0.9, y: -12 };
  const rest = (p: Point) => ({ x: p.x, y: box.h * 0.16 });
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible">
      <Arm pivot={left} side={-1} tip={target ? { x: target.x - reach, y: target.y - reach * 0.4 } : rest(left)} />
      <Arm pivot={right} side={1} tip={target ? { x: target.x + reach, y: target.y - reach * 0.4 } : rest(right)} />
    </svg>
  );
}

const SPARK_DIRS = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2 + 0.3);

/** A one-shot burst of welding sparks. Give it a new `key` to fire again. */
export function Sparks({ at, spread }: { at: Point; spread: number }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <motion.circle
        cx={at.x}
        cy={at.y}
        fill="none"
        stroke={ART.labSpark}
        strokeWidth={3}
        initial={{ r: 2, opacity: 0.9 }}
        animate={{ r: spread, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
      />
      {SPARK_DIRS.map((angle, i) => (
        <motion.circle
          key={angle}
          r={i % 3 === 0 ? 3 : 2}
          fill={ART.labSpark}
          initial={{ cx: at.x, cy: at.y, opacity: 1 }}
          animate={{ cx: at.x + Math.cos(angle) * spread * (0.7 + (i % 3) * 0.2), cy: at.y + Math.sin(angle) * spread * 0.8 + 10, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
        />
      ))}
    </svg>
  );
}

/** Foreground cables hanging past the lens. */
export function Cables() {
  const cable = (d: string, key: string) => (
    <g key={key}>
      <path d={d} fill="none" stroke={ART.outline} strokeWidth={13} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={ART.labSteel} strokeWidth={7} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
      <g filter={SKETCH_FILTER}>
        {cable("M-4 -2 C6 20 10 34 -3 58", "l1")}
        {cable("M2 -2 C14 12 16 18 8 30 C2 38 -2 40 -4 44", "l2")}
        {cable("M104 -2 C92 24 90 40 103 66", "r1")}
        {cable("M97 -2 C88 10 86 16 92 26", "r2")}
      </g>
    </svg>
  );
}
