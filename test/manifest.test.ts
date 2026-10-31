import { describe, expect, it } from "vitest";
import { parseDependencies } from "@/lib/manifest";
import { requestsSnapshot } from "./helpers";

describe("parseDependencies", () => {
  it("reads runtime and dev dependencies from package.json", () => {
    const content = JSON.stringify({ dependencies: { react: "19", zod: "4" }, devDependencies: { vitest: "5" } });
    expect(parseDependencies("package.json", content)).toEqual({ runtime: ["react", "zod"], dev: ["vitest"] });
  });

  it("returns nothing for broken package.json instead of throwing", () => {
    expect(parseDependencies("package.json", "{ not json")).toEqual({ runtime: [], dev: [] });
  });

  it("reads PEP 621 dependencies from a real pyproject.toml", () => {
    const manifest = requestsSnapshot.manifest;
    if (!manifest) throw new Error("fixture has no manifest");
    expect(parseDependencies(manifest.file, manifest.content).runtime).toEqual([
      "charset_normalizer",
      "idna",
      "urllib3",
      "certifi",
    ]);
  });

  it("reads Poetry dependencies and skips python itself", () => {
    const content = `[tool.poetry.dependencies]\npython = "^3.11"\nhttpx = "^0.27"\n\n[tool.poetry.group.dev.dependencies]\npytest = "^8"\n`;
    expect(parseDependencies("pyproject.toml", content)).toEqual({ runtime: ["httpx"], dev: ["pytest"] });
  });

  it("reads requirements.txt, ignoring comments, options and version pins", () => {
    const content = "# web\nflask>=3.0\n-r base.txt\nrequests[socks]==2.32 ; python_version>'3'\n\n";
    expect(parseDependencies("requirements.txt", content).runtime).toEqual(["flask", "requests"]);
  });

  it("reads Cargo.toml tables", () => {
    const content = `[package]\nname = "x"\n\n[dependencies]\nserde = "1"\ntokio = { version = "1" }\n\n[dev-dependencies]\ninsta = "1"\n`;
    expect(parseDependencies("Cargo.toml", content)).toEqual({ runtime: ["serde", "tokio"], dev: ["insta"] });
  });

  it("reads go.mod require blocks and single requires", () => {
    const content = `module x\n\nrequire github.com/a/b v1.0.0\n\nrequire (\n\tgithub.com/c/d v2.0.0\n\t// comment\n)\n`;
    expect(parseDependencies("go.mod", content).runtime.sort()).toEqual(["github.com/a/b", "github.com/c/d"]);
  });

  it("ignores manifests it does not know", () => {
    expect(parseDependencies("Gemfile", "gem 'rails'")).toEqual({ runtime: [], dev: [] });
  });
});
