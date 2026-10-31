// OWNER: Builder B. Procedural SVG monster assembled from Character parts.
// Layers, back to front: glow, back aura, signature (back), body, eyes, accessories, signature (front), front aura.
// Pass the repo's `facts` to add its signature part (see signature.ts); without them the monster has none.
// Pass `stage` to draw a partly built monster (used by the monster lab); leave it out for the finished one.
"use client";
import { useId, useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Character, Fact } from "@/lib/contract";
import { ART } from "./art";
import { BODIES, type Colors } from "./bodies";
import { Accessories, AuraBack, AuraFront, Eyes } from "./parts";
import { SignaturePart } from "./SignaturePart";
import { signatureOf } from "./signature";
import { BUILD_STAGES, type BuildStage } from "./stages";

type Props = {
  character: Character;
  size?: number;
  animated?: boolean;
  /** How many BUILD_STAGES are done (0-5). Undefined draws the finished monster with no entry animation. */
  stage?: number;
  /** The repo's facts. Picks and labels the signature part; it is built in the lab's "extras" step. */
  facts?: Fact[];
  className?: string;
};

const FRAME_COLORS: Colors = { body: ART.labFrame, accent: ART.labFrame, third: ART.labFrame };
const POP = { type: "spring", stiffness: 260, damping: 16 } as const;

export function Monster({ character, size = 280, animated = true, stage, facts, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const glowId = `${uid}-glow`;
  const haloId = `${uid}-halo`;
  const fillId = `${uid}-fill`;
  const [body = ART.defaultBody, accent = ART.defaultAccent, third] = character.palette;
  const colors: Colors = { body, accent, third: third ?? accent };
  const { anchors, draw } = BODIES[character.archetype];
  const signature = useMemo(() => (facts ? signatureOf(character, facts) : null), [character, facts]);

  const building = stage !== undefined;
  const done = (part: BuildStage) => !building || stage > BUILD_STAGES.indexOf(part);

  /** In the lab each part animates in when it first appears; the finished monster renders plain. */
  const enter = (part: string, from: Record<string, number>, children: ReactNode, transition: object = POP) =>
    building ? (
      <motion.g key={part} initial={from} animate={{ opacity: 1, x: 0, y: 0, scale: 1, scaleY: 1 }} transition={transition}>
        {children}
      </motion.g>
    ) : (
      children
    );

  /** The signature part arrives with the extras; scale grows it out from the monster's centre. */
  const signatureLayer = (layer: "back" | "front") =>
    signature &&
    done("accessories") &&
    enter(
      `signature-${layer}`,
      { opacity: 0, scale: 0.6 },
      <SignaturePart signature={signature} colors={colors} layer={layer} glowId={glowId} animated={animated} />,
      { duration: 0.7 },
    );

  const eyes = <Eyes style={character.eyes} at={anchors.eyes} colors={colors} glowId={glowId} />;
  const accessories = (
    <Accessories items={character.accessories} archetype={character.archetype} anchors={anchors} colors={colors} glowId={glowId} />
  );

  return (
    <svg
      viewBox="0 0 240 280"
      width={size}
      height={(size * 280) / 240}
      role="img"
      aria-label={`${character.name}, a ${character.archetype.replace("-", " ")}`}
      className={`overflow-visible ${className ?? ""}`}
    >
      <defs>
        <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={haloId}>
          <stop offset="0%" stopColor={colors.accent} stopOpacity={0.45} />
          <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
        </radialGradient>
        {building && (
          <clipPath id={fillId} clipPathUnits="userSpaceOnUse">
            {/* Ectoplasm rises from the feet up. */}
            <motion.rect
              x={-20}
              width={280}
              height={320}
              initial={{ y: 290 }}
              animate={{ y: done("ectoplasm") ? -20 : 290 }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            />
          </clipPath>
        )}
      </defs>

      {done("aura") &&
        enter("halo", { opacity: 0, scale: 0.4 }, <ellipse cx={120} cy={150} rx={120} ry={130} fill={`url(#${haloId})`} />, {
          duration: 0.7,
        })}
      <ellipse cx={120} cy={262} rx={74} ry={9} fill={ART.groundShadow} opacity={0.4} />
      {done("aura") && enter("aura-back", { opacity: 0 }, <AuraBack aura={character.aura} colors={colors} />, { duration: 0.6 })}
      <g className={animated ? "gd-float" : undefined}>
        {signatureLayer("back")}
        {building ? (
          <>
            {done("frame") && enter("frame", { opacity: 0, scaleY: 0.3, y: 30 }, draw(FRAME_COLORS))}
            <g clipPath={`url(#${fillId})`}>{draw(colors)}</g>
          </>
        ) : (
          draw(colors)
        )}
        {done("eyes") && enter("eyes", { opacity: 0, scale: 0 }, eyes)}
        {done("accessories") && enter("accessories", { opacity: 0, y: -60 }, accessories, { ...POP, damping: 11 })}
        {signatureLayer("front")}
      </g>
      {done("aura") && enter("aura-front", { opacity: 0 }, <AuraFront aura={character.aura} colors={colors} />, { duration: 0.6 })}
    </svg>
  );
}
