// OWNER: Builder A. Server only. Bounded, read-only GitHub fetch: 7 API calls at most, no cloning,
// nothing from the repo is ever executed. README, manifest and source text are UNTRUSTED data.
import "server-only";
import { SummonError } from "@/lib/errors";
import { getGitHubToken } from "@/lib/github-auth";
import { MANIFEST_FILES } from "@/lib/manifest";
import { pickSourceFile, type TreeEntry } from "@/lib/tree";

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
  latestCommitSha: string | null;
  languages: Record<string, number>; // bytes per language
  readme: string | null; // truncated to README_MAX_CHARS, UNTRUSTED text
  rootFiles: string[];
  manifest: { file: string; content: string } | null; // UNTRUSTED text
  /** Every file on the default branch (folders left out), capped at TREE_MAX_FILES. */
  tree: TreeEntry[];
  /** True when GitHub or our cap cut the file list short, so counts cover only the returned list. */
  treeTruncated: boolean;
  /** The one source file picked by pickSourceFile(), truncated to SOURCE_MAX_CHARS. UNTRUSTED text. */
  sourceFile: { path: string; content: string; truncated: boolean } | null;
};

const API = "https://api.github.com";
const README_MAX_CHARS = 4_000;
const MANIFEST_MAX_CHARS = 4_000;
const SOURCE_MAX_CHARS = 20_000;
const TREE_MAX_FILES = 30_000;
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
  default_branch?: string;
  created_at: string;
  pushed_at: string;
};
type TreeResponse = { truncated?: boolean; tree?: { path?: string; type?: string; size?: number }[] };
type CommitEntry = { sha?: string; commit?: { committer?: { date?: string } | null } };

/** "a/b c.py" -> "a/b%20c.py": encodes each path segment but keeps the slashes. */
const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

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

    // 2-5. Everything else in parallel. The recursive tree is one call for the whole file list.
    const branch = repo.default_branch ?? "HEAD";
    const [languagesRes, readme, treeRes, commitsRes] = await Promise.all([
      gh(`${base}/languages`),
      optionalText(gh, `${base}/readme`, slug, signedIn, README_MAX_CHARS),
      gh(`${base}/git/trees/${encodePath(branch)}?recursive=1`),
      gh(`${base}/commits?per_page=1`),
    ]);
    // Only the metadata call is required. Missing optional data counts as empty;
    // any other failure, such as a rate limit, still stops the summon.
    for (const res of [languagesRes, treeRes, commitsRes]) {
      if (!res.ok && !isMissing(res)) throw failure(res, slug, signedIn);
    }
    const languages = languagesRes.ok ? numbersOnly(await json<Record<string, unknown>>(languagesRes)) : {};
    const treeBody = treeRes.ok ? await json<TreeResponse>(treeRes) : {};
    const entries = treeBody.tree ?? [];
    const rootFiles = entries.flatMap((e) => (e.path && !e.path.includes("/") ? [e.path] : []));
    const files: TreeEntry[] = entries.flatMap((e) =>
      e.type === "blob" && e.path ? [{ path: e.path, size: typeof e.size === "number" ? e.size : 0 }] : [],
    );
    const tree = files.slice(0, TREE_MAX_FILES);
    const treeTruncated = Boolean(treeBody.truncated) || files.length > TREE_MAX_FILES;
    const commits = commitsRes.ok ? await json<CommitEntry[]>(commitsRes) : [];

    // 6-7. The first manifest we know how to read, and the one source file worth reading, in parallel.
    const manifestFile = MANIFEST_FILES.find((file) => rootFiles.includes(file));
    const sourcePath = pickSourceFile(tree, readme, repo.name ?? ref.name);
    const [manifestContent, sourceText] = await Promise.all([
      manifestFile ? optionalText(gh, `${base}/contents/${manifestFile}`, slug, signedIn, MANIFEST_MAX_CHARS) : null,
      sourcePath ? optionalText(gh, `${base}/contents/${encodePath(sourcePath)}`, slug, signedIn, SOURCE_MAX_CHARS + 1) : null,
    ]);

    return {
      // Canonical names after any redirect, when GitHub sends them.
      ref: { owner: repo.owner?.login ?? ref.owner, name: repo.name ?? ref.name },
      private: repo.private ?? false,
      description: repo.description ?? null,
      stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      latestCommitAt: commits[0]?.commit?.committer?.date ?? null,
      latestCommitSha: commits[0]?.sha ?? null,
      languages,
      readme,
      rootFiles,
      manifest: manifestFile && manifestContent !== null ? { file: manifestFile, content: manifestContent } : null,
      tree,
      treeTruncated,
      sourceFile:
        sourcePath && sourceText !== null
          ? { path: sourcePath, content: sourceText.slice(0, SOURCE_MAX_CHARS), truncated: sourceText.length > SOURCE_MAX_CHARS }
          : null,
    };
  } catch (error) {
    if (error instanceof SummonError) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new SummonError("GITHUB_ERROR", "GitHub took too long to answer. Try again.");
    }
    throw new SummonError("GITHUB_ERROR", "Couldn't reach GitHub. Try again.");
  }
}

