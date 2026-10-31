// OWNER: Builder A. Pure helpers over the repo's file list: what counts as source, which one file is
// worth reading, and plain measures of the list. No network. File contents are UNTRUSTED text and are
// only scanned as characters here, never run.

/** One file from GitHub's recursive tree (folders are left out). */
export type TreeEntry = { path: string; size: number };

const SOURCE_EXTENSIONS = new Set([
  "py", "js", "mjs", "cjs", "ts", "tsx", "jsx", "lua", "luau", "c", "h", "cc", "cpp", "cxx", "hpp", "hh",
  "cs", "java", "kt", "go", "rs", "rb", "php", "swift", "scala", "gd", "sh", "ps1", "r", "jl", "hs", "ml",
  "ex", "exs", "clj", "dart", "zig", "nim", "vue", "svelte", "asm", "s",
]);
export const DATA_EXTENSIONS = new Set(["json", "yaml", "yml", "xml", "csv", "tsv", "ini", "cfg", "toml", "txt", "gz"]);

/** Folders whose files are not the project's own implementation. */
const SKIP_FOLDERS = new Set([
  "node_modules", "vendor", "vendors", "third-party", "third_party", "thirdparty", "external", "extern", "deps",
  "dist", "build", "out", "target", "bin", "obj", ".git", ".github", ".vscode", ".idea", "coverage", "docs", "doc",
  "examples", "example", "samples", "test", "tests", "__tests__", "spec", "specs", "fixtures", "assets", "public",
  "static", "lang", "locale", "locales", "i18n", "android", "ios",
]);
const GENERATED = /\.min\.(js|css)$|\.d\.ts$|\.generated\.|_pb2\.py$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|poetry\.lock)$/;

/** Names that say nothing about what a project does. */
const GENERIC_STEMS = /^(init|index|main|utils?|helpers?|types|constants|config|settings|readme|mod|lib|test|setup|localscript\d*|script\d*|modulescript\d*)$/i;
const COPY_STEMS = /backup|copy|old$|^tmp/i;
const ENTRY_STEMS = new Set(["main", "index", "app", "init", "cli", "server", "game", "core", "__main__", "program", "entry", "lib", "mod"]);
/** Build, packaging and tool config: real code, but it says how a project is built, not what it does. */
const TOOLING_STEMS = /^(setup|conftest|noxfile|fabfile|tasks|gulpfile|gruntfile|webpack|rollup|vite|vitest|jest|eslint|prettier|babel|karma|tailwind|postcss|next|nuxt|astro|svelte|tsup)$|config/i;

const MIN_PICK_BYTES = 500;
const MAX_SOURCE_BYTES = 200_000;

export function extension(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  const dot = file.lastIndexOf(".");
  return dot > 0 ? file.slice(dot + 1).toLowerCase() : "";
}

export function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/** "Movement/LedgeClimb.local.luau" -> "LedgeClimb" */
export function stem(path: string): string {
  const file = fileName(path);
  const dot = file.indexOf(".", 1);
  return dot > 0 ? file.slice(0, dot) : file;
}

function folderOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}

/** The project's own source files: known code extensions, outside vendored, built, test and doc folders. */
export function sourceFiles(tree: TreeEntry[]): TreeEntry[] {
  return tree.filter((entry) => {
    if (!SOURCE_EXTENSIONS.has(extension(entry.path)) || GENERATED.test(entry.path) || entry.size <= 0) return false;
    const folders = entry.path.split("/").slice(0, -1);
    return !folders.some((folder) => SKIP_FOLDERS.has(folder.toLowerCase()));
  });
}

/** Folder holding the most source files directly, with those files. */
function busiestSourceFolder(sources: TreeEntry[]): { folder: string; files: TreeEntry[] } | null {
  const byFolder = new Map<string, TreeEntry[]>();
  for (const entry of sources) {
    const folder = folderOf(entry.path);
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), entry]);
  }
  let best: { folder: string; files: TreeEntry[] } | null = null;
  for (const [folder, files] of [...byFolder].sort(([a], [b]) => a.localeCompare(b))) {
    if (!best || files.length > best.files.length) best = { folder, files };
  }
  return best;
}

/**
 * The one source file most likely to show what the project does: one the README names, an entry point,
 * or one named after the repo, near the top of the tree. Never "the biggest file", which is often generated.
 * Deterministic: ties go to the shorter path, then alphabetical order.
 */
export function pickSourceFile(tree: TreeEntry[], readme: string | null, repoName: string): string | null {
  const sources = sourceFiles(tree).filter(
    (entry) => entry.size >= MIN_PICK_BYTES && entry.size <= MAX_SOURCE_BYTES && !TOOLING_STEMS.test(stem(entry.path)),
  );
  if (sources.length === 0) return null;
  const busiest = busiestSourceFolder(sources)?.folder;
  const repo = repoName.toLowerCase().replace(/[^a-z0-9]/g, "");

  const score = (entry: TreeEntry): number => {
    const name = fileName(entry.path);
    const s = stem(entry.path).toLowerCase().replace(/[^a-z0-9_]/g, "");
    let points = -(entry.path.split("/").length - 1);
    if (readme && name.length >= 4 && readme.includes(name)) points += 6;
    if (ENTRY_STEMS.has(s)) points += 3;
    if (s.length >= 3 && repo.length >= 3 && (repo.includes(s) || s.includes(repo))) points += 4;
    if (folderOf(entry.path) === busiest) points += 1;
    return points;
  };

  const [best] = sources
    .map((entry) => ({ entry, points: score(entry) }))
    .sort((a, b) => b.points - a.points || a.entry.path.length - b.entry.path.length || a.entry.path.localeCompare(b.entry.path));
  return best?.entry.path ?? null;
}

