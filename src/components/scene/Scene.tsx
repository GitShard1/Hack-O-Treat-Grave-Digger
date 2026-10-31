// OWNER: Builder B. The full-page backdrop, built like a Live2D scene: separate layers that each
// breathe or sway on their own and drift with the pointer at different depths (parallax).
// Back to front: code rain, stars, moon, bats, far hills, graveyard with code epitaphs, fog.
"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ART, SKETCH_FILTER, SKETCH_FILTER_STRONG } from "@/components/Monster/art";
import { CodeRain } from "./CodeRain";

/** Moves a layer by up to `depth` px as the pointer moves. Needs --mx/--my on an ancestor. */
function Layer({ depth, className, children }: { depth: number; className?: string; children: ReactNode }) {
  const style: CSSProperties = {
    transform: `translate3d(calc(var(--mx, 0) * ${depth}px), calc(var(--my, 0) * ${depth * 0.6}px), 0)`,
  };
  return (
    <div className={`absolute inset-0 transition-transform duration-500 ease-out ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

const STARS: [number, number, number][] = [
  [6, 10, 1], [15, 26, 0.7], [24, 8, 0.9], [33, 18, 0.6], [46, 6, 1], [55, 22, 0.7], [63, 12, 0.8],
  [72, 30, 0.6], [90, 34, 0.8], [96, 16, 1], [40, 32, 0.6], [80, 6, 0.7], [9, 40, 0.7], [58, 40, 0.6],
];

function Stars() {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden>
      {STARS.map(([x, y, s], i) => (
        <svg key={i} x={`${x}%`} y={`${y}%`} overflow="visible">
          <path
            className="gd-twinkle"
            style={{ animationDelay: `${i * 0.31}s` }}
            d={`M0 ${-6 * s} L0 ${6 * s} M${-6 * s} 0 L${6 * s} 0`}
            stroke={ART.star}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </svg>
      ))}
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 200 200" className="gd-bob h-full w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id="gd-moon-clip">
          <circle cx={100} cy={100} r={78} />
        </clipPath>
        <radialGradient id="gd-moon-glow">
          <stop offset="55%" stopColor={ART.moonGlow} />
          <stop offset="100%" stopColor={ART.moonGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={100} cy={100} r={100} fill="url(#gd-moon-glow)" />
      <g filter={SKETCH_FILTER}>
        <circle cx={100} cy={100} r={78} fill={ART.moon} />
        <g clipPath="url(#gd-moon-clip)">
          <path d="M30 40 C70 70 70 140 30 175 L20 175 L20 30 Z" fill={ART.moonShade} />
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1={20 + i * 6} y1={30} x2={i * 6 - 20} y2={180} stroke={ART.moonShade} strokeWidth={1.4} />
          ))}
        </g>
        <circle cx={100} cy={100} r={78} fill="none" stroke={ART.outline} strokeWidth={3} />
        <circle cx={128} cy={70} r={11} fill="none" stroke={ART.moonShade} strokeWidth={3} />
        <circle cx={92} cy={140} r={7} fill="none" stroke={ART.moonShade} strokeWidth={3} />
        <text x={118} y={128} fill={ART.moonShade} fontFamily="var(--font-jetbrains), monospace" fontSize={22} fontWeight={700}>
          {"</>"}
        </text>
      </g>
    </svg>
  );
}

function Bat({ size, top, duration, delay }: { size: number; top: string; duration: number; delay: number }) {
  return (
    <div
      className="gd-fly absolute left-0"
      style={{ top, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <div className="gd-bob-fast">
        <svg viewBox="0 0 100 50" width={size} height={size / 2} filter={SKETCH_FILTER} aria-hidden>
          <g className="gd-flap" style={{ animationDuration: `${0.28 + size / 1000}s` }}>
            <path
              d="M50 22 C40 6 22 4 4 14 C14 16 18 22 16 30 C24 24 30 28 32 34 C38 28 44 30 50 36 C56 30 62 28 68 34 C70 28 76 24 84 30 C82 22 86 16 96 14 C78 4 60 6 50 22 Z"
              fill={ART.bat}
              stroke={ART.sketch}
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          </g>
          <circle cx={46} cy={22} r={1.8} fill={ART.epitaph} />
          <circle cx={54} cy={22} r={1.8} fill={ART.epitaph} />
        </svg>
      </div>
    </div>
  );
}

const EPITAPHS = [
  { x: 120, w: 70, h: 92, text: ["RIP", "v1.0"] },
  { x: 290, w: 56, h: 70, text: ["404"] },
  { x: 470, w: 80, h: 104, text: ["// TODO", "fix later"] },
  { x: 700, w: 60, h: 76, text: ["undefined"] },
  { x: 880, w: 78, h: 98, text: ["git push", "--force"] },
  { x: 1090, w: 62, h: 80, text: ["null"] },
];

function Graveyard() {
  return (
    <svg
      className="absolute bottom-0 left-0 h-[30vh] min-h-44 w-full"
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <g filter={SKETCH_FILTER_STRONG}>
        <path d="M0 210 Q300 180 600 205 T1200 196 L1200 240 L0 240 Z" fill={ART.silhouette} stroke={ART.sketch} strokeWidth={2} strokeOpacity={0.35} />
        {EPITAPHS.map(({ x, w, h, text }) => {
          const top = 212 - h;
          return (
            <g key={x}>
              <path
                d={`M${x} 214 L${x} ${top + w / 2} Q${x} ${top} ${x + w / 2} ${top} Q${x + w} ${top} ${x + w} ${top + w / 2} L${x + w} 214 Z`}
                fill={ART.hill}
                stroke={ART.sketch}
                strokeWidth={2.5}
                strokeOpacity={0.8}
              />
              {text.map((line, i) => (
                <text
                  key={line}
                  x={x + w / 2}
                  y={top + w / 2 + 6 + i * 14}
                  textAnchor="middle"
                  fill={ART.epitaph}
                  fontFamily="var(--font-jetbrains), monospace"
                  fontSize={line.length > 6 ? 9 : 12}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </g>
      <g className="gd-sway" filter={SKETCH_FILTER_STRONG}>
        <path
          d="M1010 214 L1016 120 L990 92 L996 88 L1018 110 L1022 70 L1028 70 L1026 112 L1054 80 L1060 84 L1030 124 L1032 214 Z"
          fill={ART.silhouette}
          stroke={ART.sketch}
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      </g>
    </svg>
  );
}

export function Scene() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        root.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Layer depth={-6}>
        <CodeRain className="gd-fade-down h-full w-full opacity-30" />
      </Layer>
      <Layer depth={-10}>
        <Stars />
      </Layer>
      <Layer depth={-16}>
        <div className="absolute right-[3%] top-[3%] h-24 w-24 md:h-32 md:w-32 xl:right-[7%] xl:top-[6%] xl:h-56 xl:w-56">
          <Moon />
        </div>
      </Layer>
      <Layer depth={-24}>
        <Bat size={70} top="14%" duration={19} delay={0} />
        <Bat size={44} top="24%" duration={26} delay={6} />
        <Bat size={56} top="9%" duration={23} delay={13} />
      </Layer>
      <Layer depth={-30} className="gd-breathe">
        <Graveyard />
      </Layer>
      <Layer depth={-40}>
        <div className="gd-drift absolute -bottom-6 left-[-10%] h-24 w-[120%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,var(--art-fog)_0%,transparent_70%)] opacity-15" />
      </Layer>
    </div>
  );
}
