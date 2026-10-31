// OWNER: Builder B. Result screen: monster, name, evidence-backed traits, origin story.
import type { SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { Monster } from "@/components/Monster/Monster";
import { TraitChip } from "@/components/TraitChip";

export function ResultCard({ result }: { result: SummonSuccess }) {
  const { facts, character } = result;
  const factById = new Map(facts.facts.map((f) => [f.id, f]));
  const badge = COPY.sourceBadge[character.source];

  return (
    <article className="mx-auto w-full max-w-4xl rounded-3xl border border-line bg-surface-strong p-5 backdrop-blur-sm sm:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col items-center">
          <Monster character={character} size={260} />
        </div>

        <div className="min-w-0">
          {badge && (
            <span className="mb-3 inline-block rounded-full bg-badge px-3 py-1 text-xs text-badge-ink">{badge}</span>
          )}
          <h2 className="font-display text-4xl leading-tight break-words sm:text-5xl">{character.name}</h2>
          <p className="mt-2 text-sm text-muted">
            <span className="capitalize">{character.archetype.replace("-", " ")}</span>
            {" / "}
            {COPY.summonedFrom}{" "}
            <a className="underline underline-offset-2 hover:text-ink" href={facts.url} target="_blank" rel="noreferrer">
              {facts.repo}
            </a>
          </p>

          <ul className="mt-5 grid gap-3">
            {character.traits.map((trait, index) => (
              <TraitChip key={`${index}-${trait.factId}`} index={index} trait={trait} fact={factById.get(trait.factId)} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">{COPY.evidenceHint}</p>
        </div>
      </div>

      <section className="mt-8 border-t border-line pt-6">
        <h3 className="font-display text-2xl">{COPY.storyHeading}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted">{COPY.storyNote}</p>
        <p className="mt-3 max-w-prose leading-relaxed">{character.originStory}</p>
      </section>
      <p className="mt-6 text-xs text-muted">{COPY.artNote}</p>
    </article>
  );
}
