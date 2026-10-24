import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { japaneseStress, kangarooStress } from "./stress";
import { levelOfUtilisation } from "./jointStress";

describe("stress overlay", () => {
  it("original designs compare to themselves at ratio 1", () => {
    for (const pin of [...kangarooStress(BASELINE).pins, ...japaneseStress(J_BASELINE).pins]) expect(pin.ratio).toBe(1);
  });
  it("levels come from stress ÷ reference stress, not from the change vs the original", () => {
    for (const pin of [...kangarooStress(BASELINE).pins, ...japaneseStress(J_BASELINE).pins]) {
      expect(pin.level).toBe(levelOfUtilisation(pin.stressMPa / pin.refMPa));
      expect(pin.utilisation).toBeCloseTo(pin.stressMPa / pin.refMPa, 1);
    }
  });
  it("every Kangaroo pin responds to some slider", () => {
    const base = kangarooStress(BASELINE).pins;
    const moved = [
      kangarooStress({ ...BASELINE, seatHeight: 46 }),
      kangarooStress({ ...BASELINE, seatWidth: 64 }),
      kangarooStress({ ...BASELINE, backAngle: 125 }),
      kangarooStress({ ...BASELINE, supportSpacing: 30 }),
    ];
    for (const pin of base) expect(moved.some((r) => r.pins.find((x) => x.id === pin.id)!.moment !== pin.moment)).toBe(true);
  });
  it("taller Kangaroo seat raises racking stress on the rails", () => {
    const a = kangarooStress(BASELINE).pins.find((p) => p.id === "railJoints")!;
    const b = kangarooStress({ ...BASELINE, seatHeight: 48 }).pins.find((p) => p.id === "railJoints")!;
    expect(b.stressMPa).toBeGreaterThan(a.stressMPa);
  });
  it("weaker wood lowers the reference stress", () => {
    const teak = kangarooStress(BASELINE).pins[0]!;
    const walnut = kangarooStress({ ...BASELINE, wood: "walnut" }).pins[0]!;
    expect(walnut.refMPa).toBeLessThanOrEqual(teak.refMPa);
  });
  it("deep back bow flags short grain past the 1:12 rule", () => {
    const g = kangarooStress({ ...BASELINE, backCurve: 1 }).grain.find((x) => x.id === "backPost")!;
    expect(g.level).toBe("high");
  });
  it("Japanese seat movement uses Eq. 13–2 with the stand-in white oak", () => {
    const r = japaneseStress({ ...J_BASELINE, seatDepth: 44 });
    expect(r.wood.proxy).toBe(true);
    expect(r.movementMm).toBe(6.6);
  });
});
