// OWNER: Builder B. The monster lab: a 2.5D set (layered planes at different depths under one perspective)
// where the monster is built part by part while a camera rig pans, zooms and tilts to each part.
// Each step shows a key moment from the repo's real facts. Ends at rest and hands the monster's
// on-screen box to `onDone`, so the result card can fly it into place. Skip or Escape ends it early.
"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import type { SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { ART } from "@/components/Monster/art";
import { BODIES } from "@/components/Monster/bodies";
import { Monster } from "@/components/Monster/Monster";
import { BUILD_STAGES } from "@/components/Monster/stages";
import { cameraTransform, focusPoint, monsterPlacement, toLab, type Box, type Shot } from "./camera";
import { PANEL_LAYOUT_ID, PanelPlate, type Rect } from "./Handoff";
import { Arms, Cables, Capsule, Floor, Pedestal, Sparks } from "./LabProps";
import { LabWall } from "./LabWall";
import { MomentCard } from "./MomentCard";
import { LAB_TIMING, buildTimeline } from "./timeline";

type Props = { result: SummonSuccess; onDone: (monster: Rect | null) => void };

const PERSPECTIVE = 1000;
const CAMERA_EASE = [0.65, 0, 0.35, 1] as const;

/** A flat plane pushed to depth `z`, scaled back up so it still fills the frame at rest. */
function Plane({ z, out, finale, children }: { z: number; out: TargetAndTransition; finale: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ z, scale: (PERSPECTIVE - z) / PERSPECTIVE }}
      animate={finale ? out : { opacity: 1 }}
      transition={{ duration: 0.9, ease: CAMERA_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function LabSequence({ result, onDone }: Props) {
  const { character, facts } = result;
  const steps = useMemo(() => buildTimeline(result), [result]);
  const anchors = BODIES[character.archetype].anchors;
  const liquid = character.palette[0] ?? ART.defaultBody;

  const viewRef = useRef<HTMLDivElement>(null);
  const monsterRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  /** -1 = lab powering up, 0..n-1 = building steps, n = finale. */
  const [index, setIndex] = useState(-1);
  /** Starts in step mode: Next (or the right arrow key) moves one step, for walking a demo audience through it. Auto plays it on a timer. */
  const [stepping, setStepping] = useState(true);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  const finished = useRef(false);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const r = monsterRef.current?.getBoundingClientRect();
    onDoneRef.current(r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null);
  }, []);

  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const finale = index >= steps.length;
  const next = useCallback(() => (finale ? finish() : setIndex((i) => i + 1)), [finale, finish]);

  useEffect(() => {
    if (stepping) return;
    const seconds = index < 0 ? LAB_TIMING.boot : finale ? LAB_TIMING.finale : LAB_TIMING.step;
    const timer = window.setTimeout(next, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [index, finale, next, stepping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") {
        setStepping(true);
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, next]);

  const step = finale ? undefined : steps[index];
  const shot: Shot = finale ? "finale" : (step?.part ?? "boot");
  const stage = finale ? BUILD_STAGES.length : (step?.stage ?? 0);
  const status = finale ? COPY.lab.alive : (step?.status ?? COPY.lab.boot);
  const progress = finale ? 1 : (index + 1) / (steps.length + 1);
  const stepLabel = `${Math.min(Math.max(index + 1, 0), steps.length)}/${steps.length}`;

  const place = box ? monsterPlacement(box) : null;
  const floorY = box ? toLab(box, { x: 120, y: 262 }).y : 0;
  const focus = box && step ? focusPoint(box, step.part, anchors, character.accessories) : null;
  const camera = box ? cameraTransform(box, shot, anchors, character.accessories) : undefined;
  const rigStyle: CSSProperties = { transformStyle: "preserve-3d" };

  return (
    <section aria-label={COPY.lab.ariaLabel} className="relative mx-auto w-full max-w-4xl">
      <PanelPlate layoutId={PANEL_LAYOUT_ID} />
      <div
        ref={viewRef}
        className="relative h-[min(72svh,560px)] min-h-[420px] overflow-hidden rounded-[1.6rem]"
        style={{ perspective: PERSPECTIVE }}
      >
        {box && place && camera && (
          <motion.div
            className="absolute inset-0"
            style={rigStyle}
            initial={{ ...camera, scale: camera.scale * 0.85, rotateY: camera.rotateY - 10 }}
            animate={camera}
            transition={{ duration: finale ? 0.9 : 1, ease: CAMERA_EASE }}
          >
            <Plane z={-320} finale={finale} out={{ opacity: 0 }}>
              <LabWall repo={facts.repo} palette={character.palette} stepLabel={stepLabel} />
            </Plane>

            <motion.div className="absolute inset-0" style={rigStyle} animate={{ opacity: finale ? 0 : 1 }} transition={{ duration: 0.6 }}>
              <Floor box={box} y={floorY} />
            </motion.div>

            <div className="absolute inset-0">
              <motion.div animate={{ opacity: finale ? 0 : 1 }} transition={{ duration: 0.6 }}>
                <Pedestal center={{ x: place.center.x, y: floorY }} width={place.size * 1.05} />
              </motion.div>
              <div ref={monsterRef} className="absolute" style={{ left: place.left, top: place.top, width: place.size, height: place.height }}>
                <Monster character={character} size={place.size} stage={stage} facts={facts.facts} />
              </div>
              {!finale && <Arms box={box} target={focus} reach={place.size * 0.16} />}
              {focus && <Sparks key={index} at={focus} spread={place.size * 0.22} />}
            </div>

            <Plane z={60} finale={finale} out={{ opacity: 0 }}>
              <Capsule center={place.center} floorY={floorY} size={place.size} filled={stage >= 2} liquid={liquid} lift={finale} />
            </Plane>

            <Plane z={170} finale={finale} out={{ opacity: 0, scale: 1.5 }}>
              <Cables />
            </Plane>
          </motion.div>
        )}

        {/* Vignette: static, outside the camera. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 45%, ${ART.labVignette} 100%)` }}
          animate={{ opacity: finale ? 0 : 0.85 }}
          transition={{ duration: 0.8 }}
        />

        {finale && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: ART.labFlash }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0.05, 0.45, 0] }}
              transition={{ duration: 0.7, times: [0, 0.12, 0.3, 0.42, 1] }}
            />
            <motion.p
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[14%] text-center font-display text-5xl sm:text-6xl"
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.08, 1, 1.1], rotate: -4 }}
              transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
            >
              {COPY.lab.aliveShout}
            </motion.p>
          </>
        )}

        <AnimatePresence>
          {step?.moment && (
            <MomentCard key={step.part} moment={step.moment} number={index + 1} side={index % 2 === 0 ? "left" : "right"} />
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="min-w-0 rounded-xl bg-surface-strong px-3 py-2 backdrop-blur-sm">
            <p aria-live="polite" className="truncate text-xs text-highlight sm:text-sm">
              {status}
            </p>
            <div className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-line sm:w-44">
              <motion.div
                className="h-full origin-left rounded-full bg-highlight"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <div
              role="group"
              aria-label={COPY.lab.modeLabel}
              title={COPY.lab.stepHint}
              className="pointer-events-auto flex shrink-0 overflow-hidden rounded-xl border border-line bg-surface-strong font-display text-lg leading-none backdrop-blur-sm"
            >
              {[false, true].map((mode) => (
                <button
                  key={String(mode)}
                  type="button"
                  onClick={() => setStepping(mode)}
                  aria-pressed={stepping === mode}
                  className={`px-3 py-2 transition focus-visible:outline-2 focus-visible:outline-highlight ${stepping === mode ? "bg-highlight/20 text-highlight" : "text-muted hover:text-ink"}`}
                >
                  {mode ? COPY.lab.step : COPY.lab.autoplay}
                </button>
              ))}
            </div>
            {stepping && (
              <button type="button" onClick={next} title={COPY.lab.nextHint} className="pointer-events-auto shrink-0 rounded-xl border border-line bg-surface-strong px-4 py-2 font-display text-lg leading-none backdrop-blur-sm transition hover:border-highlight focus-visible:outline-2 focus-visible:outline-highlight border-highlight text-highlight">
                {COPY.lab.next} {"->"}
              </button>
            )}
            <button
              type="button"
              onClick={finish}
              title={COPY.lab.skipHint}
              aria-label={COPY.lab.skipHint}
              className="pointer-events-auto shrink-0 rounded-xl border border-line bg-surface-strong px-4 py-2 font-display text-lg leading-none backdrop-blur-sm transition hover:border-highlight focus-visible:outline-2 focus-visible:outline-highlight"
            >
              {COPY.lab.skip} {"->"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
