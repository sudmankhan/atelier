import { describe, expect, it } from "vitest";
import { J_BASELINE } from "./params";
import { computeJapanese } from "./geometry";
import { computeJapaneseConsequences, J_SPLAY_TOLERANCE_DEG } from "./consequences";

describe("japanese chair geometry", () => {
  it("spaces spindles evenly across the seat", () => {
    const g = computeJapanese({ ...J_BASELINE, spindles: 4, seatWidth: 52 });
    expect(g.spindleSpacing).toBeCloseTo((52 - 12) / 5, 5);
  });

  it("widens the footprint when legs splay more", () => {
    const a = computeJapanese({ ...J_BASELINE, legSplay: 0 });
    const b = computeJapanese({ ...J_BASELINE, legSplay: 12 });
    expect(b.footprintWidth).toBeGreaterThan(a.footprintWidth);
    expect(b.footprintDepth).toBeGreaterThan(a.footprintDepth);
  });
});

describe("japanese chair consequences", () => {
  it("flags leg joints when splay changes beyond tolerance", () => {
    const c = computeJapaneseConsequences({ ...J_BASELINE, legSplay: J_BASELINE.legSplay + J_SPLAY_TOLERANCE_DEG + 1 });
    expect(c.misaligned).toContain("legJoints");
  });

  it("does not flag leg joints within tolerance", () => {
    const c = computeJapaneseConsequences({ ...J_BASELINE, legSplay: J_BASELINE.legSplay + 4 });
    expect(c.misaligned).not.toContain("legJoints");
  });

  it("flags arm joints when arm height changes the slope sharply", () => {
    const c = computeJapaneseConsequences({ ...J_BASELINE, armHeight: 30 });
    expect(c.misaligned).toContain("armJoints");
  });

  it("reports nothing changed at baseline", () => {
    const c = computeJapaneseConsequences(J_BASELINE);
    expect(c.changed).toHaveLength(0);
    expect(c.geometry).toHaveLength(0);
    expect(c.misaligned).toHaveLength(0);
  });
});
