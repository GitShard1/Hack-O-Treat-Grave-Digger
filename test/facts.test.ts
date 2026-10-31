import { describe, expect, it } from "vitest";
import { RepoFactsSchema } from "@/lib/contract";
import { buildFacts } from "@/lib/facts";
import { paletteFromLanguages } from "@/lib/palette";
import { NOW, bareSnapshot, msSnapshot, requestsSnapshot } from "./helpers";

const valueOf = (facts: ReturnType<typeof buildFacts>, id: string) => facts.facts.find((f) => f.id === id)?.value;

describe("buildFacts", () => {
  it("states real, fetched values for psf/requests", () => {
    const facts = buildFacts(requestsSnapshot, NOW);
    expect(facts.repo).toBe("psf/requests");
    expect(facts.url).toBe("https://github.com/psf/requests");
    expect(valueOf(facts, "f_lang_top")).toBe("99% Python");
    expect(valueOf(facts, "f_stars")).toBe("54,656");
    expect(valueOf(facts, "f_age")).toBe("Feb 2011 (15 years ago)");
    expect(valueOf(facts, "f_last_push")).toBe("4 days ago"); // pushed 2026-10-26T17:14Z, 4.8 days before NOW
    expect(valueOf(facts, "f_deps")).toBe("4 in pyproject.toml");
    expect(valueOf(facts, "f_deps_named")).toBe("charset_normalizer, idna, urllib3");
    expect(valueOf(facts, "f_tests")).toBeDefined();
    expect(valueOf(facts, "f_ci")).toBeDefined();
    expect(valueOf(facts, "f_license")).toBeDefined();
  });

  it("matches the shared contract, with unique ids", () => {
    for (const snapshot of [requestsSnapshot, msSnapshot, bareSnapshot]) {
      const facts = RepoFactsSchema.parse(buildFacts(snapshot, NOW));
      const ids = facts.facts.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("handles a repo with no README, manifest or languages", () => {
    const facts = buildFacts(bareSnapshot, NOW);
    expect(valueOf(facts, "f_readme")).toBe("No README found");
    expect(valueOf(facts, "f_lang_top")).toBeUndefined();
    expect(valueOf(facts, "f_deps")).toBeUndefined();
    expect(valueOf(facts, "f_stars")).toBe("0");
  });

  it("is deterministic for the same snapshot and date", () => {
    expect(buildFacts(msSnapshot, NOW)).toEqual(buildFacts(msSnapshot, NOW));
  });

  it("never states a judgement about the project", () => {
    const text = JSON.stringify([requestsSnapshot, msSnapshot, bareSnapshot].map((s) => buildFacts(s, NOW)));
    expect(text).not.toMatch(/abandon|dead|insecure|unmaintained|bad/i);
  });
});

describe("paletteFromLanguages", () => {
  it("uses language colours, most-used first", () => {
    expect(paletteFromLanguages(["TypeScript", "CSS"])).toEqual(["#3178c6", "#563d7c"]);
  });

  it("always returns at least two colours", () => {
    expect(paletteFromLanguages(["Python"])).toHaveLength(2);
    expect(paletteFromLanguages([])).toHaveLength(2);
    expect(paletteFromLanguages(["SomeNewLanguage"])).toHaveLength(2);
  });
});
