// OWNER: Builder A. Server only. "Sign in with GitHub" through a GitHub App (user-to-server tokens).
// The app asks only for read-only Contents + Metadata, and only on repos the user chooses.
// Setup steps are in the README under "GitHub sign-in (private repos)".
import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, unsealSession, type Session } from "@/lib/auth/session";

export const STATE_COOKIE = "gd_oauth_state";

export type GitHubAppConfig = {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  appUrl: string; // e.g. http://localhost:3000, no trailing slash
  appSlug: string | null; // for the "choose repos" install link
};

/** Null when sign-in isn't configured; the app then works for public repos only. */
export function getGitHubAppConfig(): GitHubAppConfig | null {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!clientId || !clientSecret || !sessionSecret || sessionSecret.length < 32 || !appUrl) return null;
  return { clientId, clientSecret, sessionSecret, appUrl, appSlug: process.env.GITHUB_APP_SLUG || null };
}

export function callbackUrl(config: GitHubAppConfig): string {
  return `${config.appUrl}/api/auth/github/callback`;
}

export function authorizeUrl(config: GitHubAppConfig, state: string): string {
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: callbackUrl(config), state });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/** Where users pick which repos Grave Digger may read (GitHub App installation page). */
export function installUrl(config: GitHubAppConfig): string | null {
  return config.appSlug ? `https://github.com/apps/${encodeURIComponent(config.appSlug)}/installations/new` : null;
}

type TokenResponse = { access_token?: string; expires_in?: number; error?: string };

/** Exchanges the one-time code for a user token. Returns null on any failure. */
export async function exchangeCode(config: GitHubAppConfig, code: string): Promise<{ token: string; expiresIn: number } | null> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: callbackUrl(config),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as TokenResponse;
  if (!data.access_token || data.error) return null;
  return { token: data.access_token, expiresIn: data.expires_in ?? 8 * 60 * 60 };
}

export async function fetchGitHubUser(token: string): Promise<{ login: string; avatarUrl: string } | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "grave-digger-hackathon",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { login: string; avatar_url: string };
  return { login: user.login, avatarUrl: user.avatar_url };
}

/** Best-effort token revocation on sign-out. Failures are ignored; the cookie is cleared anyway. */
export async function revokeToken(config: GitHubAppConfig, token: string): Promise<void> {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  await fetch(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/token`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Basic ${basic}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "grave-digger-hackathon",
    },
    body: JSON.stringify({ access_token: token }),
    signal: AbortSignal.timeout(5_000),
  }).catch(() => undefined);
}

/** The signed-in user's session for this request, or null. */
export async function currentSession(): Promise<Session | null> {
  const config = getGitHubAppConfig();
  if (!config) return null;
  const jar = await cookies();
  return unsealSession(jar.get(SESSION_COOKIE)?.value, config.sessionSecret);
}
