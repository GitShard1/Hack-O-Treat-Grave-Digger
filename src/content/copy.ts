// OWNER: Builder B. All user-facing wording in one place, so tone can change with the art direction.
// Server error messages live in the API route; character text comes from generation.

export const COPY = {
  appName: "Grave Digger",
  tagline: "Every codebase has a monster inside it. Meet yours.",
  inputLabel: "Public GitHub repository URL",
  inputPlaceholder: "https://github.com/owner/repo",
  submit: "Dig",
  examplesLabel: "Try one:",
  savedExample: "See a saved example",
  loading: [
    "Digging up the repository...",
    "Reading the headstone...",
    "Counting the bones...",
    "Waking whatever is down there...",
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
  sourceBadge: {
    live: null,
    fallback: "Quick summon (AI unavailable)",
    "saved-example": "Saved example",
  },
} as const;
