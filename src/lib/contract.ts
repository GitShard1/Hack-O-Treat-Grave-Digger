/**
 * Shared data contract between Builder A (data & generation) and Builder B (UI & visuals).
 * Agree on changes together, then leave it alone. Zod schemas are the source of truth;
 * types are inferred from them so runtime validation and TypeScript never drift apart.
 * Safe to import from client and server (no secrets, no Node APIs).
 */
import { z } from "zod";

// ---------- Visual part enums (Builder B draws one SVG part per value) ----------

export const ARCHETYPES = ["ghost", "zombie", "golem", "vampire", "witch", "swamp-thing"] as const;
export const EYE_STYLES = ["single", "pair", "many", "hollow", "glowing"] as const;
export const ACCESSORIES = ["lantern", "chains", "top-hat", "scarf", "candle", "cobwebs"] as const;
export const AURAS = ["fog", "embers", "sparks", "drip", "none"] as const;

export const ArchetypeSchema = z.enum(ARCHETYPES);
export const EyeStyleSchema = z.enum(EYE_STYLES);
export const AccessorySchema = z.enum(ACCESSORIES);
export const AuraSchema = z.enum(AURAS);

export type Archetype = z.infer<typeof ArchetypeSchema>;
export type EyeStyle = z.infer<typeof EyeStyleSchema>;
export type Accessory = z.infer<typeof AccessorySchema>;
export type Aura = z.infer<typeof AuraSchema>;

// ---------- Repo facts (real, fetched data only) ----------

export const FactSchema = z.object({
  /** Stable id the LLM must cite, e.g. "f_lang_top". */
  id: z.string().regex(/^f_[a-z0-9_]+$/),
  /** Human label shown in the UI, e.g. "Main language". */
  label: z.string(),
  /** The fetched value, e.g. "71% TypeScript". */
  value: z.string(),
});
export type Fact = z.infer<typeof FactSchema>;

export const RepoFactsSchema = z.object({
  /** "owner/name", built with repoSlug() in github.ts */
  repo: z.string(),
  url: z.url(),
  facts: z.array(FactSchema).min(1),
});
export type RepoFacts = z.infer<typeof RepoFactsSchema>;

// ---------- Generated character ----------

export const TraitSchema = z.object({
  title: z.string().max(60),
  description: z.string().max(240),
  /** Must match a Fact.id in the same response. Checked server-side by validateCharacter() in generate.ts. */
  factId: z.string(),
});
export type Trait = z.infer<typeof TraitSchema>;

export const CHARACTER_SOURCES = ["live", "fallback", "saved-example"] as const;

export const CharacterSchema = z.object({
  name: z.string().max(60),
  archetype: ArchetypeSchema,
  /** 2-3 hex colours, derived from the language mix. */
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(3),
  eyes: EyeStyleSchema,
  accessories: z.array(AccessorySchema).max(3),
  aura: AuraSchema,
  traits: z.tuple([TraitSchema, TraitSchema, TraitSchema]),
  /** Fiction, 80-120 words (checked in generate.ts). Always labelled as fiction in the UI. */
  originStory: z.string(),
  /** Never present "fallback" or "saved-example" as a fresh live generation. */
  source: z.enum(CHARACTER_SOURCES),
});
export type Character = z.infer<typeof CharacterSchema>;

// ---------- API: POST /api/summon ----------

export const SummonRequestSchema = z.object({
  url: z.string().trim().min(1),
});
export type SummonRequest = z.infer<typeof SummonRequestSchema>;

export const ERROR_CODES = [
  "INVALID_URL",
  "REPO_NOT_FOUND",
  "RATE_LIMITED",
  "GITHUB_ERROR",
  "NOT_IMPLEMENTED", // scaffolding only: remove once github.ts is implemented
  "INTERNAL",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const ErrorCodeSchema = z.enum(ERROR_CODES);

export const SummonSuccessSchema = z.object({
  ok: z.literal(true),
  facts: RepoFactsSchema,
  character: CharacterSchema,
});
export const SummonFailureSchema = z.object({
  ok: z.literal(false),
  error: ErrorCodeSchema,
  message: z.string(),
});
/** `ok` is the discriminant: narrow on it before reading facts or error. */
export const SummonResponseSchema = z.discriminatedUnion("ok", [SummonSuccessSchema, SummonFailureSchema]);

export type SummonSuccess = z.infer<typeof SummonSuccessSchema>;
export type SummonFailure = z.infer<typeof SummonFailureSchema>;
export type SummonResponse = z.infer<typeof SummonResponseSchema>;
