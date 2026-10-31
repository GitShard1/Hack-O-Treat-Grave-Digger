// OWNER: Builder B. Procedural SVG monster assembled from Character parts.
// TODO(B): real part library (bodies per archetype, eye sets, accessories, auras) in one papercut style.
import type { Character } from "@/lib/contract";

type Props = { character: Character; size?: number };

export function Monster({ character, size = 240 }: Props) {
  const [body, accent = "#f97316"] = character.palette;
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`${character.name}, a ${character.archetype}`}
    >
      {/* Placeholder body: replace per archetype */}
      <path
        d="M40 180 Q40 40 100 40 Q160 40 160 180 L140 165 L120 180 L100 165 L80 180 L60 165 Z"
        fill={body}
        stroke="#0b0b10"
        strokeWidth={5}
      />
      <circle cx={80} cy={95} r={10} fill={accent} stroke="#0b0b10" strokeWidth={3} />
      <circle cx={120} cy={95} r={10} fill={accent} stroke="#0b0b10" strokeWidth={3} />
    </svg>
  );
}
