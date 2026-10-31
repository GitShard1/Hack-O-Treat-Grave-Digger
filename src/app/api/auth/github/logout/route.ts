// OWNER: Builder A. POST /api/auth/github/logout: revokes the GitHub token (best effort) and clears the cookie.
import { NextResponse } from "next/server";
import { currentSession, getGitHubAppConfig, revokeToken } from "@/lib/auth/github-app";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const config = getGitHubAppConfig();
  // Only accept sign-out requests from our own pages.
  const origin = req.headers.get("origin");
  if (config && origin && origin !== config.appUrl) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const session = await currentSession();
  if (config && session) await revokeToken(config, session.token);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
