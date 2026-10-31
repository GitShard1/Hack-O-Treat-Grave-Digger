// OWNER: Builder B. Result screen: monster art, name and class, evidence-backed traits, origin story.
// With `handoff`, it picks up where the monster lab left off: the panel grows out of the lab panel,
// the monster flies from the lab into its slot, and the text fades in around it.
import type { SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { Monster } from "@/components/Monster/Monster";
import { FadeIn, FlipIn, PANEL_LAYOUT_ID, PanelPlate, type Rect } from "@/components/lab/Handoff";
import { TraitChip } from "@/components/TraitChip";

type Props = { result: SummonSuccess; handoff?: { monsterFrom: Rect | null } };

export function ResultCard({ result, handoff }: Props) {
  const { facts, character } = result;
  const factById = new Map(facts.facts.map((f) => [f.id, f]));
  const badge = COPY.sourceBadge[character.source];
  const intro = Boolean(handoff);

  return (
    <article className="relative mx-auto w-full max-w-4xl p-5 sm:p-8">
      <PanelPlate layoutId={intro ? PANEL_LAYOUT_ID : undefined} />
      <div className="relative">
        <FadeIn show={intro} delay={0.5}>
          {badge && <span className="rounded-full bg-badge px-3 py-1 text-xs text-badge-ink">{badge}</span>}
        </FadeIn>

        <div className="mt-4 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="relative flex flex-col items-center">
            <FadeIn show={intro} delay={0.4} className="absolute inset-x-6 bottom-4 top-10">
              <div aria-hidden className="h-full rounded-full bg-[radial-gradient(circle,var(--color-page-glow)_0%,transparent_70%)]" />
            </FadeIn>
            <FlipIn from={handoff?.monsterFrom} className="relative">
              <Monster character={character} size={260} />
            </FlipIn>
          </div>

          <FadeIn show={intro} delay={0.35} className="min-w-0">
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
          </FadeIn>
        </div>

        <FadeIn show={intro} delay={0.7}>
          <section className="mt-8 border-t border-dashed border-line pt-6">
            <h3 className="font-display text-2xl">{COPY.storyHeading}</h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">{COPY.storyNote}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed">{character.originStory}</p>
          </section>
          <p className="mt-6 text-xs text-muted">{COPY.artNote}</p>
        </FadeIn>
      </div>
    </article>
  );
}
