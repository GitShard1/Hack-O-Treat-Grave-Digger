# Grave Digger

> Every codebase has a monster inside it. Meet yours, and see what brought it to life.

Paste a public GitHub repository URL. Grave Digger reads a small set of real facts about the repository and turns it into a Halloween character: a procedurally drawn monster, three traits that each show the repository fact behind them, and a short fictional origin story.

Built for the Hack-O-Treat hackathon. Design doc: [docs/DESIGN.md](docs/DESIGN.md)

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
| `GITHUB_TOKEN` | Fine-grained GitHub token, public repositories, read-only | Builder A |

Rules for keys:
- `.env.local` is ignored by git. **Never commit it, paste keys in chat, or put them in code.**
- Keys are only read on the server (`src/lib/github.ts`, `src/lib/generate.ts`, both marked `server-only`). They never reach the browser.
- The app still starts without keys. Features that need them return an error or the fallback character.

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
| `npm run lint` | Checks code style |
| `npx tsc --noEmit` | Checks types |

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
src/fixtures/example.json    Sample response so the UI can be built before the API works

Builder A (data and generation)
src/lib/github.ts            Bounded GitHub fetch, URL parsing, errors
src/lib/facts.ts             Repository snapshot to evidence facts (deterministic)
src/lib/generate.ts          Claude call, validation, fallback character
src/lib/errors.ts            Server error type
src/app/api/summon/route.ts  POST /api/summon

Builder B (experience and visuals)
src/app/page.tsx             Input, example repos, loading, error and retry
src/components/Monster/      Procedural SVG part library
src/components/Reveal.tsx    Reveal animation
src/components/ResultCard.tsx, TraitChip.tsx
src/lib/examples.ts          Saved examples

docs/                        Design doc, idea, plan, pitch
```
Search for `TODO(A)` and `TODO(B)` to find each builder's next steps. See [CONTRIBUTING.md](CONTRIBUTING.md) for how we work together.

## Team
| Name | Role | GitHub |
|------|------|--------|
|      |      |        |

## Challenges and What We Learned
_TBD_

## What's Next
_TBD_
