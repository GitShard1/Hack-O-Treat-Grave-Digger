// OWNER: Builder B. Result screen: monster art, name and class, evidence-backed traits, origin story.
import type { SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { Monster } from "@/components/Monster/Monster";
import { SketchFrame } from "@/components/SketchFrame";
import { TraitChip } from "@/components/TraitChip";

export function ResultCard({ result }: { result: SummonSuccess }) {
  const { facts, character } = result;
  const factById = new Map(facts.facts.map((f) => [f.id, f]));
  const badge = COPY.sourceBadge[character.source];

  return (
    <SketchFrame
      as="article"
      className="mx-auto w-full max-w-4xl rounded-[1.6rem] bg-surface-strong p-5 backdrop-blur-sm sm:p-8"
    >
      {badge && <span className="rounded-full bg-badge px-3 py-1 text-xs text-badge-ink">{badge}</span>}

      <div className="mt-4 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative flex flex-col items-center">
          <div aria-hidden className="absolute inset-x-6 bottom-4 top-10 rounded-full bg-[radial-gradient(circle,var(--color-page-glow)_0%,transparent_70%)]" />
          <Monster character={character} size={260} />
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-4xl leading-tight break-words sm:text-5xl">{character.name}</h2>
          <p className="mt-2 text-xs uppercase tracking-widest text-muted">
            <span className="text-highlight">class:</span> {character.archetype.replace("-", " ")}
            {"  /  "}
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

      <section className="mt-8 border-t border-dashed border-line pt-6">
        <h3 className="font-display text-2xl">{COPY.storyHeading}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted">{COPY.storyNote}</p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed">{character.originStory}</p>
      </section>
      <p className="mt-6 text-xs text-muted">{COPY.artNote}</p>
    </SketchFrame>
  );
}
