// OWNER: Builder B. Saved examples, parsed (not cast) so a broken fixture fails loudly in dev.
// Always shown with a "Saved example" badge; never presented as a live generation.
// TODO(B): before the demo, replace the sample fixture with a saved result from a real repo.
import { SummonSuccessSchema, type SummonSuccess } from "@/lib/contract";
import sampleFixture from "@/fixtures/example.json";

export const exampleResult: SummonSuccess = SummonSuccessSchema.parse(sampleFixture);
