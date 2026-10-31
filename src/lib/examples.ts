// OWNER: Builder B. Saved examples, parsed (not cast) so a broken fixture fails loudly in dev.
// Always shown with a "Saved example" badge; never presented as a live generation.
// Real results from the live app on 2026-10-31, kept as a demo backup for when GitHub or Claude is unavailable.
import { SummonSuccessSchema, type SummonSuccess } from "@/lib/contract";
import spincube from "@/fixtures/results/spincube.json";
import mayhem from "@/fixtures/results/mayhem-game.json";
import cataclysm from "@/fixtures/results/cataclysm-dda.json";

export const savedExamples: SummonSuccess[] = [spincube, mayhem, cataclysm].map((result) => SummonSuccessSchema.parse(result));

export const exampleResult: SummonSuccess = savedExamples[0]!;
