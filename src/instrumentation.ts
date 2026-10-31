// Runs once when the Next.js server starts, before it serves any request.
// If GITHUB_TOKEN is missing or rejected by GitHub, startup fails with a clear message.
export async function register(): Promise<void> {
  // Only the Node.js server runtime needs the check. The edge runtime never calls GitHub.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertGitHubAuth } = await import("@/lib/github-auth");
  await assertGitHubAuth();
  console.info("GitHub token verified.");
}
