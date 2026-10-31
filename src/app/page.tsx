// OWNER: Builder B. Input, example repos, loading, the monster lab and result, and error with retry.
"use client";
import { useState, type FormEvent } from "react";
import { SummonResponseSchema, type SummonSuccess } from "@/lib/contract";
import { exampleResult } from "@/lib/examples";
import { COPY } from "@/content/copy";
import { AuthButton } from "@/components/AuthButton";
import { DigLoader } from "@/components/DigLoader";
import { SummonReveal } from "@/components/lab/SummonReveal";
import { SketchFrame } from "@/components/SketchFrame";

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
    <main className="min-h-dvh px-4 pb-56 pt-5 sm:pt-6">
      <div className="mx-auto mb-8 max-w-2xl sm:mb-12">
        <AuthButton />
      </div>
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-6xl leading-none sm:text-7xl">{COPY.appName}</h1>
        <p className="mt-4 text-sm text-muted sm:text-base">
          <span className="text-highlight">{"// "}</span>
          {COPY.tagline}
        </p>
      </header>

      <SketchFrame as="section" className="mx-auto mt-8 max-w-2xl rounded-[1.6rem] bg-surface-strong p-5 backdrop-blur-sm sm:p-7">
        <p className="text-sm text-muted">{COPY.blurb}</p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={COPY.inputPlaceholder}
            aria-label={COPY.inputLabel}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus-visible:border-highlight"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-7 py-3 font-display text-2xl leading-none text-primary-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {COPY.submit}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">{COPY.examplesLabel}</span>
          {EXAMPLE_REPOS.map((repoUrl) => (
            <button
              key={repoUrl}
              type="button"
              disabled={busy}
              onClick={() => tryExample(repoUrl)}
              className="rounded-full border border-line px-3 py-1 text-muted transition hover:border-highlight hover:text-ink disabled:opacity-50"
            >
              {repoUrl.replace("https://github.com/", "")}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => setState({ status: "done", result: exampleResult, runId: Date.now() })}
            className="px-1 text-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
          >
            {COPY.savedExample}
          </button>
        </div>
      </SketchFrame>

      <div className="mt-10">
        {state.status === "loading" && <DigLoader />}
        {state.status === "error" && (
          <SketchFrame className="mx-auto max-w-xl rounded-[1.6rem] bg-surface-strong p-5 text-center" tone="border-primary">
            <p role="alert" className="text-sm">{state.message}</p>
            <button type="button" onClick={() => void summon(url)} className="mt-3 text-sm underline underline-offset-2">
              {COPY.retry}
            </button>
          </SketchFrame>
        )}
        {state.status === "done" && (
          <SummonReveal key={state.runId} result={state.result} />
        )}
      </div>
    </main>
  );
}
