// OWNER: Builder A. GET /api/auth/me: who is signed in. Never returns the token.
import { NextResponse } from "next/server";
import type { AuthStatus } from "@/lib/contract";
import { currentSession, getGitHubAppConfig, installUrl } from "@/lib/auth/github-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getGitHubAppConfig();
  const session = await currentSession();
  const status: AuthStatus = {
    available: Boolean(config),
    signedIn: Boolean(session),
    login: session?.login ?? null,
    avatarUrl: session?.avatarUrl ?? null,
    installUrl: config ? installUrl(config) : null,
  };
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}
