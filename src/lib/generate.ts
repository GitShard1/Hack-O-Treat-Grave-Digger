// OWNER: Builder A. Server only: this module reads ANTHROPIC_API_KEY.
import "server-only";
import type { Character, RepoFacts } from "@/lib/contract";
import type { RepoSnapshot } from "@/lib/github";

/**
 * TODO(A): one Claude call with structured output (tool use) → CharacterSchema.parse,
 * then assertTraitsCiteFacts. Retry once on failure, then return fallbackCharacter().
 * - Key: process.env.ANTHROPIC_API_KEY (server env only, never logged, never sent to the client).
 * - README/manifest text goes inside <repo_data> tags and is described as untrusted data.
 * - Give the model no tools other than the output schema.
 * - Set source: "live".
 */
export async function generateCharacter(facts: RepoFacts, snapshot: RepoSnapshot): Promise<Character> {
  void snapshot;
  return fallbackCharacter(facts);
}

/**
 * Deterministic character built from facts alone, so the demo never dead-ends.
 * TODO(A): map facts → archetype / eyes / accessories / palette properly.
 */
export function fallbackCharacter(facts: RepoFacts): Character {
  const pick = (i: number) => facts.facts[i % facts.facts.length]!;
  const trait = (i: number) => {
    const f = pick(i);
    return { title: f.label, description: `${f.label}: ${f.value}`, factId: f.id };
  };
  return {
    name: `The Spirit of ${facts.repo}`,
    archetype: "ghost",
    palette: ["#7c3aed", "#f97316"],
    eyes: "pair",
    accessories: [],
    aura: "fog",
    traits: [trait(0), trait(1), trait(2)],
    originStory: "Placeholder origin story. The generator is not implemented yet.",
    source: "fallback",
  };
}
