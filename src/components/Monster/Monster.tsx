// OWNER: Builder B. Procedural SVG monster assembled from Character parts.
// Layers, back to front: glow, back aura, body, eyes, accessories, front aura.
"use client";
import { useId } from "react";
import type { Character } from "@/lib/contract";
import { ART } from "./art";
import { BODIES, type Colors } from "./bodies";
import { Accessories, AuraBack, AuraFront, Eyes } from "./parts";

type Props = { character: Character; size?: number; animated?: boolean };

export function Monster({ character, size = 280, animated = true }: Props) {
  const uid = useId().replace(/:/g, "");
  const glowId = `${uid}-glow`;
  const haloId = `${uid}-halo`;
  const [body = ART.defaultBody, accent = ART.defaultAccent, third] = character.palette;
  const colors: Colors = { body, accent, third: third ?? accent };
  const { anchors, draw } = BODIES[character.archetype];

  return (
    <svg
      viewBox="0 0 240 280"
      width={size}
      height={(size * 280) / 240}
      role="img"
      aria-label={`${character.name}, a ${character.archetype.replace("-", " ")}`}
      className="overflow-visible"
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
      </defs>

      <ellipse cx={120} cy={150} rx={120} ry={130} fill={`url(#${haloId})`} />
      <ellipse cx={120} cy={262} rx={74} ry={9} fill={ART.groundShadow} opacity={0.4} />
      <AuraBack aura={character.aura} colors={colors} />
      <g className={animated ? "gd-float" : undefined}>
        {draw(colors)}
        <Eyes style={character.eyes} at={anchors.eyes} colors={colors} glowId={glowId} />
        <Accessories
          items={character.accessories}
          archetype={character.archetype}
          anchors={anchors}
          colors={colors}
          glowId={glowId}
        />
      </g>
      <AuraFront aura={character.aura} colors={colors} />
    </svg>
  );
}
