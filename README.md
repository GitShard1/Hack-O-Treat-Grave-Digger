# Grave Digger

> Every codebase has a monster inside it. Meet yours, and see what brought it to life.

Paste a public GitHub repository URL. Grave Digger reads a small set of real facts about the repository and turns it into a Halloween character: a procedurally drawn monster, three traits that each show the repository fact behind them, and a short fictional origin story.

Built for the Hack-O-Treat hackathon. Design doc: [docs/DESIGN.md](docs/DESIGN.md)

> **Catching up? Start with [docs/Stuff_WeDidSoFar.md](docs/Stuff_WeDidSoFar.md)**: what's done, what's in progress, and what's next.

## Demo
- **Live demo:** _link_
- **Video:** _link_
- **Screenshots:** _add to `assets/`_

## Tech Stack
- Next.js 15 (App Router), TypeScript (strict), Tailwind CSS
- Anthropic Claude (structured output) for character generation
- GitHub REST API (a few bounded requests, no cloning)
- Zod for runtime validation; procedural SVG for the art
- Hosted on Vercel

---

## Setup

### 1. Prerequisites
- **Node.js 20 or newer.** Download it from [nodejs.org](https://nodejs.org). It includes **npm** (Node Package Manager), which installs the project's libraries and runs its commands.
- **Git**
- Check both are installed:
  ```bash
  node -v
  npm -v
  ```

### 2. Get the code and install libraries
```bash
git clone https://github.com/GitShard1/Hack-O-Treat.git
cd Hack-O-Treat
npm install
```
Run `npm install` again whenever someone adds a library (when `package.json` changes after a `git pull`).

### 3. Add your keys (local only)
Copy the example file:
```bash
cp .env.example .env.local
```
On Windows PowerShell, use `Copy-Item .env.example .env.local` instead.

Then open `.env.local` and fill in:

| Variable | What it is | Who sets it up |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key from [console.anthropic.com](https://console.anthropic.com) | Whoever owns generation |
| `GITHUB_TOKEN` | Fine-grained GitHub token, public repositories, read-only, no extra permissions. **Required.** Checked at startup: the app won't start if it is missing or rejected. | Builder A |

Rules for keys:
- `.env.local` is ignored by git. **Never commit it, paste keys in chat, or put them in code.**
- Keys are only read on the server (`src/lib/github.ts`, `src/lib/github-auth.ts`, `src/lib/generate.ts`, all marked `server-only`). They never reach the browser.
- The app starts without `ANTHROPIC_API_KEY`: the character falls back to a no-AI version. It does **not** start without `GITHUB_TOKEN`.

### 4. Run it
```bash
npm run dev
```
Open http://localhost:3000. Click **See a saved example** to see the full result screen without any keys.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app locally with live reload |
| `npm run build` | Builds the production version (run before pushing to catch errors) |
| `npm start` | Runs the production build locally (after `npm run build`) |
| `npm test` | Runs the tests (no API keys needed) |
| `npm run lint` | Checks code style |
| `npx tsc --noEmit` | Checks types |

While the dev server runs, http://localhost:3000/lab shows every monster archetype and two real repos run through the no-key pipeline. Use it when working on the art.

## Deploying (Vercel)
You don't need to run or manage a server. Vercel hosts the pages and runs `/api/summon` as a serverless function on demand. The free Hobby plan is enough for a hackathon.

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New > Project**, import `GitShard1/Hack-O-Treat`. Keep the default Next.js settings.
3. Under **Settings > Environment Variables**, add `ANTHROPIC_API_KEY` and `GITHUB_TOKEN`.
4. Deploy. Every push to `main` deploys again automatically.

If deployment fails on the day, demo locally with `npm run build` then `npm start`, and keep a backup video.

---

## Project Structure
```
src/lib/contract.ts          Shared data contract (Zod schemas and types). Agree before changing.

Builder A (data and generation)
src/lib/github.ts            URL parsing and bounded public GitHub fetch
src/lib/github-auth.ts       GITHUB_TOKEN check at startup (src/instrumentation.ts)
src/lib/facts.ts             Snapshot to measured numbers and evidence facts (deterministic)
src/lib/manifest.ts          Dependency names from package.json, pyproject.toml, requirements.txt, Cargo.toml, go.mod
src/lib/palette.ts           Monster colours from the language mix
src/lib/generate.ts          Claude call (structured output), validation, retry, then fallback
src/lib/fallback.ts          Deterministic character used when Claude is unavailable
src/lib/errors.ts            Server error type
src/app/api/summon/route.ts  POST /api/summon

Builder B (experience and visuals)
src/styles/theme.css         ALL colours and fonts (see "Changing the art direction")
src/content/copy.ts          All user-facing wording
src/app/page.tsx             Input, example repos, loading, error and retry
src/components/Monster/      Procedural SVG monster: bodies, eyes, accessories, auras
src/components/              Reveal, ResultCard, TraitChip, DigLoader, Graveyard backdrop
src/app/lab/page.tsx         Dev page showing every archetype
src/lib/examples.ts          Saved examples

src/fixtures/                Sample response and real GitHub snapshots (used by tests and /lab)
test/                        Vitest tests
docs/                        Design doc, idea, plan, pitch
docs/Stuff_WeDidSoFar.md     Progress log: what's done so far and what's next
```
Search for `TODO(A)` and `TODO(B)` to find each builder's next steps. See [CONTRIBUTING.md](CONTRIBUTING.md) for how we work together.

## Changing the art direction
The art direction can change at any time without touching component logic:

| To change | Edit |
|---|---|
| Any UI or SVG colour, the page background | `src/styles/theme.css` (semantic tokens such as `--color-primary`, `--art-outline`) |
| Fonts | `src/app/layout.tsx` (which fonts load) and `--font-display` / `--font-sans` in `theme.css` |
| Wording and tone | `src/content/copy.ts` |
| Monster shapes | `src/components/Monster/bodies.tsx` (one entry per archetype, each with anchor points) |
| Eyes, accessories, auras | `src/components/Monster/parts.tsx` |
| Backdrop scene | `src/components/Graveyard.tsx` |
| How repo facts map to looks | `src/lib/fallback.ts` and the prompt in `src/lib/generate.ts` |

Rules that keep this working:
- Components use semantic token classes (`bg-surface`, `text-muted`, `bg-primary`) and `ART.*` values, never raw colours.
- A monster's body colours come from the repo's languages (`src/lib/palette.ts`), so they are data, not theme.
- A new archetype, eye style, accessory or aura must be added to the enums in `src/lib/contract.ts` first; TypeScript then points to every place that needs a drawing.

## Team
| Name | Role | GitHub |
|------|------|--------|
|      |      |        |

## Challenges and What We Learned
_TBD_

## What's Next
_TBD_
