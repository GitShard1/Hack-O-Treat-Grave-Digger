// OWNER: Builder A. POST /api/summon { url } -> SummonResponse
import { NextResponse } from "next/server";
import { SummonRequestSchema, type ErrorCode, type SummonResponse, type SummonSuccess } from "@/lib/contract";
import { currentSession } from "@/lib/auth/github-app";
import { cachedResult, recentResult, remember } from "@/lib/cache";
import { SummonError } from "@/lib/errors";
import { fetchRepoSnapshot, parseRepoUrl, repoSlug } from "@/lib/github";
import { buildFacts } from "@/lib/facts";
import { generateCharacter } from "@/lib/generate";

export const runtime = "nodejs";
export const maxDuration = 30;

const HTTP_STATUS_BY_ERROR: Record<ErrorCode, number> = {
  INVALID_URL: 400,
  REPO_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  GITHUB_ERROR: 502,
  NOT_IMPLEMENTED: 501,
  INTERNAL: 500,
};


export async function POST(req: Request): Promise<NextResponse<SummonResponse>> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = SummonRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_URL", "Send JSON like { \"url\": \"https://github.com/owner/repo\" }.");
  }

  try {
    const ref = parseRepoUrl(parsed.data.url);
    // Dug again within a few minutes: same monster, no GitHub calls. Only public live results are cached (cache.ts).
    const recent = recentResult(repoSlug(ref));
    if (recent) return ok(recent);

    // Signed-in users can summon their private repos; their token never leaves the server.
    const session = await currentSession();
    const snapshot = await fetchRepoSnapshot(ref, { userToken: session?.token });
    // Same repo, same latest-commit day: same monster.
    const cached = cachedResult(snapshot);
    if (cached) return ok(cached);

    const facts = buildFacts(snapshot);
    const character = await generateCharacter(facts, snapshot);
    const result = { ok: true as const, facts, character };
    remember(snapshot, result);
    return ok(result);
  } catch (err) {
    if (err instanceof SummonError) return fail(err.code, err.message);
    // Log the error type only; never log request headers or env.
    console.error("summon failed:", err instanceof Error ? err.name : typeof err);
    return fail("INTERNAL", "Something went wrong in the graveyard. Try again.");
  }
}

function ok(result: SummonSuccess): NextResponse<SummonResponse> {
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}

function fail(error: ErrorCode, message: string): NextResponse<SummonResponse> {
  return NextResponse.json({ ok: false, error, message }, { status: HTTP_STATUS_BY_ERROR[error] });
}
