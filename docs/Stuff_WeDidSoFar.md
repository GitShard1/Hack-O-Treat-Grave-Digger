# Stuff We Did So Far

A running log of what's done, what's in progress, and what's next. Read this first if you just cloned the repo or are catching up.

**Last updated:** 31 Oct 2026, ~11:00 (latest code commit on `main`: `d774953`)

**Health check at this update:** `npm test` 24/24 passing · `npx tsc --noEmit` clean · `npm run lint` clean

---

## Status at a glance

| Area | Owner | Status |
|---|---|---|
| Design doc, idea, plan | Team | ✅ Done ([DESIGN.md](DESIGN.md)) |
| Next.js app scaffold + libraries | A | ✅ Done |
| Shared data contract (`src/lib/contract.ts`) | Team | ✅ Done (agree before changing) |
| Security patches (Next.js, React, PostCSS) | A | ✅ Done |
| **GitHub fetch + URL parsing (`src/lib/github.ts`)** | A | ⬜ **Not started, and it's the blocker.** Needs the GitHub token. Until it's done, every real repo URL returns "not implemented". |
| Dependency parsing (`src/lib/manifest.ts`) | A | ✅ Done (package.json, pyproject.toml, requirements.txt, Cargo.toml, go.mod) |
| Facts builder (`src/lib/facts.ts`) | A | ✅ Done |
| Palette from languages (`src/lib/palette.ts`) | A | ✅ Done |
| Fallback character, no AI needed (`src/lib/fallback.ts`) | A | ✅ Done |
| Claude call + validation + retry (`src/lib/generate.ts`) | A | ✅ Done (Claude Haiku 5.5; needs `ANTHROPIC_API_KEY` to run live) |
| `/api/summon` route | A | 🟨 Wired up; in-memory cache still TODO |
| Tests (Vitest) | A | ✅ 24 tests on real GitHub snapshots |
| Input page, loading, error + retry (`src/app/page.tsx`) | B | ✅ Done |
| Monster SVG (`src/components/Monster/`) | B | ✅ 6 archetypes, 5 eye styles, 6 accessories, 4 auras |
| Reveal animation, dig loader, graveyard backdrop | B | ✅ Done |
| Result card + evidence trait chips | B | ✅ Done |
| Themeable art direction (`src/styles/theme.css`, `src/content/copy.ts`) | B | ✅ Done; see "Changing the art direction" in the README |
| `/lab` dev page (every archetype) | B | ✅ Done |
| Saved example from a real repo (`src/lib/examples.ts`) | B | ⬜ Still the hand-written sample. Swap before the demo. |
| Vercel deploy + env vars | A | ⬜ Not started |
| Demo script, video, screenshots ([PITCH.md](PITCH.md)) | B | ⬜ Not started |
| Team table in README | Team | ⬜ Empty |

Legend: ✅ done · 🟨 partly done · ⬜ not started

Find each builder's open tasks in the code by searching for `TODO(A)` and `TODO(B)`.

---

## Log (newest first)

### 31 Oct 2026
- **~10:55: data layer, Claude generation, monster art, themeable UI** (`d774953`, 32 files). Everything except the GitHub fetch is now built. See the commit for details. Highlights:
  - Dependency parsing, facts builder, language palette and an AI-free fallback character. These all work without API keys.
  - Claude Haiku 5.5 with structured output. README and manifest text is fenced off as untrusted data. Output is checked against the schema, fact IDs and word count, retried once, then falls back.
  - SVG monster with 6 archetypes, plus the reveal, dig loader, graveyard backdrop and evidence chips.
  - All colours and fonts are tokens in `src/styles/theme.css` and all wording is in `src/content/copy.ts`, so the look can change without touching logic.
  - `/lab` page at http://localhost:3000/lab shows every archetype.
  - 24 Vitest tests. New command: `npm test`.
  - **`package.json` changed: run `npm install` after pulling.**
- **~10:40: progress log added** (`6b905ac`). This file, linked from the README.
- **~10:35: security patches** (`d8d283f`). Next.js 15.5.4 → 15.5.28 (fixes a critical RCE advisory), React 19.1.0 → 19.1.10, PostCSS forced to 8.5.32. `npm audit --omit=dev` reports 0 issues.
- **Review fixes + setup guide** (`f0f97a1`). Fixed issues found in review and wrote the full setup steps in the README.
- **App scaffolded** (`98a37fa`). Next.js App Router, TypeScript and Tailwind, the shared Zod contract, a sample fixture and stub files for both builders.
- **Design doc** (`e153231`, `f09b74f`). Product, MVP, stack, visual approach, data contract, ownership split, timeline and risks in [DESIGN.md](DESIGN.md).
- **Repo created** (`88d6b0b`).

---

## Next up
1. **A: implement `parseRepoUrl` and `fetchRepoSnapshot` in `src/lib/github.ts`.** This is the only missing piece between the UI and a real repo. Then add the `/api/summon` cache.
2. **Both:** put `GITHUB_TOKEN` and `ANTHROPIC_API_KEY` into `.env.local` (README step 3), then run 3 contrasting repos end to end.
3. **B:** replace the sample in `src/lib/examples.ts` with a saved result from a real repo, and confirm the 3 example repo buttons.
4. **A:** deploy to Vercel and set the env vars there.

## Open questions / blockers
- **The GitHub fetch blocks any live demo.** The 1:00 milestone ("one real repo end to end") depends on it.
- Team table in the README is still empty. Add your names and roles.
