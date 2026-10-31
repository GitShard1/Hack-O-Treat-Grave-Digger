// OWNER: Builder A. Server only. Bounded, read-only GitHub fetch: 6 API calls at most, no cloning,
// nothing from the repo is ever executed. README and manifest text are UNTRUSTED data.
import "server-only";
import { SummonError } from "@/lib/errors";
import { getGitHubToken } from "@/lib/github-auth";
import { MANIFEST_FILES } from "@/lib/manifest";

export type RepoRef = { owner: string; name: string };

/** "owner/name": the one place this string is built. */
export function repoSlug(ref: RepoRef): string {
  return `${ref.owner}/${ref.name}`;
}

/** Bounded snapshot of a repo. */
export type RepoSnapshot = {
  ref: RepoRef;
  private: boolean;
  description: string | null;
  stars: number;
  createdAt: string;
  pushedAt: string;
  latestCommitAt: string | null; // date of the latest commit on the default branch
  languages: Record<string, number>; // bytes per language
  readme: string | null; // truncated to README_MAX_CHARS, UNTRUSTED text
  rootFiles: string[];
  manifest: { file: string; content: string } | null; // UNTRUSTED text
};

const API = "https://api.github.com";
const README_MAX_CHARS = 4_000;
const MANIFEST_MAX_CHARS = 4_000;
const REQUEST_TIMEOUT_MS = 8_000;

// GitHub owner (user or org): 1-39 chars, letters, digits and hyphens, no leading hyphen.
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
// GitHub repo name: letters, digits, ".", "-", "_", max 100 chars. "." and ".." are not valid names.
const NAME = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_INPUT_LENGTH = 300;

/**
 * Accepts "https://github.com/owner/name", "github.com/owner/name", "www.github.com/owner/name"
 * or a bare "owner/name", with or without ".git", a trailing slash or a query. Extra path such as
 * "/tree/main" is allowed only after a github.com host. Pure string work: no network call.
 */
