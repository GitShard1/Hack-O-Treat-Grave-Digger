// OWNER: Builder A. Reads dependency names out of one manifest file.
// The manifest is UNTRUSTED text: it is only parsed as data here, never executed or evaluated.

export type Dependencies = { runtime: string[]; dev: string[] };

const EMPTY: Dependencies = { runtime: [], dev: [] };

/** Manifest file names we know how to read, in the order we look for them. */
export const MANIFEST_FILES = ["package.json", "pyproject.toml", "requirements.txt", "Cargo.toml", "go.mod"] as const;

export function parseDependencies(file: string, content: string): Dependencies {
  switch (file) {
    case "package.json":
      return parsePackageJson(content);
    case "requirements.txt":
      return { runtime: parseRequirements(content), dev: [] };
    case "pyproject.toml":
      return parsePyproject(content);
    case "Cargo.toml":
      return parseCargo(content);
    case "go.mod":
      return { runtime: parseGoMod(content), dev: [] };
    default:
      return EMPTY;
  }
}

function parsePackageJson(content: string): Dependencies {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return EMPTY;
  }
  if (typeof data !== "object" || data === null) return EMPTY;
  const record = data as Record<string, unknown>;
  return { runtime: objectKeys(record.dependencies), dev: objectKeys(record.devDependencies) };
}

function objectKeys(value: unknown): string[] {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? Object.keys(value) : [];
}

/** "requests>=2.0 ; python_version>'3'" -> "requests" */
function requirementName(spec: string): string {
  return spec.trim().split(/[\s<>=!~;[(@,]/)[0] ?? "";
}

function parseRequirements(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
    .map(requirementName)
    .filter(Boolean);
}

/** Body of a TOML table, e.g. tomlSection(text, "dependencies") for [dependencies]. */
function tomlSection(content: string, name: string): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `[${name}]`);
  if (start === -1) return "";
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s*\[/.test(line)) break;
    body.push(line);
  }
  return body.join("\n");
}

/** Keys of a TOML table: lines shaped like `name = ...`. */
function tomlKeys(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => /^\s*([A-Za-z0-9_.-]+)\s*=/.exec(line)?.[1])
    .filter((key): key is string => Boolean(key));
}

function parsePyproject(content: string): Dependencies {
  // PEP 621: dependencies = [ "name>=1", ... ] inside [project]
  const project = tomlSection(content, "project");
  const list = /^\s*dependencies\s*=\s*\[([\s\S]*?)\]/m.exec(project)?.[1] ?? "";
  const pep621 = [...list.matchAll(/["']([^"']+)["']/g)].map((m) => requirementName(m[1] ?? "")).filter(Boolean);
  // Poetry: [tool.poetry.dependencies] name = "^1.0"
  const poetry = tomlKeys(tomlSection(content, "tool.poetry.dependencies")).filter((key) => key !== "python");
  const poetryDev = tomlKeys(tomlSection(content, "tool.poetry.group.dev.dependencies"));
  return { runtime: [...new Set([...pep621, ...poetry])], dev: poetryDev };
}

function parseCargo(content: string): Dependencies {
  return {
    runtime: tomlKeys(tomlSection(content, "dependencies")),
    dev: tomlKeys(tomlSection(content, "dev-dependencies")),
  };
}

function parseGoMod(content: string): string[] {
  const names: string[] = [];
  const block = /^require\s*\(([\s\S]*?)^\)/m.exec(content)?.[1] ?? "";
  for (const line of block.split(/\r?\n/)) {
    const name = line.trim().split(/\s+/)[0];
    if (name && !name.startsWith("//")) names.push(name);
  }
  for (const match of content.matchAll(/^require\s+([^\s(]+)\s+v/gm)) {
    if (match[1]) names.push(match[1]);
  }
  return [...new Set(names)];
}
