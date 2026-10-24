import { describe, it, expect } from "vitest";
import { matchStock, yieldOf } from "./stock";
const row = (part: string, qty: number, l: number, w: number, t: number) => ({ part, qty, finished: { l, w, t }, rough: { l, w, t }, note: "" });
describe("stock matcher", () => {
  it("counts pieces along length and width with kerf", () => {
    expect(yieldOf({ l: 100, w: 12, t: 4, grainSlope: 20 }, { l: 49.8, w: 5.8, t: 4 }).n).toBe(4);
  });
  it("rejects a board that is too short", () => {
    expect(matchStock({ l: 40, w: 20, t: 5, grainSlope: 20 }, [row("Leg", 4, 45, 4.6, 4.6)])[0]!.verdict).toBe("bad");
  });
  it("blocks load-bearing parts when grain is steeper than 1:12", () => {
    expect(matchStock({ l: 100, w: 20, t: 5, grainSlope: 7 }, [row("Leg", 1, 45, 4.6, 4.6)])[0]!.verdict).toBe("bad");
  });
  it("allows non-structural parts on runout stock", () => {
    expect(matchStock({ l: 100, w: 20, t: 5, grainSlope: 7 }, [row("Seat frame end", 1, 45, 3.8, 3.6)])[0]!.verdict).toBe("good");
  });
});
