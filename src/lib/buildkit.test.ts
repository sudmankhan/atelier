import { describe, expect, it } from "vitest";
import { blueprintDims, cost, shoppingList, PRICE_PER_BF } from "./buildkit";
import { START } from "./brief";
import { BLANK, type LabDesign } from "./lab";
import { labToSpec } from "./furniture/fromLab";
import { specCutList } from "./furniture/engine";

const designs: LabDesign[] = [
  START,
  { ...START, base: "zframe", splay: 0, back: "panel", wood: "walnut" },
  { ...START, base: "splayed", back: "spindles", joint: "wedged", splay: 10 },
  { ...START, base: "sled", splay: 0 },
  { ...BLANK },
];

describe("blueprint dimensions", () => {
  it("match the design", () => {
    const b = blueprintDims(START);
    expect(b.seatHeight).toBe(START.seatHeight);
    expect(b.seatWidth).toBe(START.seatWidth);
    expect(b.overallHeight).toBeGreaterThan(START.seatHeight + 30);
    expect(b.footprintWidth).toBeGreaterThan(START.seatWidth); // splayed 8°
    expect(b.footprintDepth).toBeGreaterThan(START.seatDepth);
  });
  it("a stool's overall height is its seat height", () => {
    expect(blueprintDims(BLANK).overallHeight).toBe(BLANK.seatHeight);
    expect(blueprintDims(BLANK).backAngle).toBeNull();
  });
});

describe("what to buy", () => {
  for (const d of designs) {
    it(`${d.base}/${d.back}: every part fits on the boards bought, and you buy more wood than the parts use`, () => {
      const s = shoppingList(d);
      expect(s.unplaced).toEqual([]);
      expect(s.lines.length).toBeGreaterThan(0);
      expect(s.boardFeet).toBeGreaterThanOrEqual(s.partsBoardFeet);
      // and not absurdly more: under 3× the parts' own volume
      expect(s.boardFeet).toBeLessThan(s.partsBoardFeet * 3 + 2);
      const parts = new Set(specCutList(labToSpec(d, "x")).map((c) => c.part));
      expect(new Set(s.lines.flatMap((l) => l.parts))).toEqual(parts);
    });
  }
  it("a seat wider than any board is glued up from strips", () => {
    const s = shoppingList(START);
    expect(s.glueUps.map((g) => g.part)).toContain("Seat");
    expect(s.glueUps[0]!.strips).toBeGreaterThanOrEqual(2);
  });
  it("cost is board feet × price", () => {
    const s = shoppingList(START);
    expect(cost(s, PRICE_PER_BF.oak)).toBe(Math.round(s.boardFeet * 9));
  });
});
