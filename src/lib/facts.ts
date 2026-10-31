// OWNER: Builder A. Deterministic: same snapshot (and date) in, same facts out. No LLM here.
// Facts only state what was fetched. No judgements about quality, security or abandonment.
import "server-only";
import type { Fact, RepoFacts } from "@/lib/contract";
import { repoSlug, type RepoSnapshot } from "@/lib/github";
import { parseDependencies } from "@/lib/manifest";
import { DATA_EXTENSIONS, extension, fileName, importsOf, measureTree, pythonStatementCount, type TreeMeasures } from "@/lib/tree";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Numbers and flags measured from a snapshot. Shared by buildFacts and the fallback character. */
export type RepoMeasures = {
  slug: string;
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  primaryShare: number; // 0-100
  languages: string[]; // most-used first
  stars: number;
  createdAt: Date;
  ageYears: number;
  daysSincePush: number;
  latestCommitAt: Date | null;
  manifestFile: string | null;
  runtimeDeps: string[];
  devDeps: string[];
  readmeLength: number; // 0 when there is no README
  readmeHeadline: string | null;
  rootFileCount: number;
  hasTests: boolean;
  hasCi: boolean;
  hasDocker: boolean;
  hasLicense: boolean;
  tree: TreeMeasures;
  treeTruncated: boolean;
  /** The one source file we read, measured. Null when none was picked or it could not be read. */
  code: {
    path: string;
    chars: number;
    lines: number;
    imports: string[];
    /** Whole file is one Python expression. Only checked when the full file was read. */
    oneExpression: boolean;
  } | null;
};

export function measureRepo(snapshot: RepoSnapshot, now: Date = new Date()): RepoMeasures {
  const languageEntries = Object.entries(snapshot.languages).sort(([, a], [, b]) => b - a);
  const totalBytes = languageEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  const [primary] = languageEntries;
  const deps = snapshot.manifest
    ? parseDependencies(snapshot.manifest.file, snapshot.manifest.content)
    : { runtime: [], dev: [] };
  const root = snapshot.rootFiles.map((file) => file.toLowerCase());
  const createdAt = new Date(snapshot.createdAt);

  return {
    slug: repoSlug(snapshot.ref),
    name: snapshot.ref.name,
    description: snapshot.description?.trim() || null,
    primaryLanguage: primary?.[0] ?? null,
    primaryShare: primary && totalBytes > 0 ? Math.round((primary[1] / totalBytes) * 100) : 0,
    languages: languageEntries.map(([language]) => language),
    stars: snapshot.stars,
    createdAt,
    ageYears: Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / (365.25 * DAY_MS))),
    daysSincePush: daysBetween(new Date(snapshot.pushedAt), now),
    latestCommitAt: snapshot.latestCommitAt ? new Date(snapshot.latestCommitAt) : null,
    manifestFile: snapshot.manifest?.file ?? null,
    runtimeDeps: deps.runtime,
    devDeps: deps.dev,
    readmeLength: snapshot.readme?.length ?? 0,
    readmeHeadline: snapshot.readme ? readmeHeadline(snapshot.readme) : null,
    rootFileCount: snapshot.rootFiles.length,
    hasTests: root.some((file) => /^(tests?|__tests__|spec|specs)$|^test\.|\.test\.|^jest\.config|^vitest\.config/.test(file)),
    hasCi: root.includes(".github") || root.includes(".travis.yml") || root.includes(".gitlab-ci.yml"),
    hasDocker: root.some((file) => file === "dockerfile" || file.startsWith("docker-compose")),
    hasLicense: root.some((file) => file.startsWith("license") || file.startsWith("licence")),
    tree: measureTree(snapshot.tree),
    treeTruncated: snapshot.treeTruncated,
    code: snapshot.sourceFile ? measureCode(snapshot.sourceFile) : null,
  };
}

function measureCode(file: NonNullable<RepoSnapshot["sourceFile"]>): NonNullable<RepoMeasures["code"]> {
  const { path, content, truncated } = file;
  return {
    path,
    chars: content.length,
    lines: content.split(/\r?\n/).length,
    imports: importsOf(path, content),
    oneExpression: !truncated && extension(path) === "py" && content.length >= 500 && pythonStatementCount(content) === 1,
  };
}