export function parseRepoUrl(input: string): RepoRef {
  const invalid = () => new SummonError("INVALID_URL", "That doesn't look like a GitHub repo. Try https://github.com/owner/repo.");

  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) throw invalid();

  // Strip an optional scheme, then the host must be github.com. A bare "owner/name" has no host.
  const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
  const hostMatch = withoutScheme.match(/^(?:www\.)?github\.com\/(.*)$/i);
  const hasHost = hostMatch !== null;
  const pathPart = (hostMatch?.[1] ?? withoutScheme).split(/[?#]/)[0] ?? "";
  const segments = pathPart.split("/").filter((s) => s.length > 0);
  if (segments.length < 2 || (!hasHost && segments.length !== 2)) throw invalid();

  const owner = segments[0] ?? "";
  const name = (segments[1] ?? "").replace(/\.git$/i, "");
  if (!OWNER.test(owner) || !NAME.test(name) || name === "." || name === "..") throw invalid();
  return { owner, name };
}

export type FetchOptions = {
  /** Signed-in user's token (for private repos). Falls back to GITHUB_TOKEN (read in github-auth.ts), then no token. */
  userToken?: string;
};

type Gh = (path: string, accept?: string) => Promise<Response>;

function githubClient(token: string | undefined): Gh {
  return (path, accept = "application/vnd.github+json") =>
    fetch(`${API}${path}`, {
      headers: {
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "grave-digger-hackathon",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "follow", // renamed or transferred repos answer with a redirect
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
}

function isRateLimited(res: Response): boolean {
  return res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0");
}

/** Turns a failed response into a SummonError. Never includes tokens or headers. */
function failure(res: Response, slug: string, signedIn: boolean): SummonError {
  if (isRateLimited(res)) {
    return new SummonError("RATE_LIMITED", "GitHub is rate limiting us right now. Wait a minute and try again.");
  }
  if (res.status === 404 || res.status === 403) {
    return new SummonError(
      "REPO_NOT_FOUND",
      signedIn
        ? `Couldn't find ${slug}. If it's private, make sure Grave Digger is allowed to read it.`
        : `Couldn't find ${slug}. If it's private, sign in with GitHub first.`,
    );
  }
  return new SummonError("GITHUB_ERROR", `GitHub returned an error (${res.status}). Try again.`);
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

/** Text body, or null when the file is missing. Other errors still throw. */
async function optionalText(gh: Gh, path: string, slug: string, signedIn: boolean, maxChars: number) {
  const res = await gh(path, "application/vnd.github.raw+json");
  if (res.status === 404) return null;
  if (!res.ok) throw failure(res, slug, signedIn);
  return (await res.text()).slice(0, maxChars);
}

/** Only created_at and pushed_at are relied on; everything else may be missing. */
type RepoResponse = {
  name?: string;
  owner?: { login?: string };
  private?: boolean;
  description?: string | null;
  stargazers_count?: number;
  created_at: string;
  pushed_at: string;
};
type ContentEntry = { name: string; type: string };
type CommitEntry = { commit?: { committer?: { date?: string } | null } };

/** Optional data that just isn't there: 404, or 409 for an empty repo. */
const isMissing = (res: Response) => res.status === 404 || res.status === 409;

function numbersOnly(value: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, bytes] of Object.entries(value)) {
    if (typeof bytes === "number" && Number.isFinite(bytes)) out[key] = bytes;
  }
  return out;
}

export async function fetchRepoSnapshot(ref: RepoRef, options: FetchOptions = {}): Promise<RepoSnapshot> {
  const signedIn = Boolean(options.userToken);
  const gh = githubClient(options.userToken ?? getGitHubToken() ?? undefined);
  const slug = repoSlug(ref);
  const base = `/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.name)}`;

  try {
    // 1. Metadata (also confirms the repo exists and we may read it).
    const repoRes = await gh(base);
    if (!repoRes.ok) throw failure(repoRes, slug, signedIn);
    const repo = await json<RepoResponse>(repoRes);

    // 2-5. Everything else in parallel.
    const [languagesRes, readme, rootRes, commitsRes] = await Promise.all([
      gh(`${base}/languages`),
      optionalText(gh, `${base}/readme`, slug, signedIn, README_MAX_CHARS),
      gh(`${base}/contents/`),
      gh(`${base}/commits?per_page=1`),
    ]);
    // Only the metadata call is required. Missing optional data counts as empty;
    // any other failure, such as a rate limit, still stops the summon.
    for (const res of [languagesRes, rootRes, commitsRes]) {
      if (!res.ok && !isMissing(res)) throw failure(res, slug, signedIn);
    }
    const languages = languagesRes.ok ? numbersOnly(await json<Record<string, unknown>>(languagesRes)) : {};
    const rootFiles = rootRes.ok ? (await json<ContentEntry[]>(rootRes)).map((entry) => entry.name) : [];
    const commits = commitsRes.ok ? await json<CommitEntry[]>(commitsRes) : [];

    // 6. The first manifest we know how to read, if any.
    const manifestFile = MANIFEST_FILES.find((file) => rootFiles.includes(file));
    const manifestContent = manifestFile
      ? await optionalText(gh, `${base}/contents/${manifestFile}`, slug, signedIn, MANIFEST_MAX_CHARS)
      : null;

    return {
      // Canonical names after any redirect, when GitHub sends them.
      ref: { owner: repo.owner?.login ?? ref.owner, name: repo.name ?? ref.name },
      private: repo.private ?? false,
      description: repo.description ?? null,
      stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      latestCommitAt: commits[0]?.commit?.committer?.date ?? null,
      languages,
      readme,
      rootFiles,
      manifest: manifestFile && manifestContent !== null ? { file: manifestFile, content: manifestContent } : null,
    };
  } catch (error) {
    if (error instanceof SummonError) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new SummonError("GITHUB_ERROR", "GitHub took too long to answer. Try again.");
    }
    throw new SummonError("GITHUB_ERROR", "Couldn't reach GitHub. Try again.");
  }
}
