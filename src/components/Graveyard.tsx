// OWNER: Builder B. Fixed backdrop: stars, moon, and a graveyard skyline along the bottom.
// Colours come from the --art-* tokens in src/styles/theme.css.
import { ART } from "@/components/Monster/art";

const STARS: [number, number, number][] = [
  [6, 8, 1.2], [14, 22, 0.8], [23, 6, 1], [31, 15, 0.7], [44, 9, 1.1], [52, 24, 0.8], [61, 5, 0.9],
  [68, 19, 1.2], [92, 26, 0.8], [97, 10, 1], [38, 30, 0.6], [74, 33, 0.7], [9, 36, 0.8], [57, 38, 0.6],
];

export function Graveyard() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {STARS.map(([left, top, size], i) => (
        <span
          key={i}
          className="gd-twinkle absolute rounded-full"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: size * 3,
            height: size * 3,
            background: ART.star,
            animationDelay: `${i * 0.37}s`,
          }}
        />
      ))}
      <div
        className="absolute right-[10%] top-[6%] h-20 w-20 rounded-full opacity-90 sm:h-28 sm:w-28"
        style={{ background: ART.moon, boxShadow: `0 0 80px 30px ${ART.moonGlow}` }}
      />

      <svg
        className="absolute bottom-0 left-0 h-[28vh] min-h-40 w-full"
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax slice"
      >
        <path d="M0 170 Q300 140 600 165 T1200 155 L1200 220 L0 220 Z" fill={ART.hill} />
        <g fill={ART.silhouette}>
          {/* dead tree */}
          <path d="M1010 200 L1018 110 L990 80 L996 76 L1020 100 L1024 60 L1030 60 L1028 104 L1056 70 L1062 74 L1032 116 L1034 200 Z" />
          {/* headstones and crosses */}
          <path d="M120 200 L120 150 Q140 128 160 150 L160 200 Z" />
          <path d="M240 200 L240 162 Q254 148 268 162 L268 200 Z" />
          <path d="M372 200 L372 140 L360 140 L360 128 L372 128 L372 114 L386 114 L386 128 L398 128 L398 140 L386 140 L386 200 Z" />
          <path d="M500 200 L500 156 Q524 132 548 156 L548 200 Z" />
          <path d="M700 200 L700 160 Q716 144 732 160 L732 200 Z" />
          <path d="M840 200 L840 134 L828 134 L828 122 L840 122 L840 106 L854 106 L854 122 L866 122 L866 134 L854 134 L854 200 Z" />
          <path d="M1120 200 L1120 152 Q1140 130 1160 152 L1160 200 Z" />
          <path d="M0 196 Q600 176 1200 192 L1200 220 L0 220 Z" />
        </g>
        <ellipse className="gd-drift" cx="300" cy="200" rx="360" ry="22" fill={ART.fog} opacity="0.07" />
        <ellipse className="gd-drift" style={{ animationDelay: "2s" }} cx="900" cy="206" rx="380" ry="20" fill={ART.fog} opacity="0.06" />
      </svg>
    </div>
  );
}
