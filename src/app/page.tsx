// OWNER: Builder B. Input, loading, result, and error with retry.
"use client";
import { useState, type FormEvent } from "react";
import { SummonResponseSchema, type SummonSuccess } from "@/lib/contract";
import { exampleResult } from "@/lib/examples";
import { COPY } from "@/content/copy";
import { DigLoader } from "@/components/DigLoader";
import { ResultCard } from "@/components/ResultCard";
import { Reveal } from "@/components/Reveal";

/** Three contrasting public repos for judges: a huge framework, a classic library, a tiny utility. */
const EXAMPLE_REPOS = [
  "https://github.com/facebook/react",
  "https://github.com/psf/requests",
  "https://github.com/vercel/ms",
] as const;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: SummonSuccess; runId: number }
  | { status: "error"; message: string };

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function summon(repoUrl: string) {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/summon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });
      const parsed = SummonResponseSchema.safeParse(await res.json());
      if (!parsed.success) {
        setState({ status: "error", message: COPY.badResponse });
        return;
      }
      const data = parsed.data;
      setState(data.ok ? { status: "done", result: data, runId: Date.now() } : { status: "error", message: data.message });
    } catch {
      setState({ status: "error", message: COPY.offline });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void summon(url);
  }

  function tryExample(repoUrl: string) {
    setUrl(repoUrl);
    void summon(repoUrl);
  }

  const busy = state.status === "loading";

  return (
    <main className="min-h-dvh px-4 pb-48 pt-12 sm:pt-16">
      <header className="mx-auto mb-8 max-w-xl text-center">
        <h1 className="font-display text-6xl sm:text-7xl">{COPY.appName}</h1>
        <p className="mt-3 text-lg text-muted">{COPY.tagline}</p>
      </header>

      <form onSubmit={onSubmit} className="mx-auto mb-4 flex max-w-xl gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={COPY.inputPlaceholder}
          aria-label={COPY.inputLabel}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 outline-none focus-visible:border-highlight"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {COPY.submit}
        </button>
      </form>

      <div className="mx-auto mb-10 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
        <span>{COPY.examplesLabel}</span>
        {EXAMPLE_REPOS.map((repoUrl) => (
          <button
            key={repoUrl}
            type="button"
            disabled={busy}
            onClick={() => tryExample(repoUrl)}
            className="underline underline-offset-2 hover:text-ink disabled:opacity-50"
          >
            {repoUrl.replace("https://github.com/", "")}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => setState({ status: "done", result: exampleResult, runId: Date.now() })}
          className="underline underline-offset-2 hover:text-ink disabled:opacity-50"
        >
          {COPY.savedExample}
        </button>
      </div>

      {state.status === "loading" && <DigLoader />}
      {state.status === "error" && (
        <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-line bg-surface-strong p-5 text-center">
          <p>{state.message}</p>
          <button type="button" onClick={() => void summon(url)} className="mt-3 underline underline-offset-2">
            {COPY.retry}
          </button>
        </div>
      )}
      {state.status === "done" && (
        <Reveal key={state.runId}>
          <ResultCard result={state.result} />
        </Reveal>
      )}
    </main>
  );
}
