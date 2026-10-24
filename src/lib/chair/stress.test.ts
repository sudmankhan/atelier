import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { japaneseStress, kangarooStress, levelOf } from "./stress";

describe("stress overlay", () => {
  it("original designs read as baseline (ratio 1, ok)", () => {
    for (const pin of [...kangarooStress(BASELINE).pins, ...japaneseStress(J_BASELINE).pins]) {
      expect(pin.ratio).toBe(1);
      expect(pin.level).toBe("ok");
    }
  });
  it("levels: <1.1 ok, <1.3 watch, else high", () => {
    expect(levelOf(1.05)).toBe("ok");
    expect(levelOf(1.2)).toBe("watch");
    expect(levelOf(1.4)).toBe("high");
  });
  it("taller Kangaroo seat raises racking on the rails", () => {
    const r = kangarooStress({ ...BASELINE, seatHeight: 48 }).pins.find((p) => p.id === "railJoints")!;
    expect(r.ratio).toBeGreaterThan(1.3);
  });
  it("deep back bow flags short grain past the 1:12 rule", () => {
    const g = kangarooStress({ ...BASELINE, backCurve: 1 }).grain.find((x) => x.id === "backPost")!;
    expect(g.level).toBe("high");
  });
  it("Japanese seat moves ~1 mm per 10 cm of depth", () => {
    expect(japaneseStress({ ...J_BASELINE, seatDepth: 44 }).movementMm).toBe(4.4);
  });
});
