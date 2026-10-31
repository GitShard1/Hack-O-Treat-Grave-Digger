// OWNER: Builder A. Server only. Bounded, read-only GitHub fetch: 6 API calls at most, no cloning,
// nothing from the repo is ever executed. README and manifest text are UNTRUSTED data.
import "server-only";
import { SummonError } from "@/lib/errors";
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

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const NAME = /^[A-Za-z0-9._-]{1,100}$/;

/**
 * Accepts "https://github.com/owner/name", "github.com/owner/name", "owner/name",
 * with or without ".git", a trailing slash, or extra path such as "/tree/main".
 */
export function parseRepoUrl(input: string): RepoRef {
  const trimmed = input.trim();
  const path = trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?github\.com\//i, "")
    .split(/[?#]/)[0];
  const [owner, rawName] = (path ?? "").split("/");
  const name = rawName?.replace(/\.git$/i, "");

  const looksLikeOtherHost = /^https?:\/\//i.test(trimmed) && !/^https?:\/\/(www\.)?github\.com\//i.test(trimmed);
  if (looksLikeOtherHost || !owner || !name || !OWNER.test(owner) || !NAME.test(name) || name === "." || name === "..") {
    throw new SummonError("INVALID_URL", "That doesn't look like a GitHub repo. Try https://github.com/owner/repo.");
  }
  return { owner, name };
}

export type FetchOptions = {
  /** Signed-in user's token (for private repos). Falls back to GITHUB_TOKEN, then no token. */
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

type RepoResponse = {
  name: string;
  owner: { login: string };
  private: boolean;
  description: string | null;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
};
type ContentEntry = { name: string; type: string };
type CommitEntry = { commit: { committer: { date: string } | null } };

export async function fetchRepoSnapshot(ref: RepoRef, options: FetchOptions = {}): Promise<RepoSnapshot> {
  const signedIn = Boolean(options.userToken);
  const gh = githubClient(options.userToken ?? process.env.GITHUB_TOKEN);
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
    if (!languagesRes.ok) throw failure(languagesRes, slug, signedIn);
    const languages = await json<Record<string, number>>(languagesRes);

    // An empty repo has no contents and no commits (404/409); treat both as empty.
    const rootFiles = rootRes.ok ? (await json<ContentEntry[]>(rootRes)).map((entry) => entry.name) : [];
    if (!rootRes.ok && rootRes.status !== 404 && rootRes.status !== 409) throw failure(rootRes, slug, signedIn);
    const commits = commitsRes.ok ? await json<CommitEntry[]>(commitsRes) : [];
    if (!commitsRes.ok && commitsRes.status !== 409) throw failure(commitsRes, slug, signedIn);

    // 6. The first manifest we know how to read, if any.
    const manifestFile = MANIFEST_FILES.find((file) => rootFiles.includes(file));
    const manifestContent = manifestFile
      ? await optionalText(gh, `${base}/contents/${manifestFile}`, slug, signedIn, MANIFEST_MAX_CHARS)
      : null;

    return {
      ref: { owner: repo.owner.login, name: repo.name }, // canonical, after any redirect
      private: repo.private,
      description: repo.description,
      stars: repo.stargazers_count,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      latestCommitAt: commits[0]?.commit.committer?.date ?? null,
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
