// OWNER: Builder A. Server only. Small in-memory cache so a repo gets the same monster all day:
// keyed by repo, the day of its latest commit and the generation version. Lives as long as the server.
// Only live (Claude) results of public repos go in: a fallback after a failed call must not stick for
// the day, and a private repo must never be shown to another visitor.
import "server-only";
import type { SummonSuccess } from "@/lib/contract";
import { repoSlug, type RepoSnapshot } from "@/lib/github";

/** Bump when the prompt, facts or art rules change, so older cached monsters are not reused. */
export const GENERATION_VERSION = "2026-10-31.2";

const MAX_ENTRIES = 200;
/** A repo dug again this soon reuses its result without asking GitHub (saves the 60 calls/hour budget). */
const RECENT_MS = 10 * 60 * 1000;

type Entry = { result: SummonSuccess; at: number };
const byKey = new Map<string, Entry>();
const recentBySlug = new Map<string, string>(); // lower-case slug -> key of its latest entry

/** "psf/requests@2026-10-26#2026-10-31.2": the seed is the day of the latest commit on the default branch. */
export function cacheKey(snapshot: RepoSnapshot): string {
  const day = (snapshot.latestCommitAt ?? snapshot.pushedAt).slice(0, 10);
  return `${repoSlug(snapshot.ref).toLowerCase()}@${day}#${GENERATION_VERSION}`;
}

/** A result for this repo from the last few minutes, found without any GitHub call. */
export function recentResult(slug: string, now = Date.now()): SummonSuccess | null {
  const key = recentBySlug.get(slug.toLowerCase());
  const entry = key ? byKey.get(key) : undefined;
  return entry && now - entry.at < RECENT_MS ? entry.result : null;
}

export function cachedResult(snapshot: RepoSnapshot): SummonSuccess | null {
  return byKey.get(cacheKey(snapshot))?.result ?? null;
}

export function remember(snapshot: RepoSnapshot, result: SummonSuccess, now = Date.now()): void {
  if (snapshot.private || result.character.source !== "live") return;
  const key = cacheKey(snapshot);
  byKey.delete(key); // re-insert so Map order stays oldest first
  byKey.set(key, { result, at: now });
  recentBySlug.set(repoSlug(snapshot.ref).toLowerCase(), key);
  while (byKey.size > MAX_ENTRIES) {
    const oldest = byKey.keys().next().value;
    if (oldest === undefined) break;
    byKey.delete(oldest);
  }
}

/** Tests only. */
export function clearCache(): void {
  byKey.clear();
  recentBySlug.clear();
}
