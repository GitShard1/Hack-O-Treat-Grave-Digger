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
  sourceBadge: {
    live: null,
    fallback: "Quick summon (AI unavailable)",
    "saved-example": "Saved example",
  },
} as const;
