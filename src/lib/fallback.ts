// OWNER: Builder A. Deterministic character built from measured facts alone, so the demo never
// dead-ends when Claude is unavailable. Same snapshot in, same monster out.
import "server-only";
import type { Accessory, Archetype, Aura, Character, EyeStyle, RepoFacts, Trait } from "@/lib/contract";
import type { RepoMeasures } from "@/lib/facts";
import { paletteFromLanguages } from "@/lib/palette";

const SWAMPY_LANGUAGES = new Set(["Python", "R", "Jupyter Notebook", "Julia"]);

const ARCHETYPE_DETAILS: Record<Archetype, { epithet: string; noun: string; habit: string }> = {
  ghost: { epithet: "the Restless", noun: "spirit", habit: "rattling doorknobs and rearranging imports" },
  zombie: { epithet: "the Undying", noun: "shambling thing", habit: "groaning softly whenever someone opens an issue" },
  golem: { epithet: "the Assembled", noun: "golem", habit: "stomping through lockfiles and picking up stray packages" },
  vampire: { epithet: "the Ageless", noun: "vampire", habit: "drinking deeply from the star count of lesser repositories" },
  witch: { epithet: "the Brewer", noun: "witch", habit: "stirring a cauldron of half-compiled spells" },
  "swamp-thing": { epithet: "the Bog-Born", noun: "swamp thing", habit: "leaving damp footprints across every pull request" },
};

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

function prettyName(repoName: string): string {
  return repoName
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function compact(n: number): string {
  return n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}

type TraitCandidate = { when: boolean; factId: string; title: string; description: string };

function pickTraits(m: RepoMeasures, archetype: Archetype, facts: RepoFacts): [Trait, Trait, Trait] {
  const value = (id: string) => facts.facts.find((f) => f.id === id)?.value ?? "";
  const depTotal = m.runtimeDeps.length + m.devDeps.length;
  const candidates: TraitCandidate[] = [
    {
      when: archetype === "golem",
      factId: "f_deps",
      title: `Assembled from ${depTotal} parts`,
      description: `${m.runtimeDeps.length} dependencies and ${m.devDeps.length} dev dependencies, bolted together.`,
    },
    {
      when: m.runtimeDeps.length >= 5,
      factId: "f_deps",
      title: `Drags ${m.runtimeDeps.length} chains`,
      description: `One rattling chain for every dependency in ${m.manifestFile ?? "its manifest"}.`,
    },
    // Most distinctive first, so different repos get different traits.
    {
      when: m.devDeps.length >= 5,
      factId: "f_dev_deps",
      title: `Hides ${m.devDeps.length} tools in its coffin`,
      description: `Its ${m.manifestFile ?? "manifest"} lists ${m.devDeps.length} dev dependencies, kept close for the night shift.`,
    },
    {
      when: m.languages.length >= 3,
      factId: "f_lang_mix",
      title: `Brews ${m.languages.length} languages`,
      description: `Its cauldron bubbles with ${m.languages.slice(0, 3).join(", ")}.`,
    },
    {
      when: m.daysSincePush <= 14,
      factId: "f_last_push",
      title: "Still twitching",
      description: `Pushed ${value("f_last_push")}. It refuses to stay buried.`,
    },
    {
      when: m.daysSincePush > 365,
      factId: "f_last_push",
      title: "Sleeping soundly",
      description: `Last pushed ${value("f_last_push")}. Best not to wake it.`,
    },
    {
      when: m.readmeLength === 0,
      factId: "f_readme",
      title: "Casts no reflection",
      description: "No README was found, and no mirror can find it either.",
    },
    {
      when: m.hasTests,
      factId: "f_tests",
      title: "Carries a lantern",
      description: "Its test files light the way through the dark.",
    },
    {
      when: m.primaryLanguage !== null,
      factId: "f_lang_top",
      title: `${m.primaryShare}% ${m.primaryLanguage ?? ""} ectoplasm`,
      description: "It glows the colour of its main language.",
    },
    {
      when: m.ageYears >= 5,
      factId: "f_age",
      title: `${m.ageYears} years in the ground`,
      description: `First dug up in ${m.createdAt.getUTCFullYear()}. It remembers every commit.`,
    },
    {
      when: m.stars >= 1_000,
      factId: "f_stars",
      title: `${compact(m.stars)} followers in the fog`,
      description: "Every star is another lantern trailing it home.",
    },
    // Always available, so there are at least three traits.
    { when: true, factId: "f_stars", title: `${value("f_stars")} stars`, description: "Counted, one by one, at midnight." },
    { when: true, factId: "f_age", title: `Born ${value("f_age")}`, description: "The date carved on its headstone." },
    {
      when: true,
      factId: "f_last_push",
      title: `Last seen ${value("f_last_push")}`,
      description: "That is when the soil last moved.",
    },
  ];

  const factIds = new Set(facts.facts.map((f) => f.id));
  const chosen: Trait[] = [];
  const usedFacts = new Set<string>();
  for (const c of candidates) {
    if (!c.when || !factIds.has(c.factId) || usedFacts.has(c.factId)) continue;
    usedFacts.add(c.factId);
    chosen.push({ title: c.title.slice(0, 60), description: c.description.slice(0, 240), factId: c.factId });
    if (chosen.length === 3) break;
  }
  const [a, b, c] = chosen;
  if (!a || !b || !c) throw new Error("fallbackCharacter: facts are missing f_stars, f_age or f_last_push");
  return [a, b, c];
}

function originStory(m: RepoMeasures, name: string, archetype: Archetype): string {
  const { noun, habit } = ARCHETYPE_DETAILS[archetype];
  const language = m.primaryLanguage ? `stitched together from ${m.primaryLanguage}` : "stitched together from nothing at all";
  const depCount = m.runtimeDeps.length + m.devDeps.length;
  const deps = depCount > 0 ? `dragging ${depCount} dependencies behind it` : "carrying no dependencies at all";
  return [
    `In ${m.createdAt.getUTCFullYear()}, someone typed the first line of ${m.slug}, and something in the dark stirred.`,
    `Nobody noticed at first.`,
    `The ${noun} grew slowly, ${language}, ${deps}.`,
    `By the time ${m.stars.toLocaleString("en-US")} stars had gathered around its grave, it had a name: ${name}.`,
    `Now it wanders the repositories after midnight, ${habit}.`,
    `Developers who open its README swear they hear whispering between the lines.`,
    `Some say it is harmless. Some say it is only resting.`,
    `Everyone agrees on one thing: once summoned, it never quite leaves your terminal.`,
  ].join(" ");
}

export function fallbackCharacter(facts: RepoFacts, m: RepoMeasures): Character {
  const archetype = pickArchetype(m);
  const name = `${prettyName(m.name)} ${ARCHETYPE_DETAILS[archetype].epithet}`.slice(0, 60);
  return {
    name,
    archetype,
    palette: paletteFromLanguages(m.languages),
    eyes: pickEyes(m),
    accessories: pickAccessories(m, archetype),
    aura: pickAura(m),
    traits: pickTraits(m, archetype, facts),
    originStory: originStory(m, name, archetype),
    source: "fallback",
  };
}
