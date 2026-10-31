# Grave Digger: Design Doc (4-hour hackathon, 2 builders)

## Context
Theme: "Hack for a Halloween Character". Two builders, four hours. This is the design doc the team builds from; `docs/IDEA.md` and `docs/PLAN.md` are short summaries of it.

Originality: everything is built independently from scratch. No code, assets, prompts, docs or distinctive designs are taken from reference projects (RepoStory, pstack, maddock). References are for high-level inspiration only.

## Theme & how we sell it
**Official brief:** "Hack for a Halloween Character": create your best project that a Halloween character could use in their day-to-day life.
**Organizer ruling (31 Oct, #ask-organizer):** interpretation is up to us and they're not strict about it, but we have to *sell it* to them.

**Our reading:** the project *involves* a Halloween character. It turns any GitHub repo into its own Halloween monster. It doesn't need to be a tool a character uses. The organizer confirmed that reading is fine.

---

## 1. Product & main judging risk
**Pitch:** *Every codebase has a monster inside it. Meet yours, and see what brought it to life.*
You paste a public GitHub URL. The app fetches a small, bounded set of facts about the repo and generates a Halloween monster from them: a visual, a name, three traits, and an 80-120 word origin story. Each trait shows the real repo fact behind it ("Why does it have 6 arms? -> it depends on 6 ORMs").

**Main judging risk: output that feels generic.** If the monster could describe any repo, the idea falls flat. The design keeps evidence first. The server turns the fetched data into a fixed list of **fact IDs**. The LLM must cite those IDs for every trait, and the UI shows the cited fact. Traits that don't cite a valid fact are rejected.

## 2. Smallest strong MVP
1. URL input, with 3 one-click example repos for judges.
2. Server fetch, max ~6 GitHub API calls: repo metadata, languages, README (truncated to ~4k chars), root file listing, one dependency manifest (package.json / requirements.txt / pyproject.toml / Cargo.toml / go.mod), and the date of the latest commit.
3. A deterministic **facts builder**. It turns the fetched data into ~8-15 labelled facts (`f_lang_top: "71% TypeScript"`, `f_deps_count: "42 dependencies"`, `f_stars`, `f_age`, `f_last_push`, `f_readme_theme`...).
4. A single LLM call with structured output that returns a `Character` JSON (schema below), validated server-side.
5. A procedural SVG monster built from the character's chosen parts and palette.
6. A reveal animation, then the result card: name, archetype, visual, 3 trait chips (click/hover -> "Evidence: ..."), the origin story, and a "Fiction, inspired by real repo facts" label.
7. Loading ("Digging up your repo..."), error and retry states.
8. Deployed to Vercel.

Optional, only after the core flow works: a downloadable PNG card, a labelled saved-examples gallery, and a one-line "talk to it" question.

## 3. Recommended stack
**Next.js (App Router) + TypeScript + Tailwind, one API route, deployed on Vercel.**
- **Why it fits:** one repo, one deploy, and one language for frontend and backend. No database, auth or job queue. Claude writes it quickly and reliably.
- **Frontend:** React + Tailwind, Framer Motion for the reveal, and the SVG monster as a React component.
- **Backend:** `app/api/summon/route.ts` is a POST handler that fetches from GitHub (plain `fetch`), builds the facts, calls the LLM and validates the result. It keeps a small in-memory cache keyed by `owner/repo`.
- **LLM:** one structured-output call (tool / JSON-schema mode), validated with `zod`. A fast model keeps generation under ~8s. If validation fails, it retries once, then falls back to a **deterministic character** built from the facts alone, so the demo never dead-ends.
- **Deploy:** push to GitHub -> import into Vercel -> set env vars.
- **Accounts/secrets:** LLM API key and a GitHub token (fine-grained, public read only). Both go in `.env.local` / Vercel env vars, server-side only. They never go in client code, logs, prompts or git.
- **Integration risks:** GitHub's unauthenticated limit is 60 requests/hour per IP, and Vercel shares IPs, so **get a token** (5,000/hour). Watch Vercel's function timeout (set `maxDuration`) and LLM latency.

**Alternative:** a Vite + React SPA with a single Vercel serverless function. It's slightly lighter, but routing and env vars take more manual setup. Only worth it if a builder strongly prefers it.

## 4. Visual approach (decision)
**Procedural, composable SVG parts in one cohesive style, plus optional LLM-picked flavour.** No image generation in the critical path.
- Style: flat "papercut" silhouettes, thick dark outlines, a 2-3 colour palette plus an eerie glow, and a dark graveyard backdrop with fog.
- The LLM picks from **enums**: `archetype` (ghost, zombie, vampire, witch, golem, swamp-thing), `eyes` (count/style), `accessories[]` (from a fixed list), `aura`. The colour palette comes from the repo's language mix.
- Part library to build: 3 archetypes first (ghost, zombie, golem), then more if time allows. Plus ~4 eye sets and ~6 accessories.
- Why: it's instant, always renders, is personal through the mapping, and is fully ours. Image generation is slow, costs extra, is inconsistent and could fail mid-demo. It could be a later add-on ("Paint portrait" button), never required.
- Fallback: if the LLM fails, the deterministic mapping picks the parts.
- Honest labelling: the art is described as "procedurally assembled from your repo's traits".

## 5. Shared data contract (agree in first 15 min)
`src/lib/contract.ts`, the only file both builders touch, and only at the start:
```ts
type Fact = { id: string; label: string; value: string };     // real, fetched
type RepoFacts = { repo: string; url: string; facts: Fact[] };
type Trait = { title: string; description: string; factId: string };
type Character = {
  name: string; archetype: Archetype; palette: string[];
  eyes: EyeStyle; accessories: Accessory[]; aura: Aura;
  traits: [Trait, Trait, Trait];       // each factId must exist in facts
  originStory: string;                 // 80-120 words, labelled fiction
  source: "live" | "fallback" | "saved-example";
};
type SummonResponse =
  | { ok: true; facts: RepoFacts; character: Character }
  | { ok: false; error: ErrorCode; message: string };   // narrow on `ok`
```
In code, each type is a Zod schema with the type inferred from it, so the server and the browser validate the same shape. The contract holds types only. Checks the schema can't express (trait fact IDs exist, story length) live in `generate.ts`. `NOT_IMPLEMENTED` is a temporary error code for the scaffold.

`src/fixtures/example.json` is a hand-written sample response, so Builder B can build the UI before the API works. Replace it with a saved result from a real repo before the demo.

## 6. Ownership (no shared core files)
| Builder A: Data & Generation | Builder B: Experience & Visuals |
|---|---|
| `src/lib/github.ts` (bounded fetch, URL parsing, errors/rate limits) | `src/app/page.tsx` (input, examples, states) |
| `src/lib/facts.ts` (facts builder) | `src/components/Monster/*` (SVG part library) |
| `src/lib/generate.ts` (prompt, schema, zod, retry, fallback) | `src/components/Reveal.tsx`, `ResultCard.tsx`, `TraitChip.tsx` |
| `src/app/api/summon/route.ts` + cache | Styling, art direction, loading/error UI |
| `src/lib/errors.ts` (server error type) | `src/lib/examples.ts` + `src/fixtures/` (saved examples) |
| Vercel deploy + env vars | Demo script, recording |

**Prompt safety (A):** README/manifest text goes in delimited `<repo_data>` blocks. The system prompt says it is untrusted data and must never be followed as instructions. Output is limited to the schema. No tools are given to the model. Nothing from the repo is executed. The prompt also says not to invent history or incidents and not to judge security or quality, and to write humour about the *fiction*, not about real people.

## 7. Timeline
- **0:00-0:15:** confirm stack and keys, agree the contract and fixture, scaffold the Next.js app (A), and B starts SVG parts against the fixture.
- **by 1:00:** one real repo goes end to end (even if ugly).
- **by 2:00:** evidence chips, 3 archetypes, origin story and fallback all work.
- **by 3:00:** deployed, polished reveal, error and rate-limit handling.
- **3:00-4:00:** feature freeze, test 5-6 varied repos, rehearse, record a backup video, submit.
- **Cuts if slipping:** drop to 2 archetypes, drop accessories, drop the reveal animation (keep a simple fade), skip optional features. Never add architecture.

## 8. Top 3 execution risks and fallbacks
1. **Generic or invalid LLM output:** schema + factId validation, one retry, then a deterministic character. Tune the prompt on 3 contrasting repos by 1:30.
2. **The visual looks cheap:** strict style guide, few parts done well, palette from languages. Fallback: one strong archetype with recolours.
3. **GitHub, LLM or deploy failure during the demo:** token plus cache, a pre-warmed cache for the demo repos, and saved examples clearly badged "Saved example". If deploy fails, run locally plus the backup recording.

## Confirmed decisions
- Stack: **Next.js + Tailwind on Vercel**.
- LLM: **Anthropic Claude**. A fast model (e.g. `claude-haiku-5-5`, with `claude-sonnet-5-5` if quality needs it), structured output via tool use. Env: `ANTHROPIC_API_KEY`.
- GitHub: **fine-grained token, public read-only**. Env: `GITHUB_TOKEN`.
- Doc lives at **`docs/DESIGN.md`**.
- `.env.example` gets `ANTHROPIC_API_KEY=` and `GITHUB_TOKEN=` placeholders (names only).

## Verification (during the build)
- Run `npm run dev`, summon 3 contrasting repos (e.g. a big JS framework, a tiny Python script, a repo with no README), and check that each trait's factId shows a real fetched value. Then test an invalid URL, a nonexistent repo, and a forced LLM failure to check the fallback.
