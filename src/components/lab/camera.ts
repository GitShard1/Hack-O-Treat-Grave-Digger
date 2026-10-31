// OWNER: Builder B. The lab's virtual camera: where the monster sits in the lab, and how the whole rig
// pans, zooms and tilts so the part being built lands in the middle of the shot.
import type { Accessory } from "@/lib/contract";
import type { Anchors } from "@/components/Monster/bodies";
import type { BuildStage } from "@/components/Monster/stages";

export type Box = { w: number; h: number };
export type Point = { x: number; y: number };
export type Shot = BuildStage | "boot" | "finale";
type Pose = { focus: Point; zoom: number; rotateX: number; rotateY: number };

/** Monster canvas is 240 x 280 (see bodies.tsx). */
const CANVAS = { w: 240, h: 280 };
/** The focused part is framed a little above centre, so the key-moment card never covers it. */
const FRAME_Y = 0.42;

export function monsterSize(box: Box): number {
  return Math.round(Math.min(box.w * 0.66, box.h * 0.53, 300));
}

/** Top-left of the monster and its centre, in lab pixels. */
export function monsterPlacement(box: Box) {
  const size = monsterSize(box);
  const height = (size * CANVAS.h) / CANVAS.w;
  const center = { x: box.w / 2, y: box.h * 0.48 };
  return { size, height, center, left: center.x - size / 2, top: center.y - height / 2 };
}

/** A point on the monster canvas, in lab pixels. */
export function toLab(box: Box, p: Point): Point {
  const { size, center } = monsterPlacement(box);
  const k = size / CANVAS.w;
  return { x: center.x + (p.x - CANVAS.w / 2) * k, y: center.y + (p.y - CANVAS.h / 2) * k };
}

const ACCESSORY_SPOT: Record<Accessory, (a: Anchors) => Point> = {
  "top-hat": (a) => a.headTop,
  scarf: (a) => a.neck,
  chains: (a) => a.neck,
  lantern: (a) => ({ x: a.hand.x, y: a.hand.y + 24 }),
  candle: () => ({ x: 37, y: 230 }),
  cobwebs: () => ({ x: 34, y: 34 }),
};

function pose(shot: Shot, anchors: Anchors, accessories: Accessory[]): Pose {
  const whole = { x: 120, y: 150 };
  switch (shot) {
    case "boot":
      return { focus: whole, zoom: 0.8, rotateX: 12, rotateY: -18 };
    case "frame":
      return { focus: { x: 120, y: 165 }, zoom: 1.05, rotateX: 5, rotateY: 12 };
    case "ectoplasm":
      return { focus: anchors.neck, zoom: 1.3, rotateX: 2, rotateY: -10 };
    case "eyes":
      return { focus: anchors.eyes, zoom: 1.8, rotateX: -4, rotateY: 7 };
    case "accessories": {
      const first = accessories[0];
      return { focus: first ? ACCESSORY_SPOT[first](anchors) : whole, zoom: 1.5, rotateX: 3, rotateY: -12 };
    }
    case "aura":
      return { focus: whole, zoom: 0.95, rotateX: 8, rotateY: 5 };
    case "finale":
      return { focus: whole, zoom: 1, rotateX: 0, rotateY: 0 };
  }
}

/** Point the camera is looking at, in lab pixels (used to aim the arms and sparks). */
export function focusPoint(box: Box, shot: Shot, anchors: Anchors, accessories: Accessory[]): Point {
  return toLab(box, pose(shot, anchors, accessories).focus);
}

/** Transform for the lab rig. Translate first, then scale about the rig centre (framer-motion order). */
export function cameraTransform(box: Box, shot: Shot, anchors: Anchors, accessories: Accessory[]) {
  // The finale lands exactly at rest, so the monster can be measured and handed to the result card.
  if (shot === "finale") return { x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 };
  const p = pose(shot, anchors, accessories);
  const f = toLab(box, p.focus);
  return {
    x: -(f.x - box.w / 2) * p.zoom,
    y: box.h * FRAME_Y - box.h / 2 - (f.y - box.h / 2) * p.zoom,
    scale: p.zoom,
    rotateX: p.rotateX,
    rotateY: p.rotateY,
  };
}