export function buildFacts(snapshot: RepoSnapshot, now: Date = new Date()): RepoFacts {
  const m = measureRepo(snapshot, now);
  const facts: Fact[] = [];
  const add = (id: string, label: string, value: string) => facts.push({ id, label, value });

  if (m.description) add("f_description", "Description", quote(m.description, 120));
  if (m.primaryLanguage) add("f_lang_top", "Main language", `${m.primaryShare}% ${m.primaryLanguage}`);
  if (m.languages.length > 1) {
    add("f_lang_mix", "Languages", `${m.languages.length} languages: ${m.languages.slice(0, 4).join(", ")}`);
  }
  add("f_stars", "Stars", m.stars.toLocaleString("en-US"));
  add("f_age", "Created", `${monthYear(m.createdAt)} (${plural(m.ageYears, "year")} ago)`);
  add("f_last_push", "Last push", relativeDays(m.daysSincePush));
  if (m.latestCommitAt) add("f_last_commit", "Latest commit", monthYear(m.latestCommitAt));
  if (m.manifestFile) {
    add("f_deps", "Dependencies", `${m.runtimeDeps.length} in ${m.manifestFile}`);
    if (m.devDeps.length > 0) add("f_dev_deps", "Dev dependencies", `${m.devDeps.length} in ${m.manifestFile}`);
    if (m.runtimeDeps.length > 0) add("f_deps_named", "Depends on", m.runtimeDeps.slice(0, 3).join(", "));
  }
  add("f_readme", "README", m.readmeLength > 0 ? `${m.readmeLength.toLocaleString("en-US")} characters` : "No README found");
  if (m.readmeHeadline) add("f_readme_title", "README headline", quote(m.readmeHeadline, 80));
  add("f_root_files", "Top-level files", `${m.rootFileCount} files and folders`);
  if (m.hasTests) add("f_tests", "Tests", "Has a test folder or test files");
  if (m.hasCi) add("f_ci", "CI", "Has CI configuration");
  if (m.hasDocker) add("f_docker", "Docker", "Has a Dockerfile");
  if (m.hasLicense) add("f_license", "License", "Has a license file");

  // File list and code. Ids say where each fact came from: f_tree_* the file list, f_code_* the one source file read.
  const t = m.tree;
  const inList = m.treeTruncated ? " in the returned file list" : "";
  if (t.fileCount > 0) add("f_tree_files", "Files", `${t.fileCount.toLocaleString("en-US")} files${inList}`);
  if (t.extensions.length > 0) {
    add("f_tree_types", "File types", t.extensions.slice(0, 3).map((e) => `${e.share}% .${e.ext}`).join(", ") + inList);
  }
  if (t.heavyFolder) {
    const { folder, count, share } = t.heavyFolder;
    add("f_tree_folder", "Biggest folder", `${folder}/ holds ${count.toLocaleString("en-US")} files (${share}%)${inList}`);
  }
  if (t.namedFolder) add("f_tree_names", `Files in ${t.namedFolder.folder || "the root"}`, t.namedFolder.names.join(", "));
  if (t.fewSources) add("f_tree_few_files", "Source files", `Only ${plural(t.fewSources.length, "source file")}: ${t.fewSources.join(", ")}`);
  if (m.code) {
    const name = fileName(m.code.path);
    add("f_code_file", "File we read", `${m.code.path} (${m.code.chars.toLocaleString("en-US")} characters, ${plural(m.code.lines, "line")})`);
    if (m.code.imports.length > 0) add("f_code_imports", `${name} imports`, m.code.imports.join(", "));
    if (m.code.oneExpression) add("f_code_one_expression", "Program shape", `${name} is one single expression`);
  }

  return { repo: m.slug, url: `https://github.com/${m.slug}`, facts };
}

/**
 * The repo's signature: the single most distinctive fact, picked by fixed rules so the art, the first
 * trait and the lab all point at the same thing. Code and file-list facts beat stars and age.
 */
export function pickSignatureFactId(facts: RepoFacts, m: RepoMeasures): string {
  const has = new Set(facts.facts.map((f) => f.id));
  const topExt = m.tree.extensions[0];
  const dataHeavy = topExt !== undefined && DATA_EXTENSIONS.has(topExt.ext) && topExt.share >= 50;
  const order: [boolean, string][] = [
    [true, "f_code_one_expression"],
    [dataHeavy, "f_tree_types"],
    [true, "f_tree_names"],
    [true, "f_tree_few_files"],
    [true, "f_tree_folder"],
    [true, "f_description"],
    [true, "f_readme_title"],
    [true, "f_lang_top"],
    [true, "f_stars"],
  ];
  const found = order.find(([when, id]) => when && has.has(id));
  return found?.[1] ?? facts.facts[0]?.id ?? "f_stars";
}

// ---------- formatting helpers ----------

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
}

export function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

function relativeDays(days: number): string {
  if (days < 1) return "today";
  if (days < 30) return `${plural(days, "day")} ago`;
  if (days < 365) return `${plural(Math.floor(days / 30), "month")} ago`;
  return `${plural(Math.floor(days / 365), "year")} ago`;
}

function monthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function quote(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return `"${clean.length > max ? `${clean.slice(0, max - 3)}...` : clean}"`;
}

/** First Markdown heading, or the first line of plain text, without Markdown symbols. */
function readmeHeadline(readme: string): string | null {
  const lines = readme.split(/\r?\n/).map((line) => line.trim());
  const heading = lines.find((line) => /^#{1,3}\s+\S/.test(line));
  const text = (heading ?? lines.find((line) => /[A-Za-z]/.test(line) && !line.startsWith("<") && !line.startsWith("[!")) ?? "")
    .replace(/^#+\s*/, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
  return text || null;
}
