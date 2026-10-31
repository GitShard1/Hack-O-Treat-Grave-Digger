import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SummonError } from "@/lib/errors";
import { fetchRepoSnapshot, parseRepoUrl } from "@/lib/github";

describe("parseRepoUrl", () => {
  it.each([
    ["https://github.com/psf/requests", "psf", "requests"],
    ["github.com/psf/requests", "psf", "requests"],
    ["psf/requests", "psf", "requests"],
    ["https://github.com/psf/requests.git", "psf", "requests"],
    ["https://www.github.com/vercel/next.js/tree/canary/docs", "vercel", "next.js"],
    ["  https://github.com/vercel/ms/  ", "vercel", "ms"],
    ["https://github.com/a/b?tab=readme", "a", "b"],
    ["http://github.com/psf/requests", "psf", "requests"],
    ["www.github.com/vercel/ms", "vercel", "ms"],
    ["https://github.com/vercel/ms?tab=readme#top", "vercel", "ms"],
    ["https://github.com/some-user/my_repo-2.0", "some-user", "my_repo-2.0"],
  ])("reads %s", (input, owner, name) => {
    expect(parseRepoUrl(input)).toEqual({ owner, name });
  });

  it.each([
    "",
    "   ",
    "psf",
    "https://gitlab.com/psf/requests",
    "https://github.com/",
    "https://github.com/owner",
    "-bad/repo",
    "psf/..",
    "https://github.com/owner/.",
    "a b/c",
    "https://github.com/owner/" + "a".repeat(101),
    "ftp://github.com/owner/repo",
    "owner/repo/extra",
    "https://github.com.evil.example/owner/repo",
    "javascript:alert(1)",
    "a".repeat(301),
  ])(
    "rejects %j",
    (input) => {
      expect(() => parseRepoUrl(input)).toThrowError(SummonError);
      try {
        parseRepoUrl(input);
      } catch (error) {
        expect((error as SummonError).code).toBe("INVALID_URL");
      }
    },
  );
});

type Route = { status?: number; body?: unknown; text?: string; headers?: Record<string, string> };

/** Fake fetch for api.github.com keyed by path; records the headers it was called with. */
function mockGitHub(routes: Record<string, Route>) {
  const calls: { path: string; headers: Record<string, string> }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace("https://api.github.com", "");
    calls.push({ path, headers: (init?.headers ?? {}) as Record<string, string> });
    const route = routes[path] ?? { status: 404, body: { message: "Not Found" } };
    const body = route.text ?? JSON.stringify(route.body ?? {});
    return new Response(body, { status: route.status ?? 200, headers: route.headers });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const repo = {
  name: "secret-crypt",
  owner: { login: "ghoul" },
  private: true,
  description: "A private crypt",
  stargazers_count: 3,
  created_at: "2020-01-01T00:00:00Z",
  pushed_at: "2026-10-30T00:00:00Z",
};

describe("fetchRepoSnapshot", () => {
  const base = "/repos/ghoul/secret-crypt";
  let savedToken: string | undefined;
  beforeEach(() => {
    savedToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (savedToken !== undefined) process.env.GITHUB_TOKEN = savedToken;
  });

  it("builds a snapshot in at most 6 calls and uses the user's token", async () => {
    const calls = mockGitHub({
      [base]: { body: repo },
      [`${base}/languages`]: { body: { TypeScript: 900, CSS: 100 } },
      [`${base}/readme`]: { text: "# Secret Crypt\nDo not open." },
      [`${base}/contents/`]: { body: [{ name: "package.json", type: "file" }, { name: "src", type: "dir" }] },
      [`${base}/commits?per_page=1`]: { body: [{ commit: { committer: { date: "2026-10-29T00:00:00Z" } } }] },
      [`${base}/contents/package.json`]: { text: '{"dependencies":{"zod":"4"}}' },
    });

    const snapshot = await fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" }, { userToken: "user-token" });

    expect(snapshot).toMatchObject({
      ref: { owner: "ghoul", name: "secret-crypt" },
      private: true,
      stars: 3,
      latestCommitAt: "2026-10-29T00:00:00Z",
      languages: { TypeScript: 900, CSS: 100 },
      readme: "# Secret Crypt\nDo not open.",
      rootFiles: ["package.json", "src"],
      manifest: { file: "package.json", content: '{"dependencies":{"zod":"4"}}' },
    });
    expect(calls.length).toBeLessThanOrEqual(6);
    for (const call of calls) expect(call.headers.Authorization).toBe("Bearer user-token");
  });

  it("works without a README or manifest", async () => {
    mockGitHub({
      [base]: { body: repo },
      [`${base}/languages`]: { body: {} },
      [`${base}/contents/`]: { body: [{ name: "main.c", type: "file" }] },
      [`${base}/commits?per_page=1`]: { body: [] },
    });
    const snapshot = await fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" });
    expect(snapshot.readme).toBeNull();
    expect(snapshot.manifest).toBeNull();
    expect(snapshot.latestCommitAt).toBeNull();
  });

  it("truncates the README to 4,000 characters", async () => {
    mockGitHub({
      [base]: { body: repo },
      [`${base}/languages`]: { body: {} },
      [`${base}/readme`]: { text: "x".repeat(5000) },
    });
    const snapshot = await fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" });
    expect(snapshot.readme?.length).toBe(4000);
  });

  it("treats missing optional data as empty for an empty repo instead of failing", async () => {
    mockGitHub({
      [base]: { body: { ...repo, description: null } },
      [`${base}/contents/`]: { status: 404, body: { message: "This repository is empty." } },
      [`${base}/commits?per_page=1`]: { status: 409, body: { message: "Git Repository is empty." } },
    });
    const snapshot = await fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" });
    expect(snapshot).toMatchObject({
      description: null,
      latestCommitAt: null,
      languages: {},
      readme: null,
      rootFiles: [],
      manifest: null,
    });
  });

  it("still stops on a rate limit from an optional call", async () => {
    mockGitHub({
      [base]: { body: repo },
      [`${base}/languages`]: { status: 403, body: {}, headers: { "x-ratelimit-remaining": "0" } },
    });
    await expect(fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("reports a missing or hidden repo, with a sign-in hint", async () => {
    mockGitHub({});
    await expect(fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" })).rejects.toMatchObject({
      code: "REPO_NOT_FOUND",
      message: expect.stringContaining("sign in"),
    });
  });

  it("reports rate limits", async () => {
    mockGitHub({ [base]: { status: 403, body: {}, headers: { "x-ratelimit-remaining": "0" } } });
    await expect(fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("never puts the token in an error message", async () => {
    mockGitHub({ [base]: { status: 500, body: {} } });
    const error = await fetchRepoSnapshot({ owner: "ghoul", name: "secret-crypt" }, { userToken: "super-secret" }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(SummonError);
    expect(String((error as Error).message)).not.toContain("super-secret");
  });
});
