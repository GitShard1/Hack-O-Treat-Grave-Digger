// OWNER: Builder A. POST /api/summon { url } -> SummonResponse
import { NextResponse } from "next/server";
import { SummonRequestSchema, type ErrorCode, type SummonResponse } from "@/lib/contract";
import { currentSession } from "@/lib/auth/github-app";
import { SummonError } from "@/lib/errors";
import { fetchRepoSnapshot, parseRepoUrl } from "@/lib/github";
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

// TODO(A): small in-memory cache keyed by repoSlug(ref).
// - Pre-warm it for the demo repos before presenting.
// - Store each character with its original source, so a cached fallback stays "fallback".
// - Never cache private repos (snapshot.private): another visitor must not see them.

export async function POST(req: Request): Promise<NextResponse<SummonResponse>> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = SummonRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_URL", "Send JSON like { \"url\": \"https://github.com/owner/repo\" }.");
  }

  try {
    const ref = parseRepoUrl(parsed.data.url);
    // Signed-in users can summon their private repos; their token never leaves the server.
    const session = await currentSession();
    const snapshot = await fetchRepoSnapshot(ref, { userToken: session?.token });
    const facts = buildFacts(snapshot);
    const character = await generateCharacter(facts, snapshot);
    return NextResponse.json({ ok: true, facts, character }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof SummonError) return fail(err.code, err.message);
    // Log the error type only; never log request headers or env.
    console.error("summon failed:", err instanceof Error ? err.name : typeof err);
    return fail("INTERNAL", "Something went wrong in the graveyard. Try again.");
  }
}

function fail(error: ErrorCode, message: string): NextResponse<SummonResponse> {
  return NextResponse.json({ ok: false, error, message }, { status: HTTP_STATUS_BY_ERROR[error] });
}
