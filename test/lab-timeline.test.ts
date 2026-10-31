import { describe, expect, it } from "vitest";
import type { SummonSuccess } from "@/lib/contract";
import { exampleResult } from "@/lib/examples";
import { buildFacts } from "@/lib/facts";
import { buildTimeline, labDuration, pickMoment } from "@/components/lab/timeline";
import { NOW, bareSnapshot, requestsSnapshot } from "./helpers";

const withFacts = (facts: SummonSuccess["facts"], accessories: SummonSuccess["character"]["accessories"]): SummonSuccess => ({
  ...exampleResult,
  facts,
  character: { ...exampleResult.character, accessories },
});

describe("lab timeline", () => {
  it("quotes real facts as key moments, in build order", () => {
    const steps = buildTimeline(withFacts(buildFacts(requestsSnapshot, NOW), ["lantern"]));
    expect(steps.map((s) => s.part)).toEqual(["frame", "ectoplasm", "eyes", "accessories", "aura"]);
    expect(steps.map((s) => s.stage)).toEqual([1, 2, 3, 4, 5]);
    expect(steps[0]?.moment?.text).toBe("Born Feb 2011 (15 years ago)");
    expect(steps[1]?.moment?.text).toBe("Stitched from 99% Python");
    expect(steps[2]?.moment?.text).toBe("Read src/requests/api.py (7,152 characters, 181 lines)");
    expect(steps[3]?.moment?.text).toBe("Bolted on: models, sessions, adapters, cookies, auth, api");
    expect(steps[4]?.moment?.fact.id).toBe("f_last_push");
  });

  it("only shows facts that exist and skips steps with nothing to build", () => {
    const facts = { repo: "a/b", url: "https://github.com/a/b", facts: [{ id: "f_stars", label: "Stars", value: "3" }] };
    const steps = buildTimeline(withFacts(facts, []));
    expect(steps.map((s) => s.part)).toEqual(["frame", "ectoplasm", "eyes", "aura"]);
    expect(steps[0]?.moment?.text).toBe("Watched by 3 stargazers");
    expect(steps.slice(1).every((s) => s.moment === null)).toBe(true);
  });

  it("never makes up a moment for a bare repo", () => {
    const facts = buildFacts(bareSnapshot, NOW).facts;
    for (const part of ["frame", "ectoplasm", "eyes", "accessories", "aura"] as const) {
      const moment = pickMoment(part, facts);
      if (moment) expect(facts).toContainEqual(moment.fact);
    }
  });

  it("stays within about 12-18 seconds", () => {
    for (const accessories of [[], ["lantern"]] as const) {
      const seconds = labDuration(buildTimeline(withFacts(exampleResult.facts, [...accessories])));
      expect(seconds).toBeGreaterThanOrEqual(12);
      expect(seconds).toBeLessThanOrEqual(18);
    }
  });
});
