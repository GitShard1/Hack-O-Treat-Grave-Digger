import type { RepoSnapshot } from "@/lib/github";
import requests from "@/fixtures/snapshots/psf-requests.json";
import ms from "@/fixtures/snapshots/vercel-ms.json";

/** Fixed "today" so date-based facts are stable. */
export const NOW = new Date("2026-10-31T12:00:00Z");

/** Real public data captured from the GitHub API on 2026-10-31. */
export const requestsSnapshot: RepoSnapshot = requests;
export const msSnapshot: RepoSnapshot = ms;

/** A repo with nothing optional: no README, no manifest, no languages. */
export const bareSnapshot: RepoSnapshot = {
  ref: { owner: "someone", name: "empty-crypt" },
  description: null,
  stars: 0,
  createdAt: "2026-10-01T00:00:00Z",
  pushedAt: "2026-10-01T00:00:00Z",
  latestCommitAt: null,
  languages: {},
  readme: null,
  rootFiles: [".gitignore"],
  manifest: null,
};
