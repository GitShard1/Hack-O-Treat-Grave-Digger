import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sealSession, unsealSession, type Session } from "@/lib/auth/session";

const SECRET = "x".repeat(40);
const session: Session = { token: "gh-user-token", login: "ghoul", avatarUrl: "https://a/b.png", expiresAt: Date.now() + 60_000 };

describe("session cookie", () => {
  it("round-trips", () => {
    expect(unsealSession(sealSession(session, SECRET), SECRET)).toEqual(session);
  });

  it("does not expose the token in the cookie value", () => {
    expect(sealSession(session, SECRET)).not.toContain("gh-user-token");
  });

  it("rejects tampering, a different secret, expiry and junk", () => {
    const sealed = sealSession(session, SECRET);
    const tampered = sealed.slice(0, -2) + (sealed.endsWith("A") ? "BB" : "AA");
    expect(unsealSession(tampered, SECRET)).toBeNull();
    expect(unsealSession(sealed, "y".repeat(40))).toBeNull();
    expect(unsealSession(sealed, SECRET, session.expiresAt + 1)).toBeNull();
    expect(unsealSession("not-a-session", SECRET)).toBeNull();
    expect(unsealSession(undefined, SECRET)).toBeNull();
  });
});

// The callback reads cookies through next/headers; give it a fake cookie jar.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar.has(name) ? { value: jar.get(name) } : undefined) }),
}));

const ENV = {
  GITHUB_APP_CLIENT_ID: "Iv1.test",
  GITHUB_APP_CLIENT_SECRET: "test-secret",
  SESSION_SECRET: SECRET,
  APP_URL: "http://localhost:3000",
  GITHUB_APP_SLUG: "grave-digger-test",
};

describe("sign-in routes", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const [key, value] of Object.entries(ENV)) {
      saved[key] = process.env[key];
      process.env[key] = value;
    }
    jar.clear();
  });
  afterEach(() => {
    for (const key of Object.keys(ENV)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    vi.unstubAllGlobals();
  });

  it("login redirects to GitHub with a state that matches a new httpOnly cookie", async () => {
    const { GET } = await import("@/app/api/auth/github/login/route");
    const res = await GET(new Request("http://localhost:3000/api/auth/github/login"));
    const location = new URL(res.headers.get("location") ?? "");
    expect(location.origin + location.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(location.searchParams.get("client_id")).toBe("Iv1.test");
    expect(location.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/github/callback");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`gd_oauth_state=${location.searchParams.get("state")}`);
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  it("login says unavailable when sign-in isn't configured", async () => {
    delete process.env.GITHUB_APP_CLIENT_SECRET;
    const { GET } = await import("@/app/api/auth/github/login/route");
    const res = await GET(new Request("http://localhost:3000/api/auth/github/login"));
    expect(res.headers.get("location")).toContain("auth=unavailable");
  });

  it("callback rejects a state that doesn't match the cookie, without calling GitHub", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    jar.set("gd_oauth_state", "expected-state");
    const { GET } = await import("@/app/api/auth/github/callback/route");
    const res = await GET(new Request("http://localhost:3000/api/auth/github/callback?code=abc&state=forged"));
    expect(res.headers.get("location")).toContain("auth=error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("callback signs the user in with an encrypted session cookie", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("access_token")
          ? Response.json({ access_token: "gh-user-token", expires_in: 28800 })
          : Response.json({ login: "ghoul", avatar_url: "https://avatars.githubusercontent.com/u/1" }),
      ),
    );
    jar.set("gd_oauth_state", "good-state");
    const { GET } = await import("@/app/api/auth/github/callback/route");
    const res = await GET(new Request("http://localhost:3000/api/auth/github/callback?code=abc&state=good-state"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/?auth=ok");

    const cookies = res.headers.getSetCookie();
    const sessionCookie = cookies.find((c) => c.startsWith("gd_session="));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).not.toContain("gh-user-token");
    const value = decodeURIComponent(sessionCookie!.split(";")[0]!.slice("gd_session=".length));
    expect(unsealSession(value, SECRET)?.login).toBe("ghoul");
  });
});
