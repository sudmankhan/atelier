import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { DEFAULT_SITTER, evaluateSitterFit } from "./fit";

describe("sitter fit checks", () => {
  it("detects a seat higher than the sitter's knee", () => {
    const results = evaluateSitterFit("kangaroo", { ...BASELINE, seatHeight: 48 }, DEFAULT_SITTER);
    expect(results.find((result) => result.id === "seatHeight")?.level).toBe("conflict");
  });

  it("detects a seat edge that reaches the knee crease", () => {
    const results = evaluateSitterFit("kangaroo", { ...BASELINE, seatDepth: 50 }, DEFAULT_SITTER);
    expect(results.find((result) => result.id === "seatDepth")?.level).toBe("conflict");
  });

  it("detects insufficient hip clearance", () => {
    const results = evaluateSitterFit(
      "kangaroo",
      { ...BASELINE, seatWidth: 44 },
      { ...DEFAULT_SITTER, hipBreadth: 42 },
    );
    expect(results.find((result) => result.id === "seatWidth")?.level).toBe("conflict");
  });
});
