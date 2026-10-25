import { describe, expect, it } from "vitest";
import { FurnitureSchema, RAW_FILES, SPECS, specById } from "./spec";
import { specAsLab, specBoardFeet, specCutList, specGeometry, specIssues, specLumber, specMass, specResults, specTipping } from "./engine";
import { evaluateOps } from "../assembly";
import { tippingStatics } from "../statics";

const spec = specById("nordic-ladder-back")!;

describe("furniture from a data file", () => {
  it("every file in the registry parses and passes its own checks", () => {
    expect(SPECS.length).toBe(Object.keys(RAW_FILES).length);
    for (const s of SPECS) expect(specIssues(s)).toEqual([]);
  });

  it("rejects a broken file", () => {
    const bad = JSON.parse(JSON.stringify(RAW_FILES["nordic-ladder-back"]!.data));
    bad.steps[1].needs = [{ id: "nope", why: "x" }];
    expect(FurnitureSchema.safeParse(bad).success).toBe(false);
    const noSeat = JSON.parse(JSON.stringify(RAW_FILES["nordic-ladder-back"]!.data));
    noSeat.parts = noSeat.parts.filter((p: { role: string }) => p.role !== "seat");
    expect(FurnitureSchema.safeParse(noSeat).success).toBe(false);
  });

  it("geometry is read off the file's coordinates", () => {
    const g = specGeometry(spec);
    expect(g.seatTop).toBe(45);
    expect(g.top).toBe(88);
    expect(g.hasStretchers).toBe(true);
    expect(g.recline).toBeCloseTo(2.9, 1);
  });

  it("cut list has one row per part with shop allowances", () => {
    const cuts = specCutList(spec);
    expect(cuts.length).toBe(spec.parts.length);
    const leg = cuts.find((c) => c.part === "Front leg")!;
    expect(leg.qty).toBe(2);
    expect(leg.rough).toEqual({ l: 45.5, w: 4.1, t: 4.1 });
    expect(specBoardFeet(spec)).toBeGreaterThan(3);
  });

  it("weight comes from part volumes × USDA density (ash, 672 kg/m³)", () => {
    const vol = spec.parts.reduce((s, p) => s + p.size[0] * p.size[1] * p.size[2] * ((p.sticks?.length ?? 0) + (p.boards?.length ?? 0)), 0);
    expect(specMass(spec).kg).toBeCloseTo((vol * 672) / 1e6, 1);
  });

  it("lean-back test uses the same statics as the rest of the app", () => {
    const t = specTipping(spec);
    expect(t.result.ok).toBe(true);
    // independent recomputation of the threshold from the reported moments
    expect(t.result.thresholdF).toBeCloseTo(t.result.gravityMoment / (t.pushHeightCm / 100), 6);
    expect(tippingStatics({ W: 1000, d: 0.1, F: 250, h: 0.88 }).ok).toBe(true);
  });

  it("joint, part and comfort checks reuse the Lab rules", () => {
    const lab = specAsLab(spec);
    expect(lab.joint).toBe("mt");
    expect(lab.stretchers).toBe(true);
    const areas = specResults(spec).map((r) => r.area);
    expect(areas[0]).toBe("Stability");
    expect(areas).toContain("Joints");
    expect(areas).toContain("Comfort");
  });

  it("all pieces fit on the sample boards", () => {
    const a = specLumber(spec);
    expect(a.unallocated).toEqual([]);
    expect(a.placements.length).toBe(specCutList(spec).reduce((n, c) => n + c.qty, 0));
  });

  it("the file's build order is checkable", () => {
    expect(evaluateOps(spec.steps, spec.steps.map((s) => s.id))).toEqual([]);
    const wrong = ["finish", ...spec.steps.map((s) => s.id).filter((id) => id !== "finish")];
    expect(evaluateOps(spec.steps, wrong).length).toBeGreaterThan(0);
  });
});
