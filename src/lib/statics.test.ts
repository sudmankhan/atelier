import { describe, expect, it } from "vitest";
import { defaultComZ, labRearPivotZ, leverArm, tippingStatics } from "./statics";
import { BLANK } from "./lab";
import { computeGeometry } from "./chair/geometry";
import { BASELINE } from "./chair/params";

const ok = (r: ReturnType<typeof tippingStatics>) => { if (!r.ok) throw new Error(r.error); return r; };

describe("static tipping", () => {
  it("acceptance case", () => {
    const r = ok(tippingStatics({ W: 900, d: 0.15, F: 250, h: 0.8 }));
    expect(r.gravityMoment).toBeCloseTo(135);
    expect(r.pushMoment).toBeCloseTo(200);
    expect(r.net).toBeCloseTo(-65);
    expect(r.thresholdF).toBeCloseTo(168.75);
    expect(r.status).toBe("tips");
  });
  it("d < 0 with F = 0 gives negative net", () => {
    const r = ok(tippingStatics({ W: 900, d: -0.05, F: 0, h: 0.8 }));
    expect(r.net).toBeLessThan(0);
    expect(r.status).toBe("tips");
    expect(r.thresholdF).toBeNull();
  });
  it("d = 0 gives zero restoring moment and zero threshold", () => {
    const r = ok(tippingStatics({ W: 900, d: 0, F: 0, h: 0.8 }));
    expect(r.gravityMoment).toBe(0);
    expect(r.thresholdF).toBe(0);
  });
  it("h = 0 has no overturning moment", () => {
    const r = ok(tippingStatics({ W: 900, d: 0.1, F: 250, h: 0 }));
    expect(r.pushMoment).toBe(0);
    expect(r.thresholdF).toBeNull();
  });
  it("rejects invalid inputs", () => {
    expect(tippingStatics({ W: NaN, d: 0.1, F: 1, h: 1 }).ok).toBe(false);
    expect(tippingStatics({ W: 900, d: Infinity, F: 1, h: 1 }).ok).toBe(false);
    expect(tippingStatics({ W: -1, d: 0.1, F: 1, h: 1 }).ok).toBe(false);
    expect(tippingStatics({ W: 900, d: 0.1, F: 1, h: -1 }).ok).toBe(false);
    expect(tippingStatics({ W: 900, d: 0.1, F: -1, h: 1 }).ok).toBe(false);
  });
  it("kangaroo: larger rear support extension increases restoring moment", () => {
    const g1 = computeGeometry({ ...BASELINE, supportSpacing: 15 });
    const g2 = computeGeometry({ ...BASELINE, supportSpacing: 30 });
    const com = defaultComZ(g1.seatRear.z, g1.seatFront.z);
    const m = (z: number) => ok(tippingStatics({ W: 900, d: leverArm(com, z), F: 250, h: 0.8 })).gravityMoment;
    expect(m(g2.rearFoot.z)).toBeGreaterThan(m(g1.rearFoot.z));
  });
  it("lab: more rear splay increases restoring moment", () => {
    const com = defaultComZ(-BLANK.seatDepth / 2, BLANK.seatDepth / 2);
    const m = (splay: number) => ok(tippingStatics({ W: 900, d: leverArm(com, labRearPivotZ({ ...BLANK, base: "splayed", splay })), F: 250, h: 0.8 })).gravityMoment;
    expect(m(12)).toBeGreaterThan(m(2));
  });
  it("sign convention: default CoM is forward of the rear pivot", () => {
    const g = computeGeometry(BASELINE);
    expect(leverArm(defaultComZ(g.seatRear.z, g.seatFront.z), g.rearFoot.z)).toBeGreaterThan(0);
    expect(leverArm(defaultComZ(-BLANK.seatDepth / 2, BLANK.seatDepth / 2), labRearPivotZ(BLANK))).toBeGreaterThan(0);
  });
});
