// OWNER: Builder B. Input → loading → result / error + retry.
"use client";
import { useState, type FormEvent } from "react";
import type { SummonResponse, SummonSuccess } from "@/lib/contract";
import { exampleResult } from "@/lib/examples";
import { ResultCard } from "@/components/ResultCard";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: SummonSuccess }
  | { status: "error"; message: string };

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function summon(e?: FormEvent) {
    e?.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/summon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as SummonResponse;
      setState(data.ok ? { status: "done", result: data } : { status: "error", message: data.message });
    } catch {
      setState({ status: "error", message: "Couldn't reach the graveyard. Check your connection and try again." });
    }
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <header className="mx-auto mb-8 max-w-xl text-center">
        <h1 className="text-4xl font-bold">Grave Digger</h1>
        <p className="mt-2 opacity-80">Every codebase has a monster inside it. Meet yours.</p>
      </header>

      <form onSubmit={summon} className="mx-auto mb-8 flex max-w-xl gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="Public GitHub repository URL"
          className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2"
          required
        />
        <button type="submit" disabled={state.status === "loading"} className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black disabled:opacity-50">
          Dig
        </button>
      </form>

      <div className="mx-auto mb-8 max-w-xl text-center">
        <button type="button" onClick={() => setState({ status: "done", result: exampleResult })} className="text-sm underline opacity-70">
          See a saved example
        </button>
      </div>

      {state.status === "loading" && <p className="text-center">Digging up your repo…</p>}
      {state.status === "error" && (
        <div className="mx-auto max-w-xl text-center" role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={() => summon()} className="mt-2 underline">Try again</button>
        </div>
      )}
      {state.status === "done" && <ResultCard result={state.result} />}
    </main>
  );
}
