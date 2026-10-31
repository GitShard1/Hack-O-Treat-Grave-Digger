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

**New to this? Follow the step-by-step Windows guide: [docs/RUN_LOCALLY.md](docs/RUN_LOCALLY.md).**

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
| `ANTHROPIC_API_KEY` | Claude API key from [console.anthropic.com](https://console.anthropic.com) (needs API credits, not a Claude subscription) | Whoever owns generation |
| `GITHUB_TOKEN` | Fine-grained GitHub token, public repositories, read-only. Raises the limit from 60 to 5,000 GitHub calls per hour. If set, it is checked at startup and the app will not start if GitHub rejects it | Builder A |
| `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_SLUG`, `SESSION_SECRET`, `APP_URL` | GitHub sign-in for private repos. See [GitHub sign-in](#github-sign-in-private-repos) below | Builder A |

Everything is optional. With no keys at all, public repos work and get the built-in fallback monster.

Rules for keys:
- `.env.local` is ignored by git. **Never commit it, paste keys in chat, or put them in code.**
- Keys are only read on the server (`src/lib/github-auth.ts`, `src/lib/generate.ts`, `src/lib/auth/`, all marked `server-only`). They never reach the browser.
- The app still starts without keys. Features that need them return an error or the fallback character. A `GITHUB_TOKEN` that is set but wrong stops startup with a clear message, so a bad token is caught early.

### 4. Run it
```bash
npm run dev
```
Open http://localhost:3000. Click **See a saved example** to see the full result screen without any keys.

### GitHub sign-in (private repos)
Sign-in uses a **GitHub App**, which only gets read-only access to the repos each user picks. There's no database: the user's GitHub token is encrypted into an httpOnly cookie with `SESSION_SECRET` and expires after 8 hours.

One-time setup (whoever owns the GitHub account):
1. Go to GitHub **Settings > Developer settings > GitHub Apps > New GitHub App**.
2. **Homepage URL:** your site URL (or `http://localhost:3000`).
3. **Callback URL:** `http://localhost:3000/api/auth/github/callback`. Add your deployed URL's `/api/auth/github/callback` too when you deploy.
4. Tick **Expire user authorization tokens** and **Request user authorization (OAuth) during installation**.
5. **Webhook:** untick **Active**.
6. **Repository permissions:** set **Contents** to **Read-only** and **Metadata** to **Read-only**. Leave everything else at **No access**.
7. **Where can this GitHub App be installed?** Pick **Any account** so teammates and judges can use it.
8. Create the app, then **Generate a new client secret**.
9. Put these in `.env.local` (and in your server's environment settings when deployed):
   - `GITHUB_APP_CLIENT_ID`: the app's Client ID
   - `GITHUB_APP_CLIENT_SECRET`: the secret from step 8
   - `GITHUB_APP_SLUG`: the last part of the app's public page, `https://github.com/apps/<slug>`
   - `SESSION_SECRET`: run `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   - `APP_URL`: `http://localhost:3000` locally, your real URL when deployed

How users use it: **Sign in with GitHub**, then pick which repos Grave Digger may read (the **Choose repos** link changes this later). A private repo that wasn't picked shows as "not found". For private repos, README and dependency-file excerpts are sent to Anthropic's API to write the monster; results are never cached or shared.

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
src/lib/github.ts            Bounded GitHub fetch (6 calls max) and URL parsing
src/lib/github-auth.ts       GITHUB_TOKEN lookup and startup check (run from src/instrumentation.ts)
src/lib/auth/                GitHub App sign-in and encrypted session cookie
src/app/api/auth/            Sign-in, callback, sign-out and "who am I" routes
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
src/components/              Reveal, ResultCard, TraitChip, DigLoader, SketchFrame
src/components/scene/        Layered backdrop: moon, bats, code rain, tombstones, sketch filters
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
| Backdrop scene | `src/components/scene/Scene.tsx` (layers, parallax depth) and `CodeRain.tsx` |
| Hand-drawn wobble | `src/components/scene/SketchDefs.tsx` (filter strength) |
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
