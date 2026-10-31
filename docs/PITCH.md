# Pitch / Demo Script

Total: about 3 minutes. Times are a guide; the live dig takes about 11-12 s while Claude writes, so talk
through it. Lines in quotes are things to say; **bold** is what to point at on screen.

## Before you present
- [ ] `npm run dev` is running and http://localhost:3000 loads.
- [ ] `ANTHROPIC_API_KEY` is in `.env.local` (otherwise you get the placeholder monster).
- [ ] Ideally `GITHUB_TOKEN` too (friend's laptop). Without it: 60 GitHub calls/hour, about 8 digs.
- [ ] Dig spincube once beforehand. A second dig within 10 minutes is instant and uses no GitHub calls (cache).
- [ ] Browser zoom so the result card and the dissect report fit on screen.
- [ ] Backup ready: "See a saved example" works with no network, no GitHub, no Claude.

## Hook (15s)
"Many GitHub users, like you, have dead repositories just... collecting dust. You may ask: What can we do about these rotting repos? Well, Grave Digger revives your GitHub repositories from the dead."

"Just paste in any GitHub repository, and here the monster awaits... from the dead. Lets dig up a grave!"

## Problem (30s)
"Opening an unfamiliar repo is intimidating: thousands of files, no idea where to start. READMEs tell
you what a project wants to be, not what's strange about how it's built. We wanted something you
understand in ten seconds, that's fun to share, and that still points you at real code."

Theme tie-in: the Halloween character is the repo itself - every repo gets its own monster.

## Demo (1-2 min)
1. **Home page.** "Paste any public repo." Paste `https://github.com/EricZ6365/spincube` and click **Dig**.
2. **While it loads (fill the ~11 s):** "Right now we make at most 7 read-only GitHub calls: metadata,
   languages, README, the full file list in one call, the latest commit, a dependency file, and one
   source file we pick. Nothing from the repo is ever run."
3. **The monster lab plays.** It starts in **Step** mode: press **Next ->** (or the right arrow) to build
   one part at a time while you explain each key moment; switch to **Auto** to let it play on its own.
   "The lab builds it part by part. Every key-moment card quotes a real fact
   - here, the main language and the file we read." Point at the **key moment** cards.
4. **Result card.** Point at the **signature trait**: "It found that `cube.py` is one single Python
   expression - the whole program, no separate statements. That's why the monster is threaded with one
   unbroken filament, inside a wireframe cube because the repo renders a cube."
5. **Click the monster (Dissect).** Read off the report:
   - "**detector**: a Python statement scanner ran on the file we read."
   - "**source**: `cube.py` at commit `fd84453` - pinned, so you see exactly what we inspected."
   - "**imports**: it uses `ctypes`, so it calls native C libraries directly."
   - "**signature rules, first match wins**: here's the whole decision - the one that won, and the rest."
   - "**excerpt**: the real first lines of the code." Click **open cube.py on GitHub** if time allows.
6. **Story.** "Claude writes the story in one of six voices - this one's a field guide - and it has to
   cite real facts. The monster changes when the repo changes: same repo, same commit day, same monster."
7. **Watch it evolve.** Under the story, click **Replay its history**, then **next ->** (or **play**).
   "Same rules, any commit: we replay the file-list fingerprint at the first commit, one and two thirds
   through, and today." Best on MAYHEM: its weapon roster changes across 27 commits (Medkit, Rock, Pan
   and Flamethrower early on; Boots and two shotguns now). Costs up to 8 GitHub calls, only when clicked.
8. **Contrast (if time):** click **See a saved example** to show MAYHEM (limbs labelled with real weapon
   files) or Cataclysm (a swarm of `.json` tablets: 64% of its 10,471 files are JSON).

Backup if anything fails live: skip steps 1-3 and use **See a saved example** (cycles spincube ->
MAYHEM -> Cataclysm). Everything else, including Dissect, works the same.

## Tech (30s)
"Three things we're proud of":
1. **Evidence first.** Facts are extracted by plain code, no AI. Claude has to cite a fact id for every
   trait, the first trait must be the signature, and the server rejects anything else and retries.
2. **Signature detection.** Fixed rules over the full file list and one source file pick the strangest
   real thing about a repo. The same choice drives the art, the first trait, the story and the dissect
   report, so they always agree.
3. **Safe and bounded.** At most 7 GitHub calls, nothing executed, repo text fenced off as untrusted
   data in the prompt, private repos never cached.

## What's next (15s)
"Dissect more parts, not just the signature; an embeddable monster card for READMEs; and following a
repo's history so you can watch its monster grow."

---

