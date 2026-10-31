// OWNER: Builder A. GET /api/evolution?repo=owner/name -> EvolutionResponse
// Replays the file-list signature rules at the first commit, one and two thirds through, and the latest.
// Only runs when someone asks for it, so a normal dig still costs at most 7 GitHub calls.
import { NextResponse } from "next/server";
import type { ErrorCode } from "@/lib/contract";
import { currentSession } from "@/lib/auth/github-app";
import { SummonError } from "@/lib/errors";
import type { EvolutionResponse, EvolutionSuccess } from "@/lib/evolution";
import { buildFacts, measureRepo, pickSignatureFactId } from "@/lib/facts";
import { fetchRepoHistory, parseRepoUrl, repoSlug, type HistoryPoint, type RepoRef, type RepoSnapshot } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Rules that only need the file list; the others need code, README or metadata we do not fetch here. */
const FILE_LIST_RULES = new Set(["f_tree_types", "f_tree_names", "f_tree_few_files", "f_tree_folder"]);
const STATUS: Record<ErrorCode, number> = { INVALID_URL: 400, REPO_NOT_FOUND: 404, RATE_LIMITED: 429, GITHUB_ERROR: 502, NOT_IMPLEMENTED: 501, INTERNAL: 500 };

/** Same repo and latest commit: same replay. Public repos only. */
const cache = new Map<string, EvolutionSuccess>();

function pointFacts(ref: RepoRef, point: HistoryPoint, totalCommits: number) {
  // A snapshot holding only the file list, so buildFacts and the signature rules run unchanged.
  const snapshot: RepoSnapshot = {
    ref,
    private: false,
    description: null,
    stars: 0,
    createdAt: point.date,
    pushedAt: point.date,
    latestCommitAt: point.date,
    latestCommitSha: point.sha,
    languages: {},
    readme: null,
    rootFiles: [...new Set(point.tree.map((e) => e.path.split("/")[0] ?? ""))],
    manifest: null,
    tree: point.tree,
    treeTruncated: point.treeTruncated,
    sourceFile: null,
  };
  const all = buildFacts(snapshot, new Date(point.date || Date.now()));
  const facts = all.facts.filter((f) => f.id.startsWith("f_tree_") && f.id !== "f_tree_revision");
  const chosen = pickSignatureFactId({ ...all, facts }, measureRepo(snapshot, new Date(point.date || Date.now())));
  return {
    sha: point.sha,
    date: point.date,
    commitNumber: totalCommits - point.position + 1,
    fileCount: point.tree.length,
    treeTruncated: point.treeTruncated,
    facts,
    signatureId: FILE_LIST_RULES.has(chosen) ? chosen : null,
  };
}

export async function GET(req: Request): Promise<NextResponse<EvolutionResponse>> {
  const input = new URL(req.url).searchParams.get("repo") ?? "";
  try {
    const ref = parseRepoUrl(input);
    const session = await currentSession();
    const history = await fetchRepoHistory(ref, { userToken: session?.token });
    const key = `${repoSlug(ref).toLowerCase()}@${history.points.at(-1)?.sha ?? ""}`;
    const cached = !session && cache.get(key);
    if (cached) return NextResponse.json(cached);

    const result: EvolutionSuccess = {
      ok: true,
      repo: repoSlug(history.ref),
      url: `https://github.com/${repoSlug(history.ref)}`,
      totalCommits: history.totalCommits,
      points: history.points.map((point) => pointFacts(history.ref, point, history.totalCommits)),
    };
    if (!session) cache.set(key, result);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof SummonError) return fail(err.code, err.message);
    console.error("evolution failed:", err instanceof Error ? err.name : typeof err);
    return fail("INTERNAL", "Something went wrong digging through the history. Try again.");
  }
}

function fail(error: ErrorCode, message: string): NextResponse<EvolutionResponse> {
  return NextResponse.json({ ok: false, error, message }, { status: STATUS[error] });
}
