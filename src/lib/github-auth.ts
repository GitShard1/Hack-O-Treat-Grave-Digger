// GitHub token auth. Server only. Checks GITHUB_TOKEN before the app starts serving.
// The token is read here and nowhere else, and it is never logged or returned.
import "server-only";
import { SummonError } from "@/lib/errors";

const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
/** Anonymous GitHub REST limit per hour. A valid token raises it to 5000, so we use that to tell them apart. */
const ANONYMOUS_LIMIT = 60;

let verified = false;

/** The GitHub token from the environment, or null if it's not set. */
export function getGitHubToken(): string | null {
  return process.env.GITHUB_TOKEN?.trim() || null;
}

/**
 * Confirms GITHUB_TOKEN is set and accepted by GitHub. Throws a SummonError that says why not.
 * Called once at startup from src/instrumentation.ts. The result is kept for the life of the process.
 */
export async function assertGitHubAuth(): Promise<void> {
  if (verified) return;

  const token = getGitHubToken();
  if (!token) {
    throw new SummonError("GITHUB_ERROR", "GITHUB_TOKEN is not set. Add a GitHub token to .env.local (see README step 3).");
  }

  let res: Response;
  try {
    res = await fetch(`${GITHUB_API}/rate_limit`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "grave-digger",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new SummonError("GITHUB_ERROR", "GITHUB_TOKEN could not be checked: GitHub could not be reached.");
  }

  if (res.status === 401) {
    throw new SummonError("GITHUB_ERROR", "GITHUB_TOKEN was rejected by GitHub. It is invalid or expired.");
  }
  if (!res.ok) {
    throw new SummonError("GITHUB_ERROR", `GITHUB_TOKEN could not be checked: GitHub responded with ${res.status}.`);
  }

  const body = (await res.json().catch(() => null)) as { resources?: { core?: { limit?: unknown } } } | null;
  const limit = body?.resources?.core?.limit;
  if (typeof limit !== "number" || limit <= ANONYMOUS_LIMIT) {
    throw new SummonError("GITHUB_ERROR", "GITHUB_TOKEN was not applied: GitHub treated the request as anonymous.");
  }

  verified = true;
}

/** Test helper: forget the cached result. */
export function resetGitHubAuthForTests(): void {
  verified = false;
}
