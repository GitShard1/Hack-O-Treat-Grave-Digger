// OWNER: Builder B. Dev page: every archetype and part, plus real fixtures through the no-key pipeline.
// Not linked from the app. Visit /lab while working on the art or to replay the build sequence.
import type { Metadata } from "next";
import { ARCHETYPES, type Character } from "@/lib/contract";
import { fallbackCharacter } from "@/lib/fallback";
import { buildFacts, measureRepo } from "@/lib/facts";
import type { RepoSnapshot } from "@/lib/github";
import requests from "@/fixtures/snapshots/psf-requests.json";
import ms from "@/fixtures/snapshots/vercel-ms.json";
import spincube from "@/fixtures/snapshots/spincube.json";
import mayhem from "@/fixtures/snapshots/mayhem-game.json";
import { Monster } from "@/components/Monster/Monster";
import { ResultCard } from "@/components/ResultCard";
import { LabReplay } from "@/components/lab/LabReplay";
import { exampleResult } from "@/lib/examples";

export const metadata: Metadata = { title: "Monster lab", robots: { index: false } };

const VARIANTS: Pick<Character, "palette" | "eyes" | "accessories" | "aura">[] = [
  { palette: ["#3572a5", "#9cff57"], eyes: "pair", accessories: ["lantern", "scarf"], aura: "fog" },
  { palette: ["#6e9f5b", "#b46b3a", "#4b3f72"], eyes: "hollow", accessories: ["chains"], aura: "embers" },
  { palette: ["#8a8f98", "#38e1ff"], eyes: "glowing", accessories: ["lantern", "cobwebs"], aura: "sparks" },
  { palette: ["#e8dccf", "#c2182b"], eyes: "pair", accessories: ["top-hat", "candle"], aura: "fog" },
  { palette: ["#4b3f72", "#a8e06a", "#ff8a1f"], eyes: "many", accessories: ["scarf", "candle"], aura: "sparks" },
  { palette: ["#3d6b45", "#9cff57"], eyes: "single", accessories: ["lantern"], aura: "drip" },
];

export default function LabPage() {
  const samples = ([spincube, mayhem, requests, ms] as RepoSnapshot[]).map((snapshot) => {
    const facts = buildFacts(snapshot);
    return { ok: true as const, facts, character: fallbackCharacter(facts, measureRepo(snapshot)) };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl">Monster lab</h1>
      <p className="mt-1 text-sm text-muted">Every archetype, then real snapshots through the fallback pipeline (no API keys).</p>

      <LabReplay samples={[...samples, exampleResult]} />

      <section className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
        {ARCHETYPES.map((archetype, i) => {
          const variant = VARIANTS[i % VARIANTS.length]!;
          const character: Character = {
            ...variant,
            archetype,
            name: archetype,
            traits: [
              { title: "a", description: "a", factId: "f_a" },
              { title: "b", description: "b", factId: "f_b" },
              { title: "c", description: "c", factId: "f_c" },
            ],
            originStory: "",
            source: "saved-example",
          };
          return (
            <figure key={archetype} className="flex flex-col items-center rounded-2xl border border-line bg-surface p-4">
              <Monster character={character} size={200} />
              <figcaption className="mt-2 text-sm capitalize">
                {archetype.replace("-", " ")} / {variant.eyes} / {variant.aura}
              </figcaption>
            </figure>
          );
        })}
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        {samples.map((sample) => (
          <ResultCard key={sample.facts.repo} result={sample} />
        ))}
      </section>
    </main>
  );
}
