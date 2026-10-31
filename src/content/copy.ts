// OWNER: Builder B. All user-facing wording in one place, so tone can change with the art direction.
// Server error messages live in the API route; character text comes from generation.

export const COPY = {
  appName: "Grave Digger",
  tagline: "Every codebase has a monster inside it. Meet yours.",
  blurb: "Paste any public GitHub repo. We read its real facts and dig up the monster living inside.",
  inputLabel: "Public GitHub repository URL",
  inputPlaceholder: "https://github.com/owner/repo",
  submit: "Dig",
  examplesLabel: "Try one:",
  savedExample: "See a saved example",
  loading: [
    "> exhuming repository...",
    "> reading the headstone...",
    "> counting the bones...",
    "> waking whatever is down there...",
  ],
  retry: "Try again",
  badResponse: "The graveyard sent back something strange. Try again.",
  offline: "Couldn't reach the graveyard. Check your connection and try again.",
  summonedFrom: "Summoned from",
  evidenceHint: "Tap a trait to see the repo fact behind it.",
  evidenceLabel: "Evidence",
  storyHeading: "Origin story",
  storyNote: "Fiction, inspired by real repo facts.",
  artNote: "Art procedurally assembled from your repo's traits.",
  auth: {
    signIn: "Sign in with GitHub for private repos",
    chooseRepos: "Choose repos",
    signOut: "Sign out",
    privacyNote:
      "Signed in: private repos work too. Their README and dependency file excerpts are sent to Anthropic's API to write your monster, and results are never cached or shared.",
    messages: {
      ok: "Signed in with GitHub.",
      error: "GitHub sign-in didn't finish. Try again.",
      unavailable: "GitHub sign-in isn't set up on this server yet.",
    },
  },
  /** The monster lab build sequence that plays after a summon. Moments only quote real repo facts: {v} is the fact value. */
  lab: {
    ariaLabel: "The monster lab is building your monster from the repo's facts.",
    skip: "Skip",
    skipHint: "Skip to the finished monster",
    momentTag: "key moment",
    boot: "> powering up the lab...",
    alive: "> it's alive!",
    aliveShout: "It's alive!",
    monitor: { command: "> grave-digger --build", repo: "> repo:", stage: "> stage" },
    stages: {
      frame: { status: "> forming the frame...", moments: { f_age: "Born {v}", f_stars: "Watched by {v} stargazers" } },
      ectoplasm: { status: "> pumping in the ectoplasm...", moments: { f_lang_top: "Stitched from {v}", f_lang_mix: "Stitched from {v}" } },
      eyes: {
        status: "> switching on the eyes...",
        moments: { f_readme_title: "First words: {v}", f_readme_theme: "First words: {v}", f_description: "First words: {v}" },
      },
      accessories: {
        status: "> bolting on the extras...",
        moments: { f_deps_named: "Bolted on: {v}", f_deps: "Spare parts: {v}", f_deps_count: "Spare parts: {v}" },
      },
      aura: { status: "> igniting the aura...", moments: { f_last_push: "Last stirred {v}", f_last_commit: "Latest commit {v}" } },
    },
  },
  sourceBadge: {
    live: null,
    fallback: "Placeholder monster: writing not built yet",
    "saved-example": "Saved example (placeholder text)",
  },
} as const;
