# Stuff We Did So Far

A running log of what's done, what's in progress, and what's next. Read this first if you just cloned the repo or are catching up.

**Last updated:** 31 Oct 2026, ~13:10 (latest code commit on `main`: `0af3eaa`)

**Health check on `main` at this update:** `npm test` 80/80 passing (7 files) · `npx tsc --noEmit` clean · `npm run lint` clean · `npm run build` succeeds

New here? The step-by-step Windows setup guide is [RUN_LOCALLY.md](RUN_LOCALLY.md).

---

## Status at a glance

| Area | Owner | Status |
|---|---|---|
| Design doc, idea, plan | Team | ✅ Done ([DESIGN.md](DESIGN.md)) |
| Next.js app scaffold + libraries | A | ✅ Done |
| Shared data contract (`src/lib/contract.ts`) | Team | ✅ Done (agree before changing) |
| Security patches (Next.js, React, PostCSS) | A | ✅ Done |
| GitHub fetch + URL parsing (`src/lib/github.ts`) | A | ✅ Done: bounded fetch (6 calls max), redirects, timeouts, clear errors, empty-repo handling |
| `GITHUB_TOKEN` startup check (`src/instrumentation.ts`) | A | ✅ Done: optional; if set it's verified at startup and a rejected token stops the server |
| GitHub App sign-in for private repos | A | ✅ Done: read-only, user-picked repos, encrypted cookie session, no database. Needs the GitHub App env vars (see README). |
| Dependency parsing, facts builder, palette | A | ✅ Done |
| Claude call + validation + retry (`src/lib/generate.ts`) | A | 🟨 Code written (Claude Haiku 5.5) but **never run against the real API yet**. Needs `ANTHROPIC_API_KEY`. |
| Monster writing (name, traits, origin story) | Team | ⬜ **Not designed yet.** With no API key, or when Claude fails, you see placeholder text: "Placeholder Monster", "Placeholder trait N" and a Lorem ipsum story. This is on purpose, not a bug. |
| `/api/summon` route | A | 🟨 Works; in-memory cache still TODO (private results must never be cached) |
| Tests (Vitest) | A | ✅ 80 tests |
| Website style: sketchy code-and-Halloween scene | B | ✅ Done: parallax backdrop, code rain, bats, tombstones, hand-drawn line effect. Permanent Marker + JetBrains Mono fonts. |
| Monster SVG (`src/components/Monster/`) | B | ✅ 6 archetypes, 5 eye styles, 6 accessories, 4 auras. Restyle to match the new scene is the next art step. |
| Monster lab build sequence (replaces the old reveal) | B | ✅ Done: 7-9 s 2.5D lab builds the monster part by part, with real repo facts on cards. Skip button / Escape; reduced motion goes straight to the result. |
| Result card + evidence trait chips | B | ✅ Done |
| `/lab` dev page | B | ✅ Done; can replay the build sequence |
| Saved example from a real repo (`src/lib/examples.ts`) | B | ⬜ Still placeholder content. Swap before the demo. |
| Vercel deploy + env vars | A | ⬜ Not started |
| Demo script, video, screenshots ([PITCH.md](PITCH.md)) | B | ⬜ Not started |
| Team table in README | Team | ⬜ Still empty |

Legend: ✅ done · 🟨 partly done · ⬜ not started

Find each builder's open tasks in the code by searching for `TODO(A)` and `TODO(B)`.

---

## Branches on GitHub

| Branch | State |
|---|---|
| `main` | Up to date; everything above is here |
| `feature/github-auth` | Same as `main` (fully merged) |
| `feature/github-auth-input` | Fully merged into `main`, 9 commits behind. Safe to delete. |
| `art/style-tuning` | No commits of its own, 8 commits behind `main`. Safe to delete or reset. |

---

## Log (newest first)

### 31 Oct 2026
- **12:14: GitHub auth branches merged into `main`** (`47f53bc`, `0af3eaa`). Combines the two GitHub fetch versions: private-repo fetch through sign-in, plus stricter URL parsing and a 300-character input cap. Optional data that's missing (404, or 409 on an empty repo) counts as empty; rate limits still stop the summon. Phone-friendly URL input.
- **11:58: monster lab build sequence** (`3cf4953`). After every summon, a short lab scene builds the monster part by part and shows real repo facts, then morphs into the result card. Replaces `Reveal.tsx`.
- **11:41: GitHub token check, public fetch and URL parsing** (`051c6be`, by shuwe). Startup token check in `src/instrumentation.ts`, `parseRepoUrl` and `fetchRepoSnapshot`, input autocorrect off, tests.
- **11:35: beginner guide for running locally** (`9a739b0`). [RUN_LOCALLY.md](RUN_LOCALLY.md), linked from the README.
- **11:25: placeholder monster writing** (`79dda30`). Monster writing isn't designed yet, so the fallback character and the saved example show obvious placeholder text instead of made-up prose. The look and the real facts behind each trait are unchanged.
- **11:23: GitHub fetch and GitHub App sign-in for private repos** (`6718835`). Read-only fetch, sign-in with an encrypted cookie session, private results never cached, and a privacy note that private README/manifest excerpts go to Anthropic's API. 26 new tests.
- **11:15: website restyle** (`bcfcf19`). Sketchy code-and-Halloween scene, new palette and fonts. Monster art is unchanged; restyling it is the next step.
- **11:15: design doc cleanup** (`b63c758`, `2ac0bda`).
- **~10:55: data layer, Claude generation, monster art, themeable UI** (`d774953`). Dependency parsing, facts builder, palette, fallback character, Claude call with checks and retry, SVG monster, reveal, `/lab` page, 24 tests, `npm test`.
- **~10:40: progress log added** (`6b905ac`). This file, linked from the README.
- **~10:35: security patches** (`d8d283f`). Next.js 15.5.4 → 15.5.28 (fixes a critical RCE advisory), React 19.1.0 → 19.1.10, PostCSS forced to 8.5.32.
- **Review fixes + setup guide** (`f0f97a1`). Fixed review issues and wrote the README setup steps.
- **App scaffolded** (`98a37fa`). Next.js App Router, TypeScript, Tailwind, the shared Zod contract, a sample fixture and stub files for both builders.
- **Design doc** (`e153231`, `f09b74f`). Product, MVP, stack, visuals, data contract, ownership, timeline and risks in [DESIGN.md](DESIGN.md).
- **Repo created** (`88d6b0b`).

**After pulling, run `npm install`** (dependencies have changed several times today).

---

## Next up
1. **Run one real repo end to end with keys.** Put `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` in `.env.local` and summon 3 contrasting repos. Watch the server console: a `generate: attempt N ...` warning means Claude failed and the placeholder was used. The Claude call has never run for real, so this is the biggest unknown.
2. **Design the monster writing** (name, traits, origin story): the tone, then tune the prompt in `src/lib/generate.ts`. Also decide what the no-AI fallback should say for the demo instead of Lorem ipsum.
3. **B:** restyle the monster art to match the new scene, and replace the saved example with a real result.
4. **A:** `/api/summon` cache (public repos only), then deploy to Vercel with all env vars (including the GitHub App ones if private repos are in the demo).

## Open questions / blockers
- **The Claude path is untested live.** If it fails quietly, every monster will show placeholder text in the demo.
- Do we demo private repos? If so, the GitHub App has to be set up for the deployed URL too.
- The Team table in the README is still empty. Add your names and roles.
