import { describe, expect, it } from "vitest";
import { resolveParams } from "./paramDictionary";
import { checkAnswer, detectClaims, mandatoryFacts } from "./claims";

describe("parameter resolution", () => {
  it("support spacing is the rear kick-back", () => {
    const r = resolveParams("What happens when I increase support spacing?", "kangaroo");
    expect(r.kind).toBe("resolved");
    if (r.kind !== "resolved") return;
    expect(r.params.map((p) => p.key)).toEqual(["supportSpacing"]);
    expect(r.params[0]!.meaning).toMatch(/kicks back/);
    expect(r.params[0]!.calculation).toMatch(/tipping/);
  });
  it("rail spacing is not a parameter and is not mapped to support spacing", () => {
    const r = resolveParams("What happens when I increase rail spacing?", "kangaroo");
    expect(r.kind).toBe("unknown");
  });
  it("backrest length is ambiguous on the Kangaroo", () => {
    const r = resolveParams("How does increasing the backrest length affect bending?", "kangaroo");
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") expect(r.options.map((o) => o.key)).toEqual(["backAngle", "backCurve"]);
  });
  it("backrest length is back height on the Japanese chair", () => {
    const r = resolveParams("How does increasing the backrest length affect bending?", "japanese");
    expect(r.kind === "resolved" && r.params[0]!.key).toBe("backHeight");
  });
});

describe("claim guardrails", () => {
  it("300 pounds triggers the capacity limitation", () => {
    const k = detectClaims("Will this chair support 300 pounds?");
    expect(k).toContain("capacity");
    expect(mandatoryFacts(k, "kangaroo").join(" ")).toMatch(/no validated load capacity/);
  });
  it("structural safety triggers the safety limitation", () => {
    expect(detectClaims("Is this chair structurally safe?")).toContain("safety");
  });
  it("bending on a curved back says the beam model does not apply", () => {
    const k = detectClaims("How does increasing the backrest length affect bending?");
    expect(mandatoryFacts(k, "kangaroo").join(" ")).toMatch(/does not apply/);
  });
  it("flags overclaims and invented numbers", () => {
    expect(checkAnswer("The rail will fail under load.", "").overclaim).toBe(true);
    expect(checkAnswer("Stress reaches 47 MPa.", "seatHeight 36").inventedNumbers).toEqual(["47"]);
    expect(checkAnswer("Seat height 36 is fine.", "seatHeight 36")).toEqual({ overclaim: false, inventedNumbers: [] });
  });
});
