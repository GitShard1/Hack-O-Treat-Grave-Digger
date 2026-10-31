import type { RepoSnapshot } from "@/lib/github";
import requests from "@/fixtures/snapshots/psf-requests.json";
import ms from "@/fixtures/snapshots/vercel-ms.json";
import spincube from "@/fixtures/snapshots/spincube.json";
import mayhem from "@/fixtures/snapshots/mayhem-game.json";

/** Fixed "today" so date-based facts are stable. */
export const NOW = new Date("2026-10-31T12:00:00Z");

/** Real public data captured from the GitHub API on 2026-10-31. */
export const requestsSnapshot: RepoSnapshot = requests;
export const msSnapshot: RepoSnapshot = ms;
export const spincubeSnapshot: RepoSnapshot = spincube;
export const mayhemSnapshot: RepoSnapshot = mayhem;

/** A repo with nothing optional: no README, no manifest, no languages. */
export const bareSnapshot: RepoSnapshot = {
  ref: { owner: "someone", name: "empty-crypt" },
  private: false,
  description: null,
  stars: 0,
  createdAt: "2026-10-01T00:00:00Z",
  pushedAt: "2026-10-01T00:00:00Z",
  latestCommitAt: null,
  latestCommitSha: null,
  languages: {},
  readme: null,
  rootFiles: [".gitignore"],
  manifest: null,
  tree: [{ path: ".gitignore", size: 12 }],
  treeTruncated: false,
  sourceFile: null,
};
