import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { evaluateRequirements } from "./requirements";

describe("requirements specification engine", () => {
  it("evaluates the Kangaroo baseline against the lounge brief", () => {
    const results = evaluateRequirements("lounge", "kangaroo", BASELINE);
    expect(
      results
        .filter((result) => result.spec.kind === "range")
        .every((result) => result.status === "meets"),
    ).toBe(true);
    expect(results.filter((result) => result.status === "pending-test")).toHaveLength(2);
  });

  it("shows why the Kangaroo baseline is outside the dining brief", () => {
    const outside = evaluateRequirements("dining", "kangaroo", BASELINE).filter(
      (result) => result.status === "outside",
    );
    expect(outside.map((result) => result.spec.id)).toEqual([
      "dining-seat-height",
      "dining-seat-depth",
      "dining-back-angle",
    ]);
    expect(outside[0]?.evidence).toContain("below 40–47cm");
  });

  it("evaluates the Japanese baseline using only applicable dimensional requirements", () => {
    const results = evaluateRequirements("dining", "japanese", J_BASELINE);
    const ranges = results.filter((result) => result.spec.kind === "range");
    expect(ranges).toHaveLength(3);
    expect(ranges.every((result) => result.status === "meets")).toBe(true);
  });

  it("keeps physical product tests pending instead of inferring a pass", () => {
    const tests = evaluateRequirements("dining", "japanese", J_BASELINE).filter(
      (result) => result.spec.kind === "physical-test",
    );
    expect(tests).toHaveLength(2);
    expect(
      tests.every((result) => result.status === "pending-test" && result.actual === null),
    ).toBe(true);
  });
});
