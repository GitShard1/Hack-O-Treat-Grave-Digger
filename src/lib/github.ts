// OWNER: Builder A. Server only. GitHub token setup is handled by Builder A.
import "server-only";
import { SummonError } from "@/lib/errors";
import { getGitHubToken } from "@/lib/github-auth";
import { MANIFEST_FILES } from "@/lib/manifest";

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

// GitHub owner (user or org): 1-39 chars, letters, digits and hyphens. No leading hyphen.
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
// GitHub repo name: letters, digits, ".", "-", "_". Max 100 chars. "." and ".." are not valid names.
const NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_INPUT_LENGTH = 300;
const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

/**
 * Accepts "https://github.com/owner/name", "github.com/owner/name", "www.github.com/owner/name",
 * or a bare "owner/name". Extra path parts after the name (e.g. "/tree/main") and a trailing ".git" are allowed.
 * Throws INVALID_URL on anything else. Pure string work: no network call.
 */
export function parseRepoUrl(input: string): RepoRef {
  const invalid = () =>
    new SummonError("INVALID_URL", "Paste a public GitHub repo link, like https://github.com/owner/repo.");

  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) throw invalid();

  // Strip an optional scheme, then require the host to be github.com. A bare "owner/name" has no host.
  const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
  const hostMatch = withoutScheme.match(/^(?:www\.)?github\.com\/(.*)$/i);
  const hasHost = hostMatch !== null;
  const pathPart = (hostMatch?.[1] ?? withoutScheme).split(/[?#]/)[0] ?? "";
  const segments = pathPart.split("/").filter((s) => s.length > 0);

  // Need at least owner/name. Bare "owner/name" (no host) must be exactly two segments.
  if (segments.length < 2 || (!hasHost && segments.length !== 2)) throw invalid();

  const owner = segments[0] ?? "";
  const name = (segments[1] ?? "").replace(/\.git$/i, "");
  if (!OWNER_PATTERN.test(owner) || !NAME_PATTERN.test(name) || name === "." || name === "..") throw invalid();

  return { owner, name };
}

/**
 * TODO(A): fetch metadata, languages, README, root listing, one manifest, latest commit.
 * - Public repos only, anonymous GitHub API calls. No tokens or App auth.
 * - Errors come back as SummonError already (REPO_NOT_FOUND, RATE_LIMITED, GITHUB_ERROR). Let them pass through.
 * - Never execute anything from the repo.
 */
export async function fetchRepoSnapshot(ref: RepoRef): Promise<RepoSnapshot> {
  // Repo metadata is required: a 404 here means REPO_NOT_FOUND and the summon stops.
  const meta = await githubJson<RepoMeta>(`/repos/${ref.owner}/${ref.name}`);

  // Everything else is optional. A missing README or manifest, or an empty repo, becomes null.
  const [languages, readmeFile, rootEntries, commits] = await Promise.all([
    optionalJson<Record<string, unknown>>(`/repos/${ref.owner}/${ref.name}/languages`),
    optionalJson<ContentFile>(`/repos/${ref.owner}/${ref.name}/readme`),
    optionalJson<ContentEntry[]>(`/repos/${ref.owner}/${ref.name}/contents`),
    optionalJson<CommitEntry[]>(`/repos/${ref.owner}/${ref.name}/commits?per_page=1`),
  ]);

  const rootFiles = (rootEntries ?? []).map((entry) => entry.name).slice(0, MAX_ROOT_FILES);
  const manifestName = MANIFEST_FILES.find((file) => rootFiles.includes(file)) ?? null;
  const manifestFile = manifestName ? await optionalJson<ContentFile>(`/repos/${ref.owner}/${ref.name}/contents/${manifestName}`) : null;

  const readme = readmeFile ? decodeContent(readmeFile)?.slice(0, README_MAX_CHARS) ?? null : null;
  const manifestContent = manifestFile ? decodeContent(manifestFile)?.slice(0, MANIFEST_MAX_CHARS) ?? null : null;

  return {
    ref,
    description: meta.description ?? null,
    stars: typeof meta.stargazers_count === "number" ? meta.stargazers_count : 0,
    createdAt: meta.created_at,
    pushedAt: meta.pushed_at,
    latestCommitAt: commits?.[0]?.commit?.committer?.date ?? null,
    languages: toNumberRecord(languages),
    readme,
    rootFiles,
    manifest: manifestName && manifestContent !== null ? { file: manifestName, content: manifestContent } : null,
  };
}

const README_MAX_CHARS = 4_000;
const MANIFEST_MAX_CHARS = 20_000;
const MAX_ROOT_FILES = 200;

type RepoMeta = { description?: string | null; stargazers_count?: number; created_at: string; pushed_at: string };
type ContentEntry = { name: string; type: string };
type ContentFile = { content?: string; encoding?: string };
type CommitEntry = { commit?: { committer?: { date?: string | null } | null } | null };

/** Authenticated (App installation or public) GitHub call that parses JSON. Throws SummonError. */
async function githubJson<T>(path: string): Promise<T> {
  const res = await githubRequest(path);
  return (await res.json()) as T;
}

/** Anonymous GitHub REST call (public data only). Throws SummonError on failure. */
async function githubRequest(path: string): Promise<Response> {
  const url = path.startsWith("http") ? path : `${GITHUB_API}${path}`;
  let res: Response;
  const token = getGitHubToken();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "grave-digger",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch {
    throw new SummonError("GITHUB_ERROR", "Could not reach GitHub.");
  }
  if (res.ok) return res;

  // 404 is expected for optional data (no README, empty repo) and is handled by the caller, so don't log it.
  if (res.status === 404) {
    throw new SummonError("REPO_NOT_FOUND", "Repository not found. Check the link, and make sure the repo is public.");
  }
  // Log the status only. Never log headers or bodies.
  console.error("github request failed:", res.status);
  const rateLimited = res.headers.get("x-ratelimit-remaining") === "0" || res.status === 429 || res.status === 403;
  if (rateLimited) throw new SummonError("RATE_LIMITED", "GitHub rate limit reached. Try again later.");
  throw new SummonError("GITHUB_ERROR", `GitHub responded with ${res.status}.`);
}

/**
 * Like githubJson, but returns null when the data is optional. Only RATE_LIMITED is rethrown:
 * a missing or empty resource (404, or 409 on an empty repo) should not stop the summon.
 */
async function optionalJson<T>(path: string): Promise<T | null> {
  try {
    return await githubJson<T>(path);
  } catch (err) {
    if (err instanceof SummonError && err.code !== "RATE_LIMITED") return null;
    throw err;
  }
}

/** GitHub returns file contents as base64. Returns null if the payload isn't base64 text. */
function decodeContent(file: ContentFile): string | null {
  if (typeof file.content !== "string" || file.encoding !== "base64") return null;
  return Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8");
}

function toNumberRecord(value: Record<string, unknown> | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, bytes] of Object.entries(value ?? {})) {
    if (typeof bytes === "number" && Number.isFinite(bytes)) out[key] = bytes;
  }
  return out;
}
