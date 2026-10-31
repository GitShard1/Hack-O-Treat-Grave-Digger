// OWNER: Builder A. GET /api/auth/github/login: starts "Sign in with GitHub".
// Stores a random state in a short-lived httpOnly cookie to block cross-site login forgery.
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, getGitHubAppConfig, STATE_COOKIE } from "@/lib/auth/github-app";
import { cookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const config = getGitHubAppConfig();
  if (!config) return NextResponse.redirect(new URL("/?auth=unavailable", req.url));

  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authorizeUrl(config, state));
  res.cookies.set(STATE_COOKIE, state, { ...cookieOptions(10 * 60), path: "/api/auth/github" });
  return res;
}
