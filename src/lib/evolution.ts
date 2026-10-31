// OWNER: Builder A. Shape of GET /api/evolution: the same file-list rules replayed at a few commits across
// a repo's history. Separate from the summon contract (src/lib/contract.ts), which is unchanged.
// Safe to import from client and server.
import { z } from "zod";
import { ErrorCodeSchema, FactSchema } from "@/lib/contract";

export const EvolutionPointSchema = z.object({
  sha: z.string(),
  date: z.string(),
  /** 1 = first commit, totalCommits = latest. */
  commitNumber: z.number().int(),
  fileCount: z.number().int(),
  treeTruncated: z.boolean(),
  /** File-list facts only (f_tree_*): source code is not read at past commits. */
  facts: z.array(FactSchema),
  /** The file-list signature rule that won at this commit, or null when none applied. */
  signatureId: z.string().nullable(),
});
export type EvolutionPoint = z.infer<typeof EvolutionPointSchema>;

export const EvolutionResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), repo: z.string(), url: z.string(), totalCommits: z.number().int(), points: z.array(EvolutionPointSchema) }),
  z.object({ ok: z.literal(false), error: ErrorCodeSchema, message: z.string() }),
]);
export type EvolutionResponse = z.infer<typeof EvolutionResponseSchema>;
export type EvolutionSuccess = Extract<EvolutionResponse, { ok: true }>;
