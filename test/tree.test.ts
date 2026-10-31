import { describe, expect, it } from "vitest";
import { buildFacts, measureRepo, pickSignatureFactId } from "@/lib/facts";
import { importsOf, measureTree, pickSourceFile, pythonStatementCount, sourceFiles } from "@/lib/tree";
import { NOW, bareSnapshot, mayhemSnapshot, msSnapshot, requestsSnapshot, spincubeSnapshot } from "./helpers";

const valueOf = (facts: ReturnType<typeof buildFacts>, id: string) => facts.facts.find((f) => f.id === id)?.value;
const signatureOf = (snapshot: typeof spincubeSnapshot) => {
  const facts = buildFacts(snapshot, NOW);
  return pickSignatureFactId(facts, measureRepo(snapshot, NOW));
};

describe("source files", () => {
  it("leaves out vendored, built, test and generated files", () => {
    const tree = [
      { path: "src/app.ts", size: 900 },
      { path: "node_modules/x/index.js", size: 900 },
      { path: "src/third-party/lib.cpp", size: 900 },
      { path: "tests/app.test.ts", size: 900 },
      { path: "dist/app.min.js", size: 900 },
      { path: "data/items.json", size: 900 },
    ];
    expect(sourceFiles(tree).map((e) => e.path)).toEqual(["src/app.ts"]);
  });

  it("picks a file the README names over an entry point", () => {
    const tree = [
      { path: "src/main.py", size: 2_000 },
      { path: "src/engine/raymarch.py", size: 2_000 },
    ];
    expect(pickSourceFile(tree, "The magic is in raymarch.py.", "demo")).toBe("src/engine/raymarch.py");
    expect(pickSourceFile(tree, null, "demo")).toBe("src/main.py");
  });

  it("skips build and tool config", () => {
    const tree = [
      { path: "setup.py", size: 2_000 },
      { path: "vite.config.ts", size: 2_000 },
      { path: "pkg/thing.py", size: 2_000 },
    ];
    expect(pickSourceFile(tree, null, "demo")).toBe("pkg/thing.py");
  });

  it("picks the expected file for the real fixtures", () => {
    expect(pickSourceFile(spincubeSnapshot.tree, spincubeSnapshot.readme, "spincube")).toBe("cube.py");
    expect(pickSourceFile(requestsSnapshot.tree, requestsSnapshot.readme, "requests")).toBe("src/requests/api.py");
    expect(pickSourceFile(msSnapshot.tree, msSnapshot.readme, "ms")).toBe("src/index.ts");
  });
});

describe("pythonStatementCount", () => {
  it("counts top-level statements, ignoring brackets in strings and comments", () => {
    expect(pythonStatementCount("x = 1\ny = 2\n")).toBe(2);
    expect(pythonStatementCount('print(\n  ")",\n  1)\n# )\n')).toBe(1);
    expect(pythonStatementCount("(lambda a: \\\n a)(1)\n")).toBe(1);
    expect(pythonStatementCount('"""\ndoc\n"""\nx = 1\n')).toBe(2);
  });

  it("sees spincube's cube.py as one expression", () => {
    expect(pythonStatementCount(spincubeSnapshot.sourceFile?.content ?? "")).toBe(1);
  });
});

describe("importsOf", () => {
  it("reads module names without relative imports", () => {
    expect(importsOf("a.py", 'from . import x\nimport os\nm = __import__("ctypes.wintypes")\n')).toEqual(["os", "ctypes"]);
    expect(importsOf("a.ts", 'import x from "./x";\nimport { z } from "zod";\n')).toEqual(["zod"]);
    expect(importsOf("a.cpp", "#include <vector>\n#include \"game.h\"\n")).toEqual(["vector", "game.h"]);
  });
});

describe("file-list facts", () => {
  it("says what the file list shows for spincube", () => {
    const facts = buildFacts(spincubeSnapshot, NOW);
    expect(valueOf(facts, "f_tree_few_files")).toBe("Only 2 source files: cube.py, shadecube.py");
    expect(valueOf(facts, "f_code_imports")).toBe("functools, math, ctypes, time");
    expect(valueOf(facts, "f_code_one_expression")).toBe("cube.py is one single expression");
  });

  it("names the files in the busiest source folder", () => {
    expect(valueOf(buildFacts(requestsSnapshot, NOW), "f_tree_names")).toBe("models, sessions, adapters, cookies, auth, api");
  });

  it("marks counts from a cut-short file list", () => {
    const facts = buildFacts({ ...spincubeSnapshot, treeTruncated: true }, NOW);
    expect(valueOf(facts, "f_tree_files")).toBe("2 files in the returned file list");
  });

  it("finds a data-heavy repo's biggest folder", () => {
    const tree = [
      ...Array.from({ length: 60 }, (_, i) => ({ path: `data/json/item${i}.json`, size: 100 })),
      ...Array.from({ length: 20 }, (_, i) => ({ path: `src/part${i}.cpp`, size: 1_000 })),
    ];
    const t = measureTree(tree);
    expect(t.dataShare).toBe(75);
    expect(t.heavyFolder).toEqual({ folder: "data/json", count: 60, share: 75 });
  });
});

describe("pickSignatureFactId", () => {
  it("leads with the most distinctive fact for each demo repo", () => {
    expect(signatureOf(spincubeSnapshot)).toBe("f_code_one_expression");
    expect(signatureOf(mayhemSnapshot)).toBe("f_tree_names");
    expect(signatureOf(requestsSnapshot)).toBe("f_tree_names");
  });

  it("picks data file types when data dominates", () => {
    const tree = [
      ...Array.from({ length: 60 }, (_, i) => ({ path: `data/json/item${i}.json`, size: 100 })),
      ...Array.from({ length: 20 }, (_, i) => ({ path: `src/part${i}.cpp`, size: 1_000 })),
    ];
    expect(signatureOf({ ...bareSnapshot, tree })).toBe("f_tree_types");
  });

  it("always returns a fact the repo has", () => {
    const facts = buildFacts(bareSnapshot, NOW);
    expect(facts.facts.map((f) => f.id)).toContain(signatureOf(bareSnapshot));
  });
});
