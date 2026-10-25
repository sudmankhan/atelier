import { describe, expect, it } from "vitest";
import { BLANK, evaluateLab, labTipping, type LabDesign } from "./lab";
import { blockingLocks, findFixes } from "./compromise";
import { START } from "./brief";

const fails = (d: LabDesign, u = {}) => evaluateLab(d, u).filter((r) => r.level === "bad");
const CASES: [string, LabDesign, object][] = [
  ["tall patio chair, straight legs", { ...START, splay: 0, seatHeight: 47, backHeight: 46 }, { setting: "outdoor" }],
  ["laid-back reading chair", { ...START, splay: 0, wood: "walnut", backAngle: 110, seatHeight: 40, seatDepth: 48 }, {}],
  ["beginner's screwed pine chair", { ...BLANK, back: "slats", backAngle: 92 }, {}],
  ["tall reclined panel back", { ...BLANK, back: "panel", joint: "mt", wood: "oak", backHeight: 65, backAngle: 115 }, {}],
];

describe("compromise options", () => {
  it("a chair that passes needs no fixes", () => {
    expect(fails(START)).toEqual([]);
    expect(findFixes(START)).toEqual([]);
  });

  for (const [name, d, u] of CASES) {
    it(`${name}: up to two different versions, each passing every test and more stable`, () => {
      expect(fails(d, u).length).toBeGreaterThan(0);
      const fixes = findFixes(d, u);
      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes.length).toBeLessThanOrEqual(2);
      for (const f of fixes) {
        expect(fails(f.design, u)).toEqual([]);
        expect(f.tipsAt).toBeGreaterThan(Math.round(labTipping(d).result.thresholdF ?? 0));
        expect(f.changes.length).toBeGreaterThan(0);
        expect(f.tradeoff).toMatch(/^You give up|^Nothing/);
      }
      if (fixes.length === 2) expect(JSON.stringify(fixes[0]!.design)).not.toBe(JSON.stringify(fixes[1]!.design));
    });
  }

  it("respects 'keep my recline': the back angle is never touched", () => {
    const d: LabDesign = { ...START, splay: 0, wood: "walnut", backAngle: 110, seatHeight: 40, seatDepth: 48 };
    const fixes = findFixes(d, {}, ["backAngle"]);
    expect(fixes.length).toBeGreaterThan(0);
    for (const f of fixes) expect(f.design.backAngle).toBe(d.backAngle);
  });

  it("says which lock blocks a fix when the locked setting is itself the problem", () => {
    const d = { ...BLANK, back: "slats" as const, backAngle: 92 };
    expect(findFixes(d, {}, ["backAngle"])).toEqual([]);
    expect(blockingLocks(d, {}, ["backAngle"])).toEqual(["backAngle"]);
  });

  it("is fast enough to run on every change", () => {
    const t = performance.now();
    for (const [, d, u] of CASES) findFixes(d, u);
    expect(performance.now() - t).toBeLessThan(500);
  });
});

describe("keep my legs", () => {
  it("keeps straight legs straight, and still finds a fix", () => {
    const d: LabDesign = { ...START, splay: 0, seatHeight: 47, backHeight: 46 };
    expect(fails(d, { setting: "outdoor" }).length).toBeGreaterThan(0);
    const fixes = findFixes(d, { setting: "outdoor" }, ["base"]);
    expect(fixes.length).toBeGreaterThan(0);
    for (const f of fixes) {
      expect(f.design.splay).toBe(0);
      expect(f.design.base).toBe(d.base);
      expect(fails(f.design, { setting: "outdoor" })).toEqual([]);
    }
  });
});
