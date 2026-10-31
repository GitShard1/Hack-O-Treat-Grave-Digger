// Saved examples, parsed (not cast) so a broken fixture fails loudly in dev.
// Always shown with a "Saved example" badge; never presented as a live generation.
import { CharacterSchema, RepoFactsSchema, type SummonSuccess } from "@/lib/contract";
import raw from "@/fixtures/example.json";

export const exampleResult: SummonSuccess = {
  ok: true,
  facts: RepoFactsSchema.parse(raw.facts),
  character: CharacterSchema.parse(raw.character),
};
