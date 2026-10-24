import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { compound, japaneseShop, kangarooShop, roughOf } from "./shop";

describe("shop sheet", () => {
  it("rough stock = finished + 2.5 length, +0.6 width, +0.6 thickness", () => {
    expect(roughOf({ l: 50, w: 5, t: 3.8 })).toEqual({ l: 52.5, w: 5.6, t: 4.4 });
  });
  it("equal 8° splays drill at ≈11.2° on a 45° sightline", () => {
    expect(compound(8, 8)).toEqual({ resultant: 11.2, sightline: 45 });
  });
  it("zero splay drills straight", () => {
    expect(compound(0, 0).resultant).toBe(0);
  });
  it("spindle count drives the cut list quantity", () => {
    expect(japaneseShop({ ...J_BASELINE, spindles: 6 }).cuts.find((c) => c.part === "Spindle")!.qty).toBe(6);
  });
  it("wider Kangaroo seat lengthens the stretchers", () => {
    const a = kangarooShop(BASELINE).cuts.find((c) => c.part === "Stretcher rail")!.finished.l;
    const b = kangarooShop({ ...BASELINE, seatWidth: BASELINE.seatWidth + 10 }).cuts.find((c) => c.part === "Stretcher rail")!.finished.l;
    expect(b - a).toBeCloseTo(10, 0);
  });
});
