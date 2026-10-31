// OWNER: Builder B. Shared SVG filters that make lines look hand-drawn.
// The noise seed steps a few times a second ("line boil"), like frames of a pencil animation.
// Use with ART-level constants SKETCH_FILTER / SKETCH_FILTER_STRONG, or the .gd-sketch CSS class.

export function SketchDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <filter id="gd-sketch" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" result="noise">
            <animate attributeName="seed" values="1;2;3;4" dur="0.6s" calcMode="discrete" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="gd-sketch-strong" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="noise">
            <animate attributeName="seed" values="7;8;9" dur="0.5s" calcMode="discrete" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
