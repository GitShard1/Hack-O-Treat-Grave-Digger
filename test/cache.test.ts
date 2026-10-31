import { beforeEach, describe, expect, it } from "vitest";
import type { SummonSuccess } from "@/lib/contract";
import { cacheKey, cachedResult, clearCache, recentResult, remember } from "@/lib/cache";
import { exampleResult } from "@/lib/examples";
import { requestsSnapshot } from "./helpers";

const live: SummonSuccess = { ...exampleResult, character: { ...exampleResult.character, source: "live" } };
const T0 = Date.UTC(2026, 9, 31, 12);

describe("summon cache", () => {
  beforeEach(clearCache);

  it("keys by repo, latest-commit day and generation version", () => {
    expect(cacheKey(requestsSnapshot)).toMatch(/^psf\/requests@2026-10-26#/);
    const nextDay = { ...requestsSnapshot, latestCommitAt: "2026-10-27T01:00:00Z" };
    expect(cacheKey(nextDay)).not.toBe(cacheKey(requestsSnapshot));
  });

  it("returns the same live result for the same day", () => {
    remember(requestsSnapshot, live, T0);
    expect(cachedResult(requestsSnapshot)).toBe(live);
    expect(cachedResult({ ...requestsSnapshot, latestCommitAt: "2026-10-30T00:00:00Z" })).toBeNull();
  });

  it("serves a recent dig without GitHub, but only for a few minutes", () => {
    remember(requestsSnapshot, live, T0);
    expect(recentResult("PSF/Requests", T0 + 60_000)).toBe(live);
    expect(recentResult("psf/requests", T0 + 11 * 60_000)).toBeNull();
  });

  it("never stores fallbacks or private repos", () => {
    remember(requestsSnapshot, { ...live, character: { ...live.character, source: "fallback" } }, T0);
    remember({ ...requestsSnapshot, private: true }, live, T0);
    expect(cachedResult(requestsSnapshot)).toBeNull();
    expect(recentResult("psf/requests", T0)).toBeNull();
  });
});
