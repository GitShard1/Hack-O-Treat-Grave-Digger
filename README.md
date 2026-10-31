# Grave Digger 🪦

> Every codebase has a monster inside it. Meet yours, and see what brought it to life.

Built for the Hack-O-Treat hackathon. Design doc: [docs/DESIGN.md](docs/DESIGN.md)

## The Problem
_What problem are we solving, and for whom?_

## Our Solution
_What did we build? How does it work?_

## Demo
- **Live demo:** _link_
- **Video:** _link_
- **Screenshots:** _add to `assets/`_

## Tech Stack
- Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS
- Anthropic Claude (structured output) for character generation
- GitHub REST API (bounded fetch, no cloning)
- Zod for runtime validation, procedural SVG for the art
- Deployed on Vercel

## Getting Started
```bash
git clone https://github.com/GitShard1/Hack-O-Treat.git
cd Hack-O-Treat
npm install
cp .env.example .env.local   # then fill in keys locally; never commit .env.local
npm run dev                  # http://localhost:3000
```
Keys are read on the server only (`src/lib/github.ts`, `src/lib/generate.ts`). On Vercel, set them under Project → Settings → Environment Variables.

## Project Structure
```
src/lib/contract.ts         shared data contract (zod schemas + types), agree before changing
src/fixtures/example.json   sample response so the UI can be built before the API works

Builder A (data & generation)
src/lib/github.ts           bounded GitHub fetch, URL parsing, errors
src/lib/facts.ts            snapshot → evidence facts (deterministic)
src/lib/generate.ts         Claude call + validation + fallback character
src/app/api/summon/route.ts POST /api/summon

Builder B (experience & visuals)
src/app/page.tsx            input, loading, error/retry, result
src/components/Monster/     procedural SVG part library
src/components/ResultCard.tsx, TraitChip.tsx

docs/                       design doc, idea, plan, pitch
```
Search for `TODO(A)` / `TODO(B)` to find each builder's next steps.

## Team
| Name | Role | GitHub |
|------|------|--------|
|      |      |        |

## Challenges & What We Learned
_TBD_

## What's Next
_TBD_
