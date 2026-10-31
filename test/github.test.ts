import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SummonError } from "@/lib/errors";
import { fetchRepoSnapshot, parseRepoUrl } from "@/lib/github";

describe("parseRepoUrl", () => {
  it.each([
    ["https://github.com/facebook/react", { owner: "facebook", name: "react" }],
    ["http://github.com/psf/requests", { owner: "psf", name: "requests" }],
    ["github.com/vercel/ms", { owner: "vercel", name: "ms" }],
    ["www.github.com/vercel/ms", { owner: "vercel", name: "ms" }],
    ["vercel/ms", { owner: "vercel", name: "ms" }],
    ["  https://github.com/vercel/ms/  ", { owner: "vercel", name: "ms" }],
    ["https://github.com/vercel/ms.git", { owner: "vercel", name: "ms" }],
    ["https://github.com/vercel/ms?tab=readme#top", { owner: "vercel", name: "ms" }],
    ["https://github.com/vercel/next.js/tree/canary", { owner: "vercel", name: "next.js" }],
    ["https://github.com/some-user/my_repo-2.0", { owner: "some-user", name: "my_repo-2.0" }],
  ])("accepts %s", (input, expected) => {
    expect(parseRepoUrl(input)).toEqual(expected);
  });

  it.each([
    "",
    "   ",
    "https://gitlab.com/owner/repo",
    "https://github.com/owner",
    "https://github.com/",
    "https://github.com/-owner/repo",
    "https://github.com/owner/..",
    "https://github.com/owner/.",
    "https://github.com/owner/repo name",
    "https://github.com/owner/" + "a".repeat(101),
    "ftp://github.com/owner/repo",
    "owner/repo/extra",
    "https://github.com.evil.example/owner/repo",
    "javascript:alert(1)",
    "a".repeat(301),
  ])("rejects %j with INVALID_URL", (input) => {
    expect(() => parseRepoUrl(input)).toThrow(SummonError);
    try {
      parseRepoUrl(input);
    } catch (err) {
      expect((err as SummonError).code).toBe("INVALID_URL");
    }
  });
});

describe("fetchRepoSnapshot", () => {
  const b64 = (text: string) => Buffer.from(text, "utf8").toString("base64");
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  /** Routes fake GitHub responses by path suffix. Unknown paths fail the test. */
  function stub(routes: Record<string, () => Response>) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        const url = String(input);
        const match = Object.keys(routes).find((route) => url.endsWith(route));
        const handler = match === undefined ? undefined : routes[match];
        if (!handler) throw new Error(`unexpected fetch: ${url}`);
        return handler();
      }),
    );
  }

  const meta = {
    description: "A simple HTTP library.",
    stargazers_count: 54656,
    created_at: "2011-02-13T18:38:17Z",
    pushed_at: "2026-10-26T17:14:44Z",
  };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("builds a full snapshot from the GitHub endpoints", async () => {
    stub({
      "/repos/psf/requests": () => json(meta),
      "/repos/psf/requests/languages": () => json({ Python: 390104, Makefile: 2527 }),
      "/repos/psf/requests/readme": () => json({ encoding: "base64", content: b64("# Requests\nHello") }),
      "/repos/psf/requests/contents": () =>
        json([
          { name: "README.md", type: "file" },
          { name: "pyproject.toml", type: "file" },
          { name: "src", type: "dir" },
        ]),
      "/repos/psf/requests/contents/pyproject.toml": () =>
        json({ encoding: "base64", content: b64('[project]\ndependencies = ["urllib3"]\n') }),
      "/repos/psf/requests/commits?per_page=1": () =>
        json([{ commit: { committer: { date: "2026-10-26T17:14:41Z" } } }]),
    });

    const snapshot = await fetchRepoSnapshot({ owner: "psf", name: "requests" });
    expect(snapshot).toEqual({
      ref: { owner: "psf", name: "requests" },
      description: "A simple HTTP library.",
      stars: 54656,
      createdAt: "2011-02-13T18:38:17Z",
      pushedAt: "2026-10-26T17:14:44Z",
      latestCommitAt: "2026-10-26T17:14:41Z",
      languages: { Python: 390104, Makefile: 2527 },
      readme: "# Requests\nHello",
      rootFiles: ["README.md", "pyproject.toml", "src"],
      manifest: { file: "pyproject.toml", content: '[project]\ndependencies = ["urllib3"]\n' },
    });
  });

  it("truncates the README to 4,000 characters", async () => {
    stub({
      "/repos/o/long": () => json(meta),
      "/repos/o/long/readme": () => json({ encoding: "base64", content: b64("x".repeat(5000)) }),
    });
    const snapshot = await fetchRepoSnapshot({ owner: "o", name: "long" });
    expect(snapshot.readme?.length).toBe(4000);
  });

  it("turns optional data into null for an empty repo instead of failing", async () => {
    stub({
      "/repos/o/empty": () => json({ ...meta, description: null }),
      "/repos/o/empty/languages": () => json({}),
      "/repos/o/empty/readme": () => json({ message: "Not Found" }, 404),
      "/repos/o/empty/contents": () => json({ message: "This repository is empty." }, 404),
      "/repos/o/empty/commits?per_page=1": () => json({ message: "Git Repository is empty." }, 409),
    });
    const snapshot = await fetchRepoSnapshot({ owner: "o", name: "empty" });
    expect(snapshot).toMatchObject({
      description: null,
      latestCommitAt: null,
      languages: {},
      readme: null,
      rootFiles: [],
      manifest: null,
    });
  });

  it("fails with REPO_NOT_FOUND when the repo itself is missing", async () => {
    stub({ "/repos/o/nope": () => json({ message: "Not Found" }, 404) });
    await expect(fetchRepoSnapshot({ owner: "o", name: "nope" })).rejects.toMatchObject({ code: "REPO_NOT_FOUND" });
  });

  it("passes RATE_LIMITED through instead of hiding it", async () => {
    stub({
      "/repos/o/busy": () => json({ message: "API rate limit exceeded" }, 403),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 403, headers: { "x-ratelimit-remaining": "0" } })),
    );
    await expect(fetchRepoSnapshot({ owner: "o", name: "busy" })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
