// OWNER: Builder B. Result screen: a big monster beside its signature trait, two smaller traits, the origin
// story, and every fact we found in a "What we could inspect" panel (weak evidence lives there, not up top).
// With `handoff`, it picks up where the monster lab left off: the panel grows out of the lab panel,
// the monster flies from the lab into its slot, and the text fades in around it.
// Clicking the monster (or the Dissect button) opens the dissect report under the top row.
"use client";
import { useMemo, useState } from "react";
import type { SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { Monster } from "@/components/Monster/Monster";
import { FadeIn, FlipIn, PANEL_LAYOUT_ID, PanelPlate, type Rect } from "@/components/lab/Handoff";
import { TraitChip } from "@/components/TraitChip";
import { factsByOrigin } from "@/components/evidence";
import { dissect } from "@/components/dissect";
import { DissectPanel } from "@/components/DissectPanel";

/** Shown in the dissect report instead of the inspect list. */
const REPORT_ONLY = new Set(["f_code_excerpt"]);

type Props = { result: SummonSuccess; handoff?: { monsterFrom: Rect | null } };

export function ResultCard({ result, handoff }: Props) {
  const { facts, character } = result;
  const factById = new Map(facts.facts.map((f) => [f.id, f]));
  const badge = COPY.sourceBadge[character.source];
  const intro = Boolean(handoff);
  const [signature, ...others] = character.traits;
  const report = useMemo(() => dissect(result), [result]);
  const [dissecting, setDissecting] = useState(false);

  return (
    <article className="relative mx-auto w-full max-w-5xl overflow-x-clip p-5 sm:p-8">
      <PanelPlate layoutId={intro ? PANEL_LAYOUT_ID : undefined} />
      <div className="relative">
        <FadeIn show={intro} delay={0.5}>
          {badge && <span className="rounded-full bg-badge px-3 py-1 text-xs text-badge-ink">{badge}</span>}
        </FadeIn>

        <div className="mt-4 grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="relative flex flex-col items-center px-6 py-10 sm:px-20">
            <FadeIn show={intro} delay={0.4} className="absolute inset-x-6 bottom-4 top-10">
              <div aria-hidden className="h-full rounded-full bg-[radial-gradient(circle,var(--color-page-glow)_0%,transparent_70%)]" />
            </FadeIn>
            <FlipIn from={handoff?.monsterFrom} className="relative">
              {report ? (
                <button
                  type="button"
                  onClick={() => setDissecting(true)}
                  title={COPY.dissect.monsterHint}
                  aria-label={COPY.dissect.monsterHint}
                  className="cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-highlight"
                >
                  <Monster character={character} size={300} facts={facts.facts} className="h-auto max-w-full" />
                </button>
              ) : (
                <Monster character={character} size={300} facts={facts.facts} className="h-auto max-w-full" />
              )}
            </FlipIn>
          </div>

          <FadeIn show={intro} delay={0.35} className="min-w-0">
            <h2 className="font-display text-4xl leading-tight break-words sm:text-5xl">{character.name}</h2>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted">
              {COPY.summonedFrom}{" "}
              <a className="underline underline-offset-2 hover:text-ink" href={facts.url} target="_blank" rel="noreferrer">
                {facts.repo}
              </a>
            </p>
            <ul className="mt-5">
              <TraitChip index={0} trait={signature} fact={factById.get(signature.factId)} signature />
            </ul>
            {report && (
              <button
                type="button"
                onClick={() => setDissecting((open) => !open)}
                aria-expanded={dissecting}
                className="mt-3 rounded-xl border border-highlight/60 px-4 py-2 text-sm text-highlight transition hover:bg-highlight/10"
              >
                {COPY.dissect.button.replace("{part}", report.part)}
              </button>
            )}
          </FadeIn>
        </div>

        {report && dissecting && <DissectPanel report={report} onClose={() => setDissecting(false)} />}

        <FadeIn show={intro} delay={0.55}>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {others.map((trait, index) => (
              <TraitChip key={`${index}-${trait.factId}`} index={index + 1} trait={trait} fact={factById.get(trait.factId)} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">{COPY.evidenceHint}</p>
        </FadeIn>

        <FadeIn show={intro} delay={0.7}>
          <section className="mt-8 border-t border-dashed border-line pt-6">
            <h3 className="font-display text-2xl">{COPY.storyHeading}</h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">{COPY.storyNote}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed">{character.originStory}</p>
          </section>

          <details open className="mt-8 rounded-2xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-display text-xl">{COPY.result.inspectHeading}</summary>
            <p className="mt-2 text-xs text-muted">{COPY.result.inspectNote}</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {factsByOrigin(facts.facts.filter((f) => !REPORT_ONLY.has(f.id))).map(({ origin, facts: group }) => (
                <section key={origin}>
                  <h4 className="text-xs uppercase tracking-widest text-highlight">{COPY.result.origins[origin]}</h4>
                  <dl className="mt-2 grid gap-1 text-sm">
                    {group.map((fact) => (
                      <div key={fact.id} className="flex flex-wrap gap-x-2">
                        <dt className="text-muted">{fact.label}:</dt>
                        <dd className="[overflow-wrap:anywhere]">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </details>
          <p className="mt-6 text-xs text-muted">{COPY.artNote}</p>
        </FadeIn>
      </div>
    </article>
  );
}
