// OWNER: Builder B. A panel with a hand-drawn double outline that "boils" like pencil animation.
// The wobble filter is applied only to the outline layers, so the text inside stays crisp.
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Outline colour as a Tailwind border class, e.g. "border-ink" or "border-primary". */
  tone?: string;
  as?: "div" | "section" | "article";
};

export function SketchFrame({ children, className = "", tone = "border-ink", as: Tag = "div" }: Props) {
  return (
    <Tag className={`relative ${className}`}>
      <span aria-hidden className={`gd-sketch pointer-events-none absolute inset-0 rounded-[1.6rem] border-[2.5px] ${tone}`} />
      <span
        aria-hidden
        className={`gd-sketch-strong pointer-events-none absolute inset-[3px] translate-x-[3px] translate-y-[2px] rounded-[1.7rem] border ${tone} opacity-40`}
      />
      <div className="relative">{children}</div>
    </Tag>
  );
}
