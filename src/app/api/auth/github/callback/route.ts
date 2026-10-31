// OWNER: Builder A. GET /api/auth/github/callback: GitHub sends the user back here after sign-in.
// Checks state, swaps the code for a user token, and stores it in the encrypted session cookie.
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeCode, fetchGitHubUser, getGitHubAppConfig, STATE_COOKIE } from "@/lib/auth/github-app";
import { cookieOptions, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sealSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(req: Request) {
  const config = getGitHubAppConfig();
  const home = (outcome: string) => new URL(`/?auth=${outcome}`, config?.appUrl ?? req.url);
  if (!config) return NextResponse.redirect(home("unavailable"));

  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expected = (await cookies()).get(STATE_COOKIE)?.value;

  const fail = () => {
    const res = NextResponse.redirect(home("error"));
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/github" });
    return res;
  };
  if (!code || !state || !expected || !sameState(state, expected)) return fail();

  const grant = await exchangeCode(config, code).catch(() => null);
  if (!grant) return fail();
  const user = await fetchGitHubUser(grant.token).catch(() => null);
  if (!user) return fail();

  const maxAge = Math.min(grant.expiresIn, SESSION_MAX_AGE_SECONDS);
  const sealed = sealSession(
    { token: grant.token, login: user.login, avatarUrl: user.avatarUrl, expiresAt: Date.now() + maxAge * 1000 },
    config.sessionSecret,
  );

  const res = NextResponse.redirect(home("ok"));
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/github" });
  res.cookies.set(SESSION_COOKIE, sealed, cookieOptions(maxAge));
  return res;
}
