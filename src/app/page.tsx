// OWNER: Builder B. Input, loading, result, and error with retry.
"use client";
import { useState, type FormEvent } from "react";
import { SummonResponseSchema, type SummonSuccess } from "@/lib/contract";
import { exampleResult } from "@/lib/examples";
import { ResultCard } from "@/components/ResultCard";
import { Reveal } from "@/components/Reveal";

// TODO(B): pick three contrasting public repos for judges (big framework, tiny script, no README).
const EXAMPLE_REPOS = [
  "https://github.com/facebook/react",
  "https://github.com/psf/requests",
  "https://github.com/jonschlinkert/is-odd",
] as const;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: SummonSuccess }
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
        setState({ status: "error", message: "The graveyard sent back something strange. Try again." });
        return;
      }
      const data = parsed.data;
      setState(data.ok ? { status: "done", result: data } : { status: "error", message: data.message });
    } catch {
      setState({ status: "error", message: "Couldn't reach the graveyard. Check your connection and try again." });
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

  return (
    <main className="min-h-screen px-4 py-12">
      <header className="mx-auto mb-8 max-w-xl text-center">
        <h1 className="text-4xl font-bold">Grave Digger</h1>
        <p className="mt-2 opacity-80">Every codebase has a monster inside it. Meet yours.</p>
      </header>

      <form onSubmit={onSubmit} className="mx-auto mb-4 flex max-w-xl gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="Public GitHub repository URL"
          className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          Dig
        </button>
      </form>

      <div className="mx-auto mb-8 flex max-w-xl flex-wrap justify-center gap-3 text-sm">
        {EXAMPLE_REPOS.map((repoUrl) => (
          <button key={repoUrl} type="button" onClick={() => tryExample(repoUrl)} className="underline opacity-70">
            {repoUrl.replace("https://github.com/", "")}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setState({ status: "done", result: exampleResult })}
          className="underline opacity-70"
        >
          See a saved example
        </button>
      </div>

      {state.status === "loading" && <p className="text-center">Digging up your repo...</p>}
      {state.status === "error" && (
        <div className="mx-auto max-w-xl text-center" role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={() => void summon(url)} className="mt-2 underline">
            Try again
          </button>
        </div>
      )}
      {state.status === "done" && (
        <Reveal>
          <ResultCard result={state.result} />
        </Reveal>
      )}
    </main>
  );
}
