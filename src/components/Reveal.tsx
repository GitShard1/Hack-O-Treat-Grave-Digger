// OWNER: Builder B. Wraps the result in the reveal moment.
// TODO(B): framer-motion reveal (fog clears, monster rises). Cut to a simple fade if time is short.
import type { ReactNode } from "react";

export function Reveal({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
