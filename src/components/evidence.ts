// OWNER: Builder B. Where a fact came from, read from its id prefix (set in src/lib/facts.ts).
import type { Fact } from "@/lib/contract";

export const FACT_ORIGINS = ["code", "tree", "docs", "manifest", "meta"] as const;
export type FactOrigin = (typeof FACT_ORIGINS)[number];

export function factOrigin(id: string): FactOrigin {
  if (id.startsWith("f_code_")) return "code";
  if (id.startsWith("f_tree_")) return "tree";
  if (id.startsWith("f_readme") || id === "f_description") return "docs";
  if (id.startsWith("f_deps") || id === "f_dev_deps") return "manifest";
  return "meta";
}

/** Facts grouped by origin, in FACT_ORIGINS order, leaving out empty groups. */
export function factsByOrigin(facts: Fact[]): { origin: FactOrigin; facts: Fact[] }[] {
  return FACT_ORIGINS.map((origin) => ({ origin, facts: facts.filter((f) => factOrigin(f.id) === origin) })).filter(
    (group) => group.facts.length > 0,
  );
}