export type TreeMeasures = {
  fileCount: number;
  /** Most common extensions with their share of all files (0-100), most common first. */
  extensions: { ext: string; share: number }[];
  /** Share (0-100) of files that are data or content rather than code. */
  dataShare: number;
  /** The biggest top-level (or second-level) folder by file count, when it holds a large part of the repo. */
  heavyFolder: { folder: string; count: number; share: number } | null;
  /** The folder with the most source files, and its most telling file names (largest first). */
  namedFolder: { folder: string; names: string[] } | null;
  sourceCount: number;
  /** Source file names when the project is tiny (3 or fewer source files). */
  fewSources: string[] | null;
};

export function measureTree(tree: TreeEntry[]): TreeMeasures {
  const fileCount = tree.length;
  const share = (count: number) => (fileCount > 0 ? Math.round((count / fileCount) * 100) : 0);

  const extCounts = new Map<string, number>();
  for (const entry of tree) {
    const ext = extension(entry.path);
    if (ext) extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
  }
  const extensions = [...extCounts]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .map(([ext, count]) => ({ ext, share: share(count) }))
    .filter((e) => e.share >= 1);
  const dataCount = [...extCounts].filter(([ext]) => DATA_EXTENSIONS.has(ext)).reduce((sum, [, count]) => sum + count, 0);

  const folderCounts = new Map<string, number>();
  for (const entry of tree) {
    const parts = entry.path.split("/");
    if (parts.length < 2) continue;
    const folder = parts.slice(0, parts.length >= 3 ? 2 : 1).join("/");
    folderCounts.set(folder, (folderCounts.get(folder) ?? 0) + 1);
  }
  const [heavy] = [...folderCounts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
  const heavyFolder =
    heavy && heavy[1] >= 20 && share(heavy[1]) >= 25 ? { folder: heavy[0], count: heavy[1], share: share(heavy[1]) } : null;

  const sources = sourceFiles(tree);
  const busiest = busiestSourceFolder(sources);
  const names = busiest
    ? [...busiest.files]
        .sort((a, b) => b.size - a.size || a.path.localeCompare(b.path))
        .map((entry) => stem(entry.path))
        .filter((name, index, all) => !GENERIC_STEMS.test(name) && !COPY_STEMS.test(name) && all.indexOf(name) === index)
        .slice(0, 6)
    : [];

  return {
    fileCount,
    extensions,
    dataShare: share(dataCount),
    heavyFolder,
    namedFolder: busiest && busiest.files.length >= 5 && names.length >= 4 ? { folder: busiest.folder, names } : null,
    sourceCount: sources.length,
    fewSources: sources.length > 0 && sources.length <= 3 ? sources.map((entry) => fileName(entry.path)).sort() : null,
  };
}

/**
 * Number of top-level statements in Python source. 1 means the whole program is one expression.
 * A plain character scan: skips strings and comments, counts lines that end at bracket depth 0.
 */
export function pythonStatementCount(source: string): number {
  let depth = 0;
  let statements = 0;
  let lineHasCode = false;
  let continued = false;
  let i = 0;
  while (i < source.length) {
    const ch = source[i] ?? "";
    if (ch === "#") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const triple = source.startsWith(ch.repeat(3), i);
      const close = triple ? ch.repeat(3) : ch;
      i += close.length;
      while (i < source.length && !source.startsWith(close, i)) {
        if (source[i] === "\\") i++;
        else if (!triple && source[i] === "\n") break;
        i++;
      }
      i += close.length;
      lineHasCode = true;
      continued = false;
      continue;
    }
    if (ch === "\\" && source[i + 1] === "\n") {
      continued = true;
      i += 2;
      continue;
    }
    if (ch === "\n") {
      if (depth === 0 && lineHasCode && !continued) {
        statements++;
        lineHasCode = false;
      }
      continued = false;
      i++;
      continue;
    }
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
    if (!/\s/.test(ch)) {
      lineHasCode = true;
      if (ch !== "\\") continued = false;
    }
    i++;
  }
  if (lineHasCode) statements++;
  return statements;
}

/** Up to 5 modules a source file imports, in order of first use. Reads text only. */
export function importsOf(path: string, source: string): string[] {
  const ext = extension(path);
  const patterns: RegExp[] =
    ext === "py"
      ? [/__import__\(\s*["']([\w.]+)["']/g, /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm]
      : ext === "lua" || ext === "luau"
        ? [/require\(\s*["']?([\w./]+)["']?\s*\)/g]
        : ["c", "h", "cc", "cpp", "cxx", "hpp", "hh"].includes(ext)
          ? [/^\s*#include\s+[<"]([^>"]+)[>"]/gm]
          : [/(?:import\s[^'"]*from\s*|require\(\s*|import\(\s*)["']([^"']+)["']/g];
  const found: { name: string; at: number }[] = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const name = match[1] ?? match[2];
      // Relative imports point back into the project; __future__ is a Python switch, not a module.
      if (!name || name.startsWith(".") || name === "__future__") continue;
      found.push({ name: ext === "py" ? (name.split(".")[0] ?? name) : name, at: match.index });
    }
  }
  return [...new Set(found.sort((a, b) => a.at - b.at).map((f) => f.name))].slice(0, 5);
}
