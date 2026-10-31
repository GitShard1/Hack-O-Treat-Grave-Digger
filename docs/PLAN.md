# Plan

> Full detail: [DESIGN.md](DESIGN.md)

**Stack:** Next.js (App Router) + TypeScript + Tailwind, one API route, Anthropic Claude (structured output), GitHub REST with a token, deployed on Vercel.

## MVP (must have for demo)
- [ ] URL input + 3 one-click example repos
- [ ] Bounded GitHub fetch (≤ ~6 calls) → facts builder (fact IDs)
- [ ] Claude call → validated `Character` JSON (zod), retry once, deterministic fallback
- [ ] Procedural SVG monster (ghost, zombie, golem)
- [ ] Reveal + result card: name, visual, 3 evidence-backed traits, origin story (80–120 words)
- [ ] Loading / error / retry states
- [ ] Deployed on Vercel

## Nice to have
- [ ] Downloadable PNG card
- [ ] Labelled saved-example gallery
- [ ] "Talk to it" one-liner

## Timeline
| Time | Milestone |
|------|-----------|
| 0:15 | Stack, keys, contract + fixture agreed; app scaffolded |
| 1:00 | One real repo works end to end |
| 2:00 | Evidence chips, 3 archetypes, story, fallback |
| 3:00 | Deployed, polished reveal, error handling |
| 4:00 | Freeze, test, rehearse, backup video, submit |

**If slipping:** 2 archetypes → no accessories → simple fade instead of reveal → skip extras. Never add architecture.

## Who's on what
| Person | Working on |
|--------|-----------|
| Builder A | Data & generation: `lib/github.ts`, `lib/facts.ts`, `lib/generate.ts`, `api/summon`, deploy |
| Builder B | Experience & visuals: `page.tsx`, `components/Monster/*`, reveal/result UI, demo |
