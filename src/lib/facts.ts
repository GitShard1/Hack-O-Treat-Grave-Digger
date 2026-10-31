// OWNER: Builder A. Deterministic: same snapshot in, same facts out. No LLM here.
import "server-only";
import type { RepoFacts } from "@/lib/contract";
import type { RepoSnapshot } from "@/lib/github";

/**
 * TODO(A): turn the snapshot into ~8–15 labelled facts with stable ids
 * (f_lang_top, f_lang_count, f_deps_count, f_stars, f_age, f_last_push, f_readme_theme, …).
 * Only state what was fetched. No judgements about quality, security or abandonment.
 */
export function buildFacts(snapshot: RepoSnapshot): RepoFacts {
  const { owner, name } = snapshot.ref;
  return {
    repo: `${owner}/${name}`,
    url: `https://github.com/${owner}/${name}`,
    facts: [{ id: "f_placeholder", label: "TODO", value: "facts builder not implemented" }],
  };
}
