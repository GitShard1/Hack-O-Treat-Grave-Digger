// Runs once when the Next.js server starts, before it serves any request.
// GITHUB_TOKEN is optional: without it, public repos use GitHub's anonymous limit (60 calls/hour).
// If it is set but GitHub rejects it, startup fails with a clear message, so a bad token is caught early.
export async function register(): Promise<void> {
  // Only the Node.js server runtime needs the check. The edge runtime never calls GitHub.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertGitHubAuth, getGitHubToken } = await import("@/lib/github-auth");
  if (!getGitHubToken()) {
    console.info("No GITHUB_TOKEN set: public repos use GitHub's anonymous limit (60 calls/hour).");
    return;
  }
  await assertGitHubAuth();
  console.info("GitHub token verified.");
}
