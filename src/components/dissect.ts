// OWNER: Builder B. "Dissect your monster": turns the signature part into a short, technical inspection
// report that points at real code. Pure data, no React, so it is easy to test. Everything shown comes
// from fact values; the only fixed text is wording from COPY.dissect.
import type { Fact, SummonSuccess } from "@/lib/contract";
import { COPY } from "@/content/copy";
import { pickMotif, type Motif } from "@/components/Monster/signature";

/**
 * chosen: the signature. skipped: the repo has the fact but the rule's threshold was not met (only the
 * data-mix rule has one). found: present, but a higher rule already won. absent: not in this repo.
 */
export type RuleState = "chosen" | "skipped" | "found" | "absent";
export type DissectRule = { factId: string; name: string; detector: string; state: RuleState };
export type Link = { label: string; url: string };

export type Dissection = {
  motif: Motif;
  part: string;
  /** What the part stands for, in one line. */
  meaning: string;
  lookFor: string;
  /** Terminal-style key/value rows. */
  rows: { key: string; value: string }[];
  links: Link[];
  excerpt: { path: string; lines: string[] } | null;
  rules: DissectRule[];
};

/**
 * The signature rules in the order the server tries them (keep in step with pickSignatureFactId in
 * src/lib/facts.ts). The first one the repo has wins.
 */
export const SIGNATURE_RULES: { factId: string; name: string; detector: string }[] = [
  { factId: "f_code_one_expression", name: "one-expression program", detector: "Python statement scan of the file we read" },
  { factId: "f_tree_types", name: "data-heavy file mix", detector: "file types across the full file list (data files 50%+)" },
  { factId: "f_tree_names", name: "busiest source folder", detector: "folder holding the most source files (5+)" },
  { factId: "f_tree_few_files", name: "tiny program", detector: "3 or fewer source files" },
  { factId: "f_tree_folder", name: "one dominant folder", detector: "a folder holding 25%+ of all files" },
  { factId: "f_description", name: "repo description", detector: "GitHub description" },
  { factId: "f_readme_title", name: "README headline", detector: "first README heading" },
  { factId: "f_lang_top", name: "main language", detector: "GitHub language bytes" },
  { factId: "f_stars", name: "stars", detector: "GitHub stars" },
];

function ruleState(index: number, factId: string, chosenId: string, byId: Map<string, Fact>): RuleState {
  if (factId === chosenId) return "chosen";
  if (!byId.has(factId)) return "absent";
  const chosenIndex = SIGNATURE_RULES.findIndex((r) => r.factId === chosenId);
  return chosenIndex !== -1 && index < chosenIndex ? "skipped" : "found";
}

/** "a/b c.py" -> "a/b%20c.py" */
const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

export function dissect(result: SummonSuccess): Dissection | null {
  const { facts, character } = result;
  const byId = new Map<string, Fact>(facts.facts.map((f) => [f.id, f]));
  const signature = byId.get(character.traits[0].factId);
  if (!signature) return null;

  const { motif } = pickMotif(signature.id, facts.facts);
  const copy = COPY.dissect;
  const revision = byId.get("f_tree_revision")?.value ?? null;
  const ref = revision ?? "HEAD";
  const codeFact = byId.get("f_code_file");
  const file = codeFact ? codeFact.value.replace(/ \(.*$/, "") : null;
  const fileStats = codeFact ? /\((.*)\)$/.exec(codeFact.value)?.[1] ?? null : null;
  const heavy = byId.get("f_tree_folder") ? /^(\S+?)\/? holds/.exec(byId.get("f_tree_folder")!.value)?.[1] ?? null : null;
  const namesFact = byId.get("f_tree_names");
  const named = namesFact ? namesFact.label.replace(/^Files in /, "").replace(/^the root$/, "") : null;
  const imports = byId.get("f_code_imports")?.value ?? null;

  const values = {
    v: signature.value,
    file: file ?? copy.fallbackFile,
    heavy: heavy ? `${heavy}/` : copy.fallbackFolder,
    folder: named ? `${named}/` : copy.fallbackFolder,
  };

  const rule = SIGNATURE_RULES.find((r) => r.factId === signature.id);
  const importNotes = (imports ?? "")
    .split(", ")
    .flatMap((name) => {
      const note = (copy.importNotes as Record<string, string>)[name];
      return note ? [`${name}: ${note}`] : [];
    });

  const rows: { key: string; value: string }[] = [
    { key: copy.rows.part, value: copy.parts[motif].name },
    { key: copy.rows.detector, value: rule?.detector ?? signature.label },
    { key: copy.rows.result, value: `${signature.label}: ${signature.value}` },
  ];
  if (file) rows.push({ key: copy.rows.source, value: `${file}${revision ? ` @ ${revision.slice(0, 7)}` : ""}${fileStats ? ` (${fileStats})` : ""}` });
  if (imports) rows.push({ key: copy.rows.imports, value: imports });
  for (const note of importNotes) rows.push({ key: "", value: note });
  const scanned = [byId.get("f_tree_files")?.value, byId.get("f_tree_types")?.value].filter(Boolean).join(" | ");
  if (scanned) rows.push({ key: copy.rows.scanned, value: scanned });

  const links: Link[] = [];
  if (file) links.push({ label: fill(copy.links.file, { file }), url: `${facts.url}/blob/${ref}/${encodePath(file)}` });
  const folder = motif === "rig" ? named : motif === "swarm" ? heavy : null;
  if (folder) links.push({ label: fill(copy.links.folder, { folder: `${folder}/` }), url: `${facts.url}/tree/${ref}/${encodePath(folder)}` });

  const excerptFact = byId.get("f_code_excerpt");
  const lookFor = (copy.lookFor as Record<string, string>)[signature.id] ?? copy.lookFor.default;

  return {
    motif,
    part: copy.parts[motif].name,
    meaning: copy.parts[motif].meaning,
    lookFor: fill(lookFor, values),
    rows,
    links,
    excerpt: excerptFact && file ? { path: file, lines: excerptFact.value.split("\n") } : null,
    rules: SIGNATURE_RULES.map((r, i) => ({
      ...r,
      state: ruleState(i, r.factId, signature.id, byId),
    })),
  };
}
