// OWNER: Builder A. Deterministic character used when Claude is unavailable, so the demo never dead-ends.
//
// PLACEHOLDER: monster writing (name, trait text, origin story) is not designed yet, so this returns
// obvious placeholder text. The look (archetype, eyes, accessories, aura, palette) and which real
// facts the traits point to ARE derived from the repo, so the evidence links stay real.
import "server-only";
import type { Accessory, Archetype, Aura, Character, EyeStyle, RepoFacts, Trait } from "@/lib/contract";
import { pickSignatureFactId, type RepoMeasures } from "@/lib/facts";
import { paletteFromLanguages } from "@/lib/palette";

export const PLACEHOLDER_NAME = "Placeholder Monster";
export const PLACEHOLDER_TRAIT = "This is a placeholder.";
/** 100 words of filler so the origin-story length check still runs on placeholder output (70-140 accepted). */
export const PLACEHOLDER_STORY =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. " +
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, " +
  "eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.";

const SWAMPY_LANGUAGES = new Set(["Python", "R", "Jupyter Notebook", "Julia"]);

export function pickArchetype(m: RepoMeasures): Archetype {
  const depCount = m.runtimeDeps.length + m.devDeps.length;
  if (m.stars >= 20_000 && m.ageYears >= 8) return "vampire";
  if (depCount >= 25) return "golem";
  if (m.languages.length >= 4) return "witch";
  if (m.ageYears >= 5 && m.daysSincePush <= 90) return "zombie";
  if (m.primaryLanguage && SWAMPY_LANGUAGES.has(m.primaryLanguage)) return "swamp-thing";
  return "ghost";
}

function pickEyes(m: RepoMeasures): EyeStyle {
  if (m.readmeLength === 0) return "hollow";
  if (m.languages.length >= 4) return "many";
  if (m.stars >= 10_000) return "glowing";
  if (m.languages.length <= 1) return "single";
  return "pair";
}

function pickAccessories(m: RepoMeasures, archetype: Archetype): Accessory[] {
  const picks: Accessory[] = [];
  if (m.runtimeDeps.length >= 5) picks.push("chains");
  if (m.hasTests) picks.push("lantern");
  if (m.stars >= 1_000 && archetype !== "witch") picks.push("top-hat");
  if (m.hasCi) picks.push("scarf");
  if (m.daysSincePush <= 14) picks.push("candle");
  if (m.daysSincePush > 365) picks.push("cobwebs");
  return picks.slice(0, 3);
}

function pickAura(m: RepoMeasures): Aura {
  if (m.daysSincePush <= 7) return "embers";
  if (m.hasDocker) return "sparks";
  if (m.primaryLanguage && SWAMPY_LANGUAGES.has(m.primaryLanguage)) return "drip";
  return "fog";
}

/** The signature fact first, then the most distinctive others, so different repos point at different evidence. */
function pickFactIds(m: RepoMeasures, archetype: Archetype, facts: RepoFacts): [string, string, string] {
  const candidates: [boolean, string][] = [
    [true, pickSignatureFactId(facts, m)],
    [true, "f_tree_names"],
    [true, "f_code_imports"],
    [true, "f_tree_few_files"],
    [true, "f_tree_folder"],
    [archetype === "golem" || m.runtimeDeps.length >= 5, "f_deps"],
    [m.devDeps.length >= 5, "f_dev_deps"],
    [m.languages.length >= 3, "f_lang_mix"],
    [m.daysSincePush <= 14 || m.daysSincePush > 365, "f_last_push"],
    [m.readmeLength === 0, "f_readme"],
    [m.hasTests, "f_tests"],
    [m.primaryLanguage !== null, "f_lang_top"],
    [m.ageYears >= 5, "f_age"],
    [m.stars >= 1_000, "f_stars"],
    // Always present in buildFacts, so there are at least three.
    [true, "f_stars"],
    [true, "f_age"],
    [true, "f_last_push"],
  ];
  const available = new Set(facts.facts.map((f) => f.id));
  const chosen = [...new Set(candidates.filter(([when, id]) => when && available.has(id)).map(([, id]) => id))];
  const [a, b, c] = chosen;
  if (!a || !b || !c) throw new Error("fallbackCharacter: facts are missing f_stars, f_age or f_last_push");
  return [a, b, c];
}

export function fallbackCharacter(facts: RepoFacts, m: RepoMeasures): Character {
  const archetype = pickArchetype(m);
  const trait = (factId: string, n: number): Trait => ({
    title: `Placeholder trait ${n}`,
    description: PLACEHOLDER_TRAIT,
    factId,
  });
  const [a, b, c] = pickFactIds(m, archetype, facts);
  return {
    name: PLACEHOLDER_NAME,
    archetype,
    palette: paletteFromLanguages(m.languages),
    eyes: pickEyes(m),
    accessories: pickAccessories(m, archetype),
    aura: pickAura(m),
    traits: [trait(a, 1), trait(b, 2), trait(c, 3)],
    originStory: PLACEHOLDER_STORY,
    source: "fallback",
  };
}
