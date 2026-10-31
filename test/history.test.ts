import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRepoHistory } from "@/lib/github";

const base = "/repos/ghoul/crypt";
const commit = (sha: string, date: string) => [{ sha, commit: { committer: { date } } }];
const tree = (paths: string[]) => ({ truncated: false, tree: paths.map((path) => ({ path, type: "blob", size: 10 })) });

function mock(routes: Record<string, { body: unknown; headers?: Record<string, string> }>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace("https://api.github.com", "");
      calls.push(path);
      const route = routes[path];
      return new Response(JSON.stringify(route?.body ?? { message: "Not Found" }), { status: route ? 200 : 404, headers: route?.headers });
    }),
  );
  return calls;
}

describe("fetchRepoHistory", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("samples the first commit, two thirds, one third and the latest in at most 8 calls", async () => {
    const calls = mock({
      [`${base}/commits?per_page=1`]: {
        body: commit("d4", "2026-10-30T00:00:00Z"),
        headers: { link: `<https://api.github.com${base}/commits?per_page=1&page=9>; rel="last"` },
      },
      [`${base}/commits?per_page=1&page=9`]: { body: commit("a1", "2026-01-01T00:00:00Z") },
      [`${base}/commits?per_page=1&page=6`]: { body: commit("b2", "2026-04-01T00:00:00Z") },
      [`${base}/commits?per_page=1&page=3`]: { body: commit("c3", "2026-07-01T00:00:00Z") },
      [`${base}/git/trees/a1?recursive=1`]: { body: tree(["main.py"]) },
      [`${base}/git/trees/b2?recursive=1`]: { body: tree(["main.py", "a.py"]) },
      [`${base}/git/trees/c3?recursive=1`]: { body: tree(["main.py", "a.py", "b.py"]) },
      [`${base}/git/trees/d4?recursive=1`]: { body: tree(["main.py", "a.py", "b.py", "c.py"]) },
    });
    const history = await fetchRepoHistory({ owner: "ghoul", name: "crypt" });
    expect(history.totalCommits).toBe(9);
    expect(history.points.map((p) => [p.sha, p.position, p.tree.length])).toEqual([
      ["a1", 9, 1],
      ["b2", 6, 2],
      ["c3", 3, 3],
      ["d4", 1, 4],
    ]);
    expect(calls.length).toBeLessThanOrEqual(8);
  });

  it("handles a repo with a single commit", async () => {
    mock({
      [`${base}/commits?per_page=1`]: { body: commit("only", "2026-10-30T00:00:00Z") },
      [`${base}/git/trees/only?recursive=1`]: { body: tree(["x.py"]) },
    });
    const history = await fetchRepoHistory({ owner: "ghoul", name: "crypt" });
    expect(history.totalCommits).toBe(1);
    expect(history.points.map((p) => p.sha)).toEqual(["only"]);
  });
});
