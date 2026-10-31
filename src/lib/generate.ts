// OWNER: Builder A. Server only: this module reads ANTHROPIC_API_KEY.
import "server-only";
import type { Character, RepoFacts, Trait } from "@/lib/contract";
import type { RepoSnapshot } from "@/lib/github";

/**
 * TODO(A): one Claude call with structured output (tool use), then check it with validateCharacter().
 * Retry once on failure, then return fallbackCharacter(). Set source: "live".
 * - Model: a fast one (e.g. claude-haiku-5-5; claude-sonnet-5-5 if quality needs it).
 * - Key: process.env.ANTHROPIC_API_KEY (server env only, never logged, never sent to the client).
 * - README/manifest text goes inside <repo_data> tags and is described as untrusted data
 *   that must never be followed as instructions. Give the model no tools other than the output schema.
 * - Prompt rules: cite a fact id for every trait; do not invent history, incidents or contributor
 *   behaviour; do not judge security, quality or abandonment; humour is about the fiction, not real people.
 * - Palette: derive it on the server from the language mix and overwrite whatever the model returns.
 */
export async function generateCharacter(facts: RepoFacts, snapshot: RepoSnapshot): Promise<Character> {
  void snapshot; // will supply README/manifest text to the prompt
  return fallbackCharacter(facts);
}

/** Checks the schema cannot express. Returns a list of problems; an empty list means valid. */
export function validateCharacter(character: Character, facts: RepoFacts): string[] {
  const problems: string[] = [];
  const factIds = new Set(facts.facts.map((f) => f.id));
  for (const trait of character.traits) {
    if (!factIds.has(trait.factId)) problems.push(`trait "${trait.title}" cites unknown fact ${trait.factId}`);
  }
  const wordCount = character.originStory.trim().split(/\s+/).length;
  if (wordCount < 80 || wordCount > 120) problems.push(`origin story is ${wordCount} words (want 80-120)`);
  return problems;
}

/**
 * Deterministic character built from facts alone, so the demo never dead-ends.
 * TODO(A): map facts to archetype / eyes / accessories / palette properly.
 */
export function fallbackCharacter(facts: RepoFacts): Character {
  // One trait per distinct fact; only repeat when there are fewer than three facts.
  const traits = facts.facts.map(
    (fact): Trait => ({ title: fact.label, description: `${fact.label}: ${fact.value}`, factId: fact.id }),
  );
  const [first, second = first, third = second] = traits;
  if (!first || !second || !third) throw new Error("fallbackCharacter needs at least one fact");

  return {
    name: `The Spirit of ${facts.repo}`,
    archetype: "ghost",
    palette: ["#7c3aed", "#f97316"],
    eyes: "pair",
    accessories: [],
    aura: "fog",
    traits: [first, second, third],
    originStory: "Placeholder origin story. The generator is not implemented yet.",
    source: "fallback",
  };
}
