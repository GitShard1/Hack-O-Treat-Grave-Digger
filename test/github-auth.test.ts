import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SummonError } from "@/lib/errors";
import { assertGitHubAuth, getGitHubToken, resetGitHubAuthForTests } from "@/lib/github-auth";
import { fetchRepoSnapshot } from "@/lib/github";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const rateLimit = (limit: number) => json({ resources: { core: { limit, remaining: limit } } });

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (input: string, init: RequestInit = {}) => handler(String(input), init));
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function errorOf(promise: Promise<unknown>): Promise<SummonError> {
  try {
    await promise;
  } catch (err) {
    if (err instanceof SummonError) return err;
    throw err;
  }
  throw new Error("expected a SummonError");
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = "ghp_test_token";
  resetGitHubAuthForTests();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GITHUB_TOKEN;
  resetGitHubAuthForTests();
});

describe("assertGitHubAuth", () => {
  it("passes when GitHub accepts the token (authenticated limit 5000)", async () => {
    const fetchMock = stubFetch(() => rateLimit(5000));
    await expect(assertGitHubAuth()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/rate_limit");
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("authorization")).toBe("Bearer ghp_test_token");
  });

  it("fails with a clear message when GITHUB_TOKEN is not set", async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchMock = stubFetch(() => rateLimit(5000));
    const err = await errorOf(assertGitHubAuth());
    expect(err.code).toBe("GITHUB_ERROR");
    expect(err.message).toContain("GITHUB_TOKEN is not set");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when GitHub rejects the token (401)", async () => {
    stubFetch(() => json({ message: "Bad credentials" }, 401));
    const err = await errorOf(assertGitHubAuth());
    expect(err.message).toContain("rejected by GitHub");
  });

  it("fails when the request is treated as anonymous (limit 60)", async () => {
    stubFetch(() => rateLimit(60));
    const err = await errorOf(assertGitHubAuth());
    expect(err.message).toContain("treated the request as anonymous");
  });

  it("fails when GitHub cannot be reached", async () => {
    stubFetch(() => {
      throw new TypeError("fetch failed");
    });
    const err = await errorOf(assertGitHubAuth());
    expect(err.message).toContain("could not be reached");
  });

  it("never puts the token in the error message", async () => {
    stubFetch(() => json({ message: "Bad credentials" }, 401));
    const err = await errorOf(assertGitHubAuth());
    expect(err.message).not.toContain("ghp_test_token");
  });

  it("checks GitHub only once per process after success", async () => {
    const fetchMock = stubFetch(() => rateLimit(5000));
    await assertGitHubAuth();
    await assertGitHubAuth();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("getGitHubToken", () => {
  it("returns null for an empty value", () => {
    process.env.GITHUB_TOKEN = "   ";
    expect(getGitHubToken()).toBeNull();
  });
});

describe("repo requests use the token", () => {
  it("sends the token on repo calls", async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith("/repos/o/r")) return json({ created_at: "2020-01-01T00:00:00Z", pushed_at: "2020-01-02T00:00:00Z" });
      return json({ message: "Not Found" }, 404);
    });
    await fetchRepoSnapshot({ owner: "o", name: "r" });
    const repoCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith("/repos/o/r"));
    expect(new Headers(repoCall?.[1]?.headers).get("authorization")).toBe("Bearer ghp_test_token");
  });
});
