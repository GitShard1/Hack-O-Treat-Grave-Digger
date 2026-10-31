// OWNER: Builder A. The monster's colours come from the repo's language mix, computed on the server.

/** Recognisable colours for common languages. Unknown languages fall back to SPOOKY_FILL. */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Java: "#b07219",
  Go: "#00add8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4f5d95",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Dart: "#00b4ab",
  Lua: "#000080",
  Luau: "#00a2ff",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Scala: "#c22d40",
  R: "#198ce7",
  "Jupyter Notebook": "#da5b0b",
  Julia: "#a270ba",
  Zig: "#ec915c",
  Makefile: "#427819",
  Dockerfile: "#384d54",
};

const SPOOKY_FILL = "#7c6aa8"; // used when no language is known
const SPOOKY_ACCENTS = ["#ff8a1f", "#9cff57", "#c084fc"] as const;

/**
 * 2-3 hex colours from languages ordered most-used first.
 * Always returns at least two distinct colours.
 */
export function paletteFromLanguages(languagesByUsage: readonly string[]): string[] {
  const colours = languagesByUsage
    .map((language) => LANGUAGE_COLORS[language])
    .filter((colour): colour is string => Boolean(colour));

  const unique = [...new Set(colours)].slice(0, 3);
  const palette = unique.length > 0 ? unique : [SPOOKY_FILL];
  for (const accent of SPOOKY_ACCENTS) {
    if (palette.length >= 2) break;
    if (!palette.includes(accent)) palette.push(accent);
  }
  return palette;
}
