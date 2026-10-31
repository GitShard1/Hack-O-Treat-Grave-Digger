import { describe, expect, it } from "vitest";
import type { Character, Fact } from "@/lib/contract";
import { exampleResult } from "@/lib/examples";
import { buildFacts, measureRepo } from "@/lib/facts";
import { fallbackCharacter } from "@/lib/fallback";
import { signatureOf } from "@/components/Monster/signature";
import { NOW, mayhemSnapshot, msSnapshot, spincubeSnapshot } from "./helpers";

const leading = (fact: Fact, extra: Fact[] = []) => {
  const character: Character = {
    ...exampleResult.character,
    traits: [{ ...exampleResult.character.traits[0], factId: fact.id }, exampleResult.character.traits[1], exampleResult.character.traits[2]],
  };
  return signatureOf(character, [fact, ...extra]);
};

const real = (snapshot: typeof spincubeSnapshot) => {
  const facts = buildFacts(snapshot, NOW);
  return signatureOf(fallbackCharacter(facts, measureRepo(snapshot, NOW)), facts.facts);
};

describe("signatureOf", () => {
  it("gives the demo repos their own parts", () => {
    expect(real(spincubeSnapshot)).toMatchObject({ motif: "filament", cage: true }); // "a spinning cube render in wireframe"
    expect(real(mayhemSnapshot)?.motif).toBe("rig");
    expect(real(msSnapshot)?.motif).toBe("glyphs");
  });

  it("labels limbs with the real file names", () => {
    expect(real(mayhemSnapshot)?.labels).toEqual(["BaseballBat", "GreatSword", "Boots", "ClassicSword", "DBShotgun", "PumpShotgun"]);
  });

  it("labels data tablets with the file types", () => {
    const s = leading({ id: "f_tree_types", label: "File types", value: "64% .json, 13% .gz, 8% .cpp" });
    expect(s).toMatchObject({ motif: "swarm", labels: [".json", ".gz", ".cpp"] });
  });

  it("is stable for the same facts", () => {
    expect(real(mayhemSnapshot)?.seed).toBe(real(mayhemSnapshot)?.seed);
  });

  it("has none when the first trait cites a missing fact", () => {
    expect(signatureOf(exampleResult.character, [])).toBeNull();
  });
});
