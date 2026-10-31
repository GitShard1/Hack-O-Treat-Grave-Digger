// OWNER: Builder B. The lab's back wall: tiles, shelves of specimen jars, a hanging lamp and a build monitor.
// Jar liquid uses the monster's own language colours, so every lab looks a little different.
import { ART, SKETCH_FILTER } from "@/components/Monster/art";
import { COPY } from "@/content/copy";

type Props = { repo: string; palette: string[]; stepLabel: string };

const MONO = "var(--font-jetbrains), monospace";
const LINE = { stroke: ART.outline, strokeWidth: 3, strokeLinejoin: "round" as const };

function Jar({ x, y, w, h, liquid }: { x: number; y: number; w: number; h: number; liquid: string }) {
  return (
    <g>
      <rect x={x + w * 0.2} y={y - 8} width={w * 0.6} height={10} rx={2} fill={ART.labSteel} {...LINE} />
      <rect x={x} y={y + h * 0.35} width={w} height={h * 0.65} rx={8} fill={liquid} opacity={0.75} />
      <rect x={x} y={y} width={w} height={h} rx={8} fill={ART.labGlass} stroke={ART.labGlassEdge} strokeWidth={2.5} />
      <circle cx={x + w * 0.55} cy={y + h * 0.62} r={w * 0.16} fill={ART.eye} {...LINE} strokeWidth={2} />
      <circle cx={x + w * 0.58} cy={y + h * 0.64} r={w * 0.07} fill={ART.outline} />
      <path d={`M${x + 6} ${y + 8} L${x + 6} ${y + h - 10}`} stroke={ART.labGlassEdge} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

function Shelf({ x, y, palette }: { x: number; y: number; palette: string[] }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <Jar key={i} x={x + 12 + i * 62} y={y - 70 + (i % 2) * 14} w={46} h={70 - (i % 2) * 14} liquid={palette[i % palette.length] ?? ART.defaultBody} />
      ))}
      <rect x={x} y={y} width={200} height={12} rx={3} fill={ART.labSteel} {...LINE} />
      <path d={`M${x + 20} ${y + 12} L${x + 30} ${y + 34} M${x + 180} ${y + 12} L${x + 170} ${y + 34}`} {...LINE} stroke={ART.labSteelLight} />
    </g>
  );
}

export function LabWall({ repo, palette, stepLabel }: Props) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width={800} height={500} fill={ART.labWall} />
      <g stroke={ART.labWallLine} strokeWidth={2}>
        {Array.from({ length: 11 }, (_, row) => (
          <g key={row}>
            <line x1={0} y1={row * 46} x2={800} y2={row * 46} />
            {Array.from({ length: 11 }, (_, col) => {
              const x = col * 80 + (row % 2) * 40;
              return <line key={col} x1={x} y1={row * 46} x2={x} y2={row * 46 + 46} />;
            })}
          </g>
        ))}
      </g>

      <g filter={SKETCH_FILTER}>
        <Shelf x={30} y={250} palette={palette} />
        <Shelf x={570} y={210} palette={[...palette].reverse()} />

        {/* Build monitor, top centre so it stays in frame on phones. */}
        <rect x={300} y={22} width={200} height={92} rx={10} fill={ART.labSteel} {...LINE} />
        <rect x={310} y={31} width={180} height={74} rx={6} fill={ART.labScreen} />
        <g fill={ART.labScreenText} fontFamily={MONO} fontSize={11}>
          <text x={318} y={50}>{COPY.lab.monitor.command}</text>
          <text x={318} y={70}>
            {COPY.lab.monitor.repo} {repo.length > 18 ? `${repo.slice(0, 17)}...` : repo}
          </text>
          <text x={318} y={90}>
            {COPY.lab.monitor.stage} {stepLabel}
          </text>
        </g>
        <path d="M400 0 L400 22" {...LINE} stroke={ART.labSteelLight} />

        {/* Lever box, left. */}
        <rect x={60} y={300} width={70} height={90} rx={6} fill={ART.labSteel} {...LINE} />
        <circle cx={95} cy={330} r={9} fill={ART.ember} {...LINE} strokeWidth={2} />
        <path d="M95 360 L118 336" {...LINE} stroke={ART.labSteelLight} strokeWidth={5} strokeLinecap="round" />

        {/* Gauges, right. */}
        {[620, 690].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={300} r={24} fill={ART.eye} {...LINE} />
            <path d={`M${cx} 300 L${cx + 14} ${288}`} {...LINE} strokeWidth={2.5} />
          </g>
        ))}
      </g>
    </svg>
  );
}
