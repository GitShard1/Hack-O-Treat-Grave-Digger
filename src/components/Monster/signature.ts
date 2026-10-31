// OWNER: Builder B. Which signature part a monster wears, picked by fixed rules from the fact its first
// trait cites (the server makes that the repo's signature fact). Pure data, no React, so it is easy to test.
// Labels are copied from real fact values only; nothing here invents a name.
import type { Character, Fact } from "@/lib/contract";

export const MOTIFS = ["cage", "filament", "swarm", "rig", "glyphs"] as const;
export type Motif = (typeof MOTIFS)[number];

export type Signature = {
  motif: Motif;
  /** Also wrap the monster in a rotating wireframe cage (the repo is about 3D or rendering). */
  cage: boolean;
  /** Short real strings drawn on the part: file names, file types or words from the fact. */
  labels: string[];
  fact: Fact;
  /** Stable number from the fact, for angles and timing. Same repo facts, same look. */
  seed: number;
};

const GEOMETRY = /\bcube|wireframe|\b3d\b|render|raytrac|raymarch|shader|opengl|vulkan|webgl|\bmesh|polygon|vertex|voxel|geometry|three\.?js/i;
/** Facts whose text can say the project is about geometry or rendering. */
const GEOMETRY_SOURCES = ["f_description", "f_readme_title", "f_code_file", "f_tree_few_files", "f_tree_names"];

/** FNV-1a: small, stable string hash. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const list = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

function labelsFor(motif: Motif, fact: Fact): string[] {
  switch (motif) {
    case "rig":
      return list(fact.value).slice(0, 6);
    case "swarm": {
      // "64% .json, 13% .gz, 8% .cpp" -> [".json", ".gz", ".cpp"]; "data/mods/ holds ..." -> ["mods/"]
      const exts = [...fact.value.matchAll(/\.[a-z0-9]+/gi)].map((m) => m[0]);
      if (fact.id === "f_tree_types" && exts.length > 0) return exts.slice(0, 3);
      const folder = /^(\S+?)\/? holds/.exec(fact.value)?.[1];
      return folder ? [folder.split("/").pop() + "/"] : exts.slice(0, 3);
    }
    case "filament":
      return [];
    case "cage":
    case "glyphs":
      return fact.value
        .replace(/["()]/g, "")
        .split(/\s+/)
        .filter((word) => word.length >= 2 && word.length <= 14)
        .slice(0, 8);
  }
}

export function signatureOf(character: Character, facts: Fact[]): Signature | null {
  const fact = facts.find((f) => f.id === character.traits[0].factId);
  if (!fact) return null;
  const geometry = facts.some((f) => GEOMETRY_SOURCES.includes(f.id) && GEOMETRY.test(f.value));

  let motif: Motif;
  if (fact.id === "f_code_one_expression" || fact.id === "f_tree_few_files") motif = "filament";
  else if (fact.id === "f_tree_types" || fact.id === "f_tree_folder") motif = "swarm";
  else if (fact.id === "f_tree_names") motif = "rig";
  else motif = geometry ? "cage" : "glyphs";

  return {
    motif,
    cage: geometry && motif !== "cage",
    labels: labelsFor(motif, fact),
    fact,
    seed: hash(`${fact.id}:${fact.value}`),
  };
}
