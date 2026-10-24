import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { computeGeometry } from "./geometry";
import { computeConsequences } from "./consequences";
import { retrieveSync } from "@/lib/knowledge/retrieve";

describe("parametric chair rules", () => {
  it("rail length follows seat width", () => {
    expect(computeGeometry({ ...BASELINE, seatWidth: 60 }).railLength).toBe(60);
  });

  it("raising seat height lengthens the front leg", () => {
    const a = computeGeometry(BASELINE).frontLegLength;
    const b = computeGeometry({ ...BASELINE, seatHeight: 44 }).frontLegLength;
    expect(b).toBeGreaterThan(a);
  });

  it("baseline has no changes and no misaligned connections", () => {
    const c = computeConsequences(BASELINE);
    expect(c.changed).toEqual([]);
    expect(c.misaligned).toEqual([]);
  });

  it("a large backrest angle change flags the rear joint as misaligned", () => {
    const c = computeConsequences({ ...BASELINE, backAngle: 130 });
    expect(c.misaligned).toContain("rearJoint");
    expect(c.affectedParts).toContain("connections");
  });

  it("a small backrest change stays within joint tolerance", () => {
    expect(computeConsequences({ ...BASELINE, backAngle: 116 }).misaligned).not.toContain("rearJoint");
  });

  it("support spacing widens the footprint depth", () => {
    const c = computeConsequences({ ...BASELINE, supportSpacing: 32 });
    expect(c.current.footprintDepth - c.baseline.footprintDepth).toBeCloseTo(10, 5);
  });

  it("retrieval surfaces joinery for joint questions", () => {
    expect(retrieveSync("how is the mortise and tenon cut?").map((e) => e.id)).toContain("tenon-proportion");
  });
});
