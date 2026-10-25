import { describe, expect, it } from "vitest";
import { BLANK, evaluateLab, labTipping, type LabDesign } from "../lab";
import { FurnitureSchema, specById } from "./spec";
import { resizeSpec, specCutList, specDims, specGeometry, specIssues, specLumber, specResults, specTipping } from "./engine";
import { labToSpec } from "./fromLab";
import { evaluateOps } from "../assembly";

const nordic = specById("nordic-ladder-back")!;

describe("resizing a file chair", () => {
  it("starts from the file's own sizes and ranges", () => {
    const { base, ranges } = specDims(nordic);
    expect(base).toEqual({ seatHeight: 45, seatWidth: 42, seatDepth: 40, backHeight: 43 });
    expect(ranges.seatHeight).toEqual([40, 50]);
  });

  it("no change returns the same file", () => {
    expect(resizeSpec(nordic, specDims(nordic).base)).toBe(nordic);
  });

  it("hits the asked-for sizes and keeps every part's cut length consistent", () => {
    for (const want of [
      { seatHeight: 50, seatWidth: 50, seatDepth: 46, backHeight: 55 },
      { seatHeight: 40, seatWidth: 38, seatDepth: 36, backHeight: 35 },
      { seatHeight: 47 },
    ]) {
      const r = resizeSpec(nordic, want);
      const g = specGeometry(r);
      if (want.seatHeight) expect(g.seatTop).toBeCloseTo(want.seatHeight, 1);
      if ("seatWidth" in want) expect(g.seatWidth).toBe(want.seatWidth);
      if ("backHeight" in want) expect(g.top - g.seatTop).toBeCloseTo(want.backHeight!, 1);
      expect(specIssues(r)).toEqual([]);
      expect(FurnitureSchema.safeParse(r).success).toBe(true);
    }
  });

  it("legs get longer by exactly the seat-height change", () => {
    const r = resizeSpec(nordic, { seatHeight: 50 });
    const leg = (s: typeof nordic) => specCutList(s).find((c) => c.part === "Front leg")!.finished.l;
    expect(leg(r) - leg(nordic)).toBeCloseTo(5, 1);
  });

  it("clamps to the file's range", () => {
    expect(specGeometry(resizeSpec(nordic, { seatHeight: 80 })).seatTop).toBe(50);
  });

  it("tests respond to the new size: a taller back levers the chair over sooner", () => {
    const tall = specTipping(resizeSpec(nordic, { backHeight: 55 })).result.thresholdF!;
    const short = specTipping(resizeSpec(nordic, { backHeight: 35 })).result.thresholdF!;
    expect(tall).toBeLessThan(short);
  });
});

describe("saving a Build-your-own design as a file", () => {
  const designs: LabDesign[] = [
    BLANK,
    { ...BLANK, back: "slats", joint: "mt", wood: "oak", stretchers: true },
    { ...BLANK, base: "splayed", back: "spindles", joint: "wedged", wood: "ash", splay: 8 },
    { ...BLANK, base: "sled", back: "panel", joint: "dowel", wood: "walnut" },
    { ...BLANK, base: "zframe", back: "slats", joint: "mt", backAngle: 110 },
  ];

  it("writes a valid file for every base and back", () => {
    for (const d of designs) {
      const s = labToSpec(d, "Test");
      expect(specIssues(s)).toEqual([]);
      const g = specGeometry(s);
      expect(g.seatTop).toBe(d.seatHeight);
      expect(g.seatWidth).toBe(d.seatWidth);
      if (d.back !== "none") {
        expect(g.recline).toBeCloseTo(d.backAngle - 90, 0);
        expect(g.top - g.seatTop).toBeCloseTo(d.backHeight * Math.cos(((d.backAngle - 90) * Math.PI) / 180), 0);
      }
      expect(evaluateOps(s.steps, s.steps.map((x) => x.id))).toEqual([]);
      expect(specLumber(s).placements.length).toBeGreaterThan(0);
    }
  });

  it("the saved chair gets the same joint and comfort verdicts as in the Lab", () => {
    for (const d of designs) {
      const pick = (rs: { area: string; level: string; title: string }[]) => rs.filter((r) => r.area !== "Stability").map((r) => `${r.area}:${r.level}`);
      expect(pick(specResults(labToSpec(d, "x")))).toEqual(pick(evaluateLab(d)));
    }
  });

  it("the lean-back test gives the Lab's answer (same weight, feet and push height)", () => {
    for (const d of designs) {
      const lab = labTipping(d).result.thresholdF!;
      const file = specTipping(labToSpec(d, "x")).result.thresholdF!;
      expect(Math.abs(file - lab) / lab).toBeLessThan(0.02);
    }
  });

  it("saved designs can be resized too", () => {
    const s = labToSpec(designs[1]!, "x");
    const r = resizeSpec(s, { seatHeight: 50, seatWidth: 50 });
    expect(specGeometry(r).seatTop).toBe(50);
    expect(specIssues(r)).toEqual([]);
  });
});
