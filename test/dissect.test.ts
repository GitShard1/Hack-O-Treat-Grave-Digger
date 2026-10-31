import { describe, expect, it } from "vitest";
import { dissect, SIGNATURE_RULES } from "@/components/dissect";
import { savedExamples } from "@/lib/examples";

const [spincube, mayhem, cataclysm] = savedExamples;
const row = (report: ReturnType<typeof dissect>, key: string) => report?.rows.find((r) => r.key === key)?.value;

describe("dissect", () => {
  it("explains spincube's filament with the file, revision and a numbered excerpt", () => {
    const report = dissect(spincube!);
    expect(report?.motif).toBe("filament");
    expect(row(report, "detector")).toBe("Python statement scan of the file we read");
    expect(row(report, "source")).toBe("cube.py @ fd84453 (7,594 characters, 53 lines)");
    expect(report?.rows.map((r) => r.value)).toContain("ctypes: calls native C libraries directly");
    expect(report?.links[0]?.url).toBe(
      "https://github.com/EricZ6365/spincube/blob/fd8445315d238201ad722b6d7a88a92de344833f/cube.py",
    );
    expect(report?.excerpt?.lines[0]).toMatch(/^1\| \(lambda/);
    expect(report?.lookFor).toContain("cube.py");
  });

  it("links MAYHEM's limbs to their real folder", () => {
    const report = dissect(mayhem!);
    expect(report?.motif).toBe("rig");
    expect(report?.links.map((l) => l.url)).toContain(
      "https://github.com/Roblox-MAYHEM/Game/tree/7eb0ca0119eda9baba067c239cfe7e19f67cacbb/ServerScriptService/Weapon/Weapons",
    );
  });

  it("links Cataclysm's data swarm to its biggest folder", () => {
    const report = dissect(cataclysm!);
    expect(report?.motif).toBe("swarm");
    expect(report?.links.map((l) => l.url)).toContain(
      // GitHub's canonical owner/name casing and the commit inspected, as saved with the example.
      `${cataclysm!.facts.url}/tree/${cataclysm!.facts.facts.find((f) => f.id === "f_tree_revision")?.value}/data/mods`,
    );
  });

  it("marks the chosen rule and the ones that did not win", () => {
    const rules = dissect(cataclysm!)?.rules ?? [];
    expect(rules).toHaveLength(SIGNATURE_RULES.length);
    expect(rules.filter((r) => r.state === "chosen").map((r) => r.factId)).toEqual(["f_tree_types"]);
    expect(rules.find((r) => r.factId === "f_code_one_expression")?.state).toBe("absent");
    expect(rules.find((r) => r.factId === "f_tree_folder")?.state).toBe("found");
    // MAYHEM has a file-type fact but is not data-heavy, so that earlier rule is below threshold.
    expect(dissect(mayhem!)?.rules.find((r) => r.factId === "f_tree_types")?.state).toBe("skipped");
  });

  it("falls back to HEAD and no excerpt when the facts are missing", () => {
    const facts = spincube!.facts.facts.filter((f) => f.id !== "f_tree_revision" && f.id !== "f_code_excerpt");
    const report = dissect({ ...spincube!, facts: { ...spincube!.facts, facts } });
    expect(report?.links[0]?.url).toContain("/blob/HEAD/cube.py");
    expect(report?.excerpt).toBeNull();
  });
});
