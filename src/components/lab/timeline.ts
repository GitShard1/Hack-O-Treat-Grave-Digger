// OWNER: Builder B. The monster lab script: which parts get built, in what order, and which real repo
// fact each step shows as its "key moment". Pure data, no React, so it is easy to test.
import type { Fact, SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { BUILD_STAGES, type BuildStage } from "@/components/Monster/stages";

export type Moment = { text: string; fact: Fact };

export type LabStep = {
  /** The part this step builds. */
  part: BuildStage;
  /** How many BUILD_STAGES are done once this step starts (the Monster `stage` prop). */
  stage: number;
  status: string;
  /** Null when the repo has none of the facts this step could quote. Never invented. */
  moment: Moment | null;
};

/** Seconds. Boot + steps + finale stays within about 6-9 seconds. */
export const LAB_TIMING = { boot: 0.8, step: 1.3, finale: 1.3 } as const;

/** First fact (in COPY order) that the repo actually has, filled into its template. */
export function pickMoment(part: BuildStage, facts: Fact[]): Moment | null {
  const templates: Record<string, string> = COPY.lab.stages[part].moments;
  for (const [id, template] of Object.entries(templates)) {
    const fact = facts.find((f) => f.id === id);
    if (fact && fact.value.trim()) return { text: template.replace("{v}", fact.value), fact };
  }
  return null;
}

export function buildTimeline(result: SummonSuccess): LabStep[] {
  const { character, facts } = result;
  return BUILD_STAGES.flatMap((part, index) => {
    // Nothing to bolt on: skip the step rather than pretend.
    if (part === "accessories" && character.accessories.length === 0) return [];
    return [{ part, stage: index + 1, status: COPY.lab.stages[part].status, moment: pickMoment(part, facts.facts) }];
  });
}

export function labDuration(steps: LabStep[]): number {
  return LAB_TIMING.boot + steps.length * LAB_TIMING.step + LAB_TIMING.finale;
}