## What to explain if asked (cheat sheet)

### Data pipeline (POST /api/summon)
1. `parseRepoUrl` - accepts URLs, `owner/name`, `.git`, `/tree/...`; validates GitHub's name rules.
2. Cache check - a repo dug in the last 10 minutes returns instantly with zero GitHub calls.
3. `fetchRepoSnapshot` (`src/lib/github.ts`) - up to 7 read-only calls; README/manifest/source are
   truncated and treated as untrusted text.
4. `pickSourceFile` (`src/lib/tree.ts`) - scores files: named in the README, entry-point names, named
   after the repo, shallow paths, busiest folder. Skips vendored, test, generated and build-config files.
5. `buildFacts` (`src/lib/facts.ts`) - deterministic facts with ids; the prefix says where each came from:
   `f_code_*` = the file we read, `f_tree_*` = the file list, others = GitHub metadata, README, manifest.
6. `pickSignatureFactId` - first matching rule wins: one-expression program -> data-heavy file mix ->
   busiest source folder -> tiny program -> one dominant folder -> description -> README -> language -> stars.
7. `generateCharacter` (`src/lib/generate.ts`) - one Claude call with structured output (Zod schema).
   Checks: schema, every trait cites a real distinct fact, trait 1 = signature, story 40-110 words, no
   stock openings/endings. One retry, then a deterministic fallback character.
8. Cache by repo + latest-commit day + generation version; only public live results.

### Detectors worth naming
- **Python one-expression check** - a character-level scanner (not a full parser) that skips strings and
  comments and counts top-level statements; 1 means the whole file is one expression.
- **File-type mix** - shares of extensions across the whole file list; 50%+ data files = data-heavy.
- **Busiest source folder** - the folder with the most source files; its file names become the limbs.
- **Imports** - read as text per language (Python, JS/TS, Lua/Luau, C/C++), never executed.

### Art
- Pure SVG, 240x280 canvas: 6 bodies, 5 eye styles, 6 accessories, 4 auras, palette from GitHub's
  language colours.
- Five signature parts drawn in front of and behind the body: wireframe cage (real 3D rotation and
  projection, done by hand), knotted filament (closed parametric curve with a flowing dash), data swarm
  (two orbiting rings with depth ordering), tool limbs (two-joint limbs with sway), word halo.
- Monster lab: a 2.5D set with a virtual camera that pans, zooms and tilts to each part; hand-off morphs
  the lab panel into the result card.
- Respects reduced motion; all colours and fonts are theme tokens.

### Stack and tools
| Layer | What we use |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling / motion | Tailwind CSS v4, framer-motion, hand-written SVG |
| Validation | Zod 4 - one schema shared by server and browser |
| AI | Anthropic Claude Haiku 5.5 via `@anthropic-ai/sdk`, structured outputs, low effort |
| Data | GitHub REST API (plain `fetch`), no database, in-memory cache |
| Auth (optional) | GitHub App sign-in for private repos; token in an AES-256-GCM encrypted httpOnly cookie |
| Testing | Vitest, 116 tests on real captured GitHub snapshots |
| Built with | Claude Code as a pair programmer; runs locally with Node and a browser |

### Numbers you can quote
- At most **7** GitHub API calls per dig; **0** on a repeat dig within 10 minutes.
- **116** automated tests; about 8,500 lines of TypeScript including tests.
- Cataclysm: **10,471** files, **64%** JSON; spincube: **2** files, `cube.py` is **7,594** characters in one expression.
- About **11-12 s** for a live dig (mostly Claude); the lab itself runs about 15-18 s (Step mode lets you go at your own pace).

### Likely questions
- **"Is the story made up?"** The story is labelled fiction; the traits and the dissect report are not.
  Every trait cites a real fact and the dissect report only shows fetched values and real code.
- **"What about prompt injection from READMEs?"** Repo text is fenced and labelled untrusted, closing tags
  are stripped, the model gets no tools, and output must match a strict schema. It makes injection much
  harder; it doesn't make it impossible.
- **"Does it read the whole repo?"** No - the full file list plus one chosen source file, by design: it's
  fast, cheap and within GitHub's rate limits.
- **"Why not just ask an LLM about the repo?"** The interesting part is decided by code, not the model,
  so it's explainable (see the rules list in Dissect) and stays the same for the same commit.
- **"Private repos?"** Supported through GitHub App sign-in (read-only, repos the user picks); results
  are never cached. Not set up on the demo machine.

## Submission checklist
- [ ] Repo public & README filled in
- [ ] Demo video uploaded
- [ ] Screenshots in `assets/`
- [ ] Submission form sent
