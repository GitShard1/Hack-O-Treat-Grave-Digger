// OWNER: Builder B. SVG colour tokens. Values live in src/styles/theme.css; edit them there, not here.
export const ART = {
  sketch: "var(--art-sketch)",
  outline: "var(--art-outline)",
  night: "var(--art-night)",
  eye: "var(--art-eye)",
  shade: "var(--art-shade)",
  groundShadow: "var(--art-ground-shadow)",
  metal: "var(--art-metal)",
  lantern: "var(--art-lantern)",
  candle: "var(--art-candle)",
  candleShade: "var(--art-candle-shade)",
  flame: "var(--art-flame)",
  ember: "var(--art-ember)",
  web: "var(--art-web)",
  fog: "var(--art-fog)",
  defaultBody: "var(--art-default-body)",
  defaultAccent: "var(--art-default-accent)",
  star: "var(--art-star)",
  moon: "var(--art-moon)",
  moonShade: "var(--art-moon-shade)",
  moonGlow: "var(--art-moon-glow)",
  bat: "var(--art-bat)",
  codeRain: "var(--art-code-rain)",
  hill: "var(--art-hill)",
  silhouette: "var(--art-silhouette)",
  epitaph: "var(--art-epitaph)",
} as const;

/** CSS filter that makes any SVG or element look hand-drawn. Defined once in <SketchDefs />. */
export const SKETCH_FILTER = "url(#gd-sketch)";
export const SKETCH_FILTER_STRONG = "url(#gd-sketch-strong)";
