// OWNER: Builder B. Falling code glyphs behind the scene ("matrix rain"), drawn on a canvas.
// Colour comes from --art-code-rain; the trail fades into --color-page. Static when motion is reduced.
"use client";
import { useEffect, useRef } from "react";

const GLYPHS = "01{}[]<>()/\\=;:+*#$&!?ABCDEFxyz=>".split("");
const CELL = 18;
const FPS = 18;

export function CodeRain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const glyphColour = styles.getPropertyValue("--art-code-rain").trim() || "#4dff9a";
    const pageColour = styles.getPropertyValue("--color-page").trim() || "#0a0e1f";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let drops: number[] = [];
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      drops = Array.from({ length: Math.ceil(canvas.width / CELL) }, () => Math.random() * -40);
      ctx.fillStyle = pageColour;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
    const draw = () => {
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = pageColour;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = glyphColour;
      ctx.font = `${CELL - 4}px ui-monospace, monospace`;
      drops.forEach((y, i) => {
        ctx.fillText(pick(), i * CELL, y * CELL);
        drops[i] = y * CELL > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
      });
    };

    if (reduceMotion) {
      for (let i = 0; i < 30; i++) draw();
      return () => window.removeEventListener("resize", resize);
    }

    let frame = 0;
    let last = 0;
    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      if (time - last < 1000 / FPS) return;
      last = time;
      draw();
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
