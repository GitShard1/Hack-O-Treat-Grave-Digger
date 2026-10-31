// OWNER: Builder B. "Watch it evolve": the same file-list rules replayed at a few commits across the
// repo's history, shown one step at a time with Prev / Next / Play. Loads only when asked (up to 8 GitHub calls).
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Character } from "@/lib/contract";
import { EvolutionResponseSchema, type EvolutionSuccess } from "@/lib/evolution";
import { COPY } from "@/content/copy";
import { Monster } from "@/components/Monster/Monster";
import { SIGNATURE_RULES } from "@/components/dissect";

type Props = { repo: string; character: Character };
type State = { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "done"; data: EvolutionSuccess };

const PLAY_MS = 1800;
const ruleName = (id: string | null) => (id ? (SIGNATURE_RULES.find((r) => r.factId === id)?.name ?? id) : COPY.evolution.noSignature);

export function Evolution({ repo, character }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const copy = COPY.evolution;

  async function load() {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/evolution?repo=${encodeURIComponent(repo)}`);
      const parsed = EvolutionResponseSchema.safeParse(await res.json());
      if (!parsed.success) return setState({ status: "error", message: COPY.badResponse });
      if (!parsed.data.ok) return setState({ status: "error", message: parsed.data.message });
      setIndex(0);
      setState({ status: "done", data: parsed.data });
    } catch {
      setState({ status: "error", message: COPY.offline });
    }
  }

  const points = state.status === "done" ? state.data.points : [];
  const last = points.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((i) => Math.min(i + 1, last)), PLAY_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index, last]);

  if (state.status !== "done") {
    return (
      <section className="mt-8 rounded-2xl border border-line bg-surface p-4">
        <h3 className="font-display text-xl">{copy.heading}</h3>
        <p className="mt-1 text-xs text-muted">{copy.intro}</p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={state.status === "loading"}
          className="mt-3 rounded-xl border border-highlight/60 px-4 py-2 text-sm text-highlight transition hover:bg-highlight/10 disabled:opacity-50"
        >
          {state.status === "loading" ? copy.loading : copy.start}
        </button>
        {state.status === "error" && <p role="alert" className="mt-2 text-sm">{state.message}</p>}
      </section>
    );
  }

  const { data } = state;
  const point = points[index];
  if (!point) return null;
  const previous = index > 0 ? points[index - 1] : undefined;
  const signature = point.facts.find((f) => f.id === point.signatureId);
  const view: Character = point.signatureId
    ? { ...character, traits: [{ ...character.traits[0], factId: point.signatureId }, character.traits[1], character.traits[2]] }
    : character;
  const delta = previous ? point.fileCount - previous.fileCount : null;
  const changed = previous && previous.signatureId !== point.signatureId;
  const types = point.facts.find((f) => f.id === "f_tree_types")?.value;

  return (
    <section className="mt-8 rounded-2xl border border-highlight/50 bg-surface-strong p-4 text-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-highlight">
          {copy.command} {data.repo}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <button type="button" onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0} className="rounded-lg border border-line px-3 py-1 disabled:opacity-40">
            {copy.prev}
          </button>
          <span className="tabular-nums text-muted">
            {index + 1}/{points.length}
          </span>
          <button type="button" onClick={() => setIndex((i) => Math.min(i + 1, last))} disabled={index === last} className="rounded-lg border border-highlight/60 px-3 py-1 text-highlight disabled:opacity-40">
            {copy.next}
          </button>
          <button
            type="button"
            onClick={() => {
              if (index === last) setIndex(0);
              setPlaying((p) => !p);
            }}
            className="rounded-lg border border-line px-3 py-1"
          >
            {playing ? copy.pause : copy.play}
          </button>
        </div>
      </div>

      <ol className="mt-3 flex gap-1" aria-hidden>
        {points.map((p, i) => (
          <li key={p.sha} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-highlight" : "bg-line"}`} />
        ))}
      </ol>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex justify-center overflow-hidden px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div key={point.sha} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.3 }}>
              <Monster character={view} size={130} facts={point.facts} />
            </motion.div>
          </AnimatePresence>
        </div>
        <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
          <dt className="text-muted">{copy.rows.commit}</dt>
          <dd className="[overflow-wrap:anywhere]">
            {fill(copy.commitOf, { n: point.commitNumber.toLocaleString("en-US"), total: data.totalCommits.toLocaleString("en-US") })}{" "}
            <a href={`${data.url}/tree/${point.sha}`} target="_blank" rel="noreferrer" className="text-highlight underline underline-offset-2">
              {point.sha.slice(0, 7)}
            </a>
          </dd>
          <dt className="text-muted">{copy.rows.date}</dt>
          <dd>{point.date.slice(0, 10)}</dd>
          <dt className="text-muted">{copy.rows.files}</dt>
          <dd>
            {point.fileCount.toLocaleString("en-US")}
            {point.treeTruncated ? ` ${copy.truncated}` : ""}
            {delta !== null && <span className={delta >= 0 ? "text-highlight" : "text-muted"}> ({delta >= 0 ? "+" : ""}{delta.toLocaleString("en-US")})</span>}
          </dd>
          {types && (
            <>
              <dt className="text-muted">{copy.rows.mix}</dt>
              <dd className="[overflow-wrap:anywhere]">{types}</dd>
            </>
          )}
          <dt className="text-muted">{copy.rows.signature}</dt>
          <dd className="[overflow-wrap:anywhere]">
            <span className="text-highlight">{ruleName(point.signatureId)}</span>
            {signature && <span className="text-muted">: {signature.value}</span>}
          </dd>
          {changed && (
            <>
              <dt className="text-muted">{copy.rows.changed}</dt>
              <dd>{fill(copy.switched, { from: ruleName(previous.signatureId), to: ruleName(point.signatureId) })}</dd>
            </>
          )}
        </dl>
      </div>
      <p className="mt-3 text-xs text-muted">{copy.note}</p>
    </section>
  );
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}
