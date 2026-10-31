// OWNER: Builder A. Server only. GitHub token setup is handled by Builder A.
import "server-only";
import { SummonError } from "@/lib/errors";

export type RepoRef = { owner: string; name: string };

/** "owner/name": the one place this string is built. */
export function repoSlug(ref: RepoRef): string {
  return `${ref.owner}/${ref.name}`;
}

/**
 * Bounded snapshot of a repo (~6 API calls max, no cloning).
 * TODO(A): decide exact fields as you implement fetchRepoSnapshot.
 */
export type RepoSnapshot = {
  ref: RepoRef;
  description: string | null;
  stars: number;
  createdAt: string;
  pushedAt: string;
  latestCommitAt: string | null; // date of the latest commit on the default branch
  languages: Record<string, number>; // bytes per language
  readme: string | null; // truncated to ~4k chars, UNTRUSTED text
  rootFiles: string[];
  manifest: { file: string; content: string } | null; // UNTRUSTED text
};

/** Accepts "https://github.com/owner/name", "github.com/owner/name", or "owner/name". */
export function parseRepoUrl(input: string): RepoRef {
  // TODO(A): implement and validate; throw INVALID_URL on anything else.
  throw new SummonError("NOT_IMPLEMENTED", `parseRepoUrl not implemented yet (got "${input.slice(0, 100)}")`);
}

/**
 * TODO(A): fetch metadata, languages, README, root listing, one manifest, latest commit.
 * - Read the token from process.env.GITHUB_TOKEN (optional); never log or return it.
 * - Map 404 -> REPO_NOT_FOUND, 403/429 with rate-limit headers -> RATE_LIMITED, else GITHUB_ERROR.
 * - Never execute anything from the repo.
 */
export async function fetchRepoSnapshot(ref: RepoRef): Promise<RepoSnapshot> {
  throw new SummonError("NOT_IMPLEMENTED", `fetchRepoSnapshot not implemented yet (${repoSlug(ref)})`);
}