/** The repo's file list at one commit, for the history replay. */
export type HistoryPoint = { sha: string; date: string; position: number; tree: TreeEntry[]; treeTruncated: boolean };
export type RepoHistory = { ref: RepoRef; totalCommits: number; points: HistoryPoint[] };

/** "...?page=1234>; rel=\"last\"" -> 1234 */
function lastPage(link: string | null): number | null {
  const match = link ? /[?&]page=(\d+)>;\s*rel="last"/.exec(link) : null;
  return match ? Number(match[1]) : null;
}

/**
 * The file list at up to 4 commits spread over the default branch: the first commit, one and two thirds of
 * the way through, and the latest. At most 8 calls: 1 to count commits, up to 3 to find the older commits,
 * up to 4 trees. Positions count from the newest commit (1 = latest), as GitHub pages them.
 */
export async function fetchRepoHistory(ref: RepoRef, options: FetchOptions = {}): Promise<RepoHistory> {
  const signedIn = Boolean(options.userToken);
  const gh = githubClient(options.userToken ?? getGitHubToken() ?? undefined);
  const slug = repoSlug(ref);
  const base = `/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.name)}`;

  try {
    const latestRes = await gh(`${base}/commits?per_page=1`);
    if (!latestRes.ok) throw failure(latestRes, slug, signedIn);
    const latest = await json<CommitEntry[]>(latestRes);
    const total = lastPage(latestRes.headers.get("link")) ?? latest.length;
    if (total === 0) return { ref, totalCommits: 0, points: [] };

    const positions = [...new Set([total, Math.round((total * 2) / 3), Math.round(total / 3), 1])].filter((p) => p >= 1);
    const commits = await Promise.all(
      positions.map(async (position) => {
        if (position === 1) return { position, entry: latest[0] };
        const res = await gh(`${base}/commits?per_page=1&page=${position}`);
        if (!res.ok) throw failure(res, slug, signedIn);
        return { position, entry: (await json<CommitEntry[]>(res))[0] };
      }),
    );

    const points = await Promise.all(
      commits.flatMap(({ position, entry }) => {
        const sha = entry?.sha;
        if (!sha) return [];
        return [
          (async (): Promise<HistoryPoint> => {
            const res = await gh(`${base}/git/trees/${encodePath(sha)}?recursive=1`);
            if (!res.ok && !isMissing(res)) throw failure(res, slug, signedIn);
            const body = res.ok ? await json<TreeResponse>(res) : {};
            const files: TreeEntry[] = (body.tree ?? []).flatMap((e) =>
              e.type === "blob" && e.path ? [{ path: e.path, size: typeof e.size === "number" ? e.size : 0 }] : [],
            );
            return {
              sha,
              date: entry?.commit?.committer?.date ?? "",
              position,
              tree: files.slice(0, TREE_MAX_FILES),
              treeTruncated: Boolean(body.truncated) || files.length > TREE_MAX_FILES,
            };
          })(),
        ];
      }),
    );
    return { ref, totalCommits: total, points: points.sort((a, b) => b.position - a.position) };
  } catch (error) {
    if (error instanceof SummonError) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new SummonError("GITHUB_ERROR", "GitHub took too long to answer. Try again.");
    }
    throw new SummonError("GITHUB_ERROR", "Couldn't reach GitHub. Try again.");
  }
}
