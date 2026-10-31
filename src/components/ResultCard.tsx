// OWNER: Builder B. Result screen. TODO(B): reveal animation (framer-motion), art direction.
import type { SummonSuccess } from "@/lib/contract";
import { Monster } from "@/components/Monster/Monster";
import { TraitChip } from "@/components/TraitChip";

const SOURCE_BADGE = {
  live: null,
  fallback: "Quick summon (AI unavailable)",
  "saved-example": "Saved example",
} as const;

export function ResultCard({ result }: { result: SummonSuccess }) {
  const { facts, character } = result;
  const factById = new Map(facts.facts.map((f) => [f.id, f]));
  const badge = SOURCE_BADGE[character.source];

  return (
    <article className="mx-auto flex max-w-xl flex-col items-center gap-4">
      {badge && <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-200">{badge}</span>}
      <Monster character={character} />
      <h2 className="text-2xl font-bold">{character.name}</h2>
      <p className="text-sm opacity-70">
        Summoned from <a className="underline" href={facts.url}>{facts.repo}</a>
      </p>
      <ul className="grid w-full gap-2">
        {character.traits.map((t) => (
          <TraitChip key={t.title} trait={t} fact={factById.get(t.factId)} />
        ))}
      </ul>
      <section className="w-full">
        <h3 className="text-sm uppercase tracking-wide opacity-60">Origin story (fiction, inspired by real repo facts)</h3>
        <p className="mt-1 leading-relaxed">{character.originStory}</p>
      </section>
      <p className="text-xs opacity-50">Art procedurally assembled from your repo&apos;s traits.</p>
    </article>
  );
}
