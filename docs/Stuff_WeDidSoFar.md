# Stuff We Did So Far

A running log of what's done, what's in progress, and what's next. Read this first if you just cloned the repo or are catching up.

**Last updated:** 31 Oct 2026, ~10:40 (latest commit on `main`: `d8d283f`)

---

## Status at a glance

| Area | Owner | Status |
|---|---|---|
| Design doc, idea, plan | Team | ✅ Done ([DESIGN.md](DESIGN.md)) |
| Next.js app scaffold + libraries | A | ✅ Done |
| Shared data contract (`src/lib/contract.ts`) | Team | ✅ Done (agree before changing) |
| Sample response (`src/fixtures/example.json`) | B | ✅ Done (hand-written, swap for a real one before the demo) |
| Security patches (Next.js, React, PostCSS) | A | ✅ Done |
| GitHub fetch + URL parsing (`src/lib/github.ts`) | A | ⬜ Not started (stub) |
| Facts builder (`src/lib/facts.ts`) | A | ⬜ Not started (stub) |
| Claude call + validation + fallback (`src/lib/generate.ts`) | A | ⬜ Not started (stub) |
| `/api/summon` route + cache | A | 🟨 Route and error handling wired up; cache TODO |
| Input page, example repos, states (`src/app/page.tsx`) | B | 🟨 Input, loading, error + retry and "See a saved example" work (unstyled); final example repo picks TODO |
| Monster SVG part library (`src/components/Monster/`) | B | ⬜ Not started (placeholder) |
| Reveal animation (`src/components/Reveal.tsx`) | B | ⬜ Not started |
| Result card + trait chips | B | 🟨 Basic layout, art direction TODO |
| Art direction (`globals.css`) | B | ⬜ Not started |
| Vercel deploy + env vars | A | ⬜ Not started |
| Demo script, video, screenshots ([PITCH.md](PITCH.md)) | B | ⬜ Not started |

Legend: ✅ done · 🟨 partly done · ⬜ not started

Find each builder's open tasks in the code by searching for `TODO(A)` and `TODO(B)`.

---

## Log (newest first)

### 31 Oct 2026
- **Security patches** (`d8d283f`): Next.js 15.5.4 → 15.5.28 (fixes a critical RCE advisory), React 19.1.0 → 19.1.10, PostCSS forced to 8.5.32. `npm audit --omit=dev` reports 0 issues. **If you cloned before this, run `npm install` again.**
- **Review fixes + setup guide** (`f0f97a1`): fixed issues found in review and wrote the full setup steps in the README.
- **App scaffolded** (`98a37fa`): Next.js App Router + TypeScript + Tailwind, the shared Zod contract, a sample fixture, and stub files for both builders.
- **Design doc** (`e153231`, `f09b74f`): product, MVP, stack, visual approach, data contract, ownership split, timeline and risks in [DESIGN.md](DESIGN.md).
- **Repo created** (`88d6b0b`).

---

## Next up
1. **A:** implement `parseRepoUrl` and `fetchRepoSnapshot` in `github.ts`, then `buildFacts`, then the Claude call. Goal: one real repo end to end by the 1:00 mark.
2. **B:** start the monster part library (ghost, zombie, golem) against the fixture, then the reveal.
3. **Both:** get API keys into `.env.local` (see README step 3).

## Open questions / blockers
- Team table in the README is still empty. Add your names and roles.
