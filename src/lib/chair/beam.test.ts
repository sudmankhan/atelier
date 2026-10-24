import { describe, expect, it } from "vitest";
import { beamModelApplies, cantileverEndLoad, woodE_Pa } from "./beam";

const base = { F: 100, L: 0.4, b: 0.04, h: 0.04, E: 10_000_000_000 };
const run = (o = {}) => { const r = cantileverEndLoad({ ...base, ...o }); if (!r.ok) throw new Error(r.error); return r; };

describe("cantilever beam", () => {
  it("verification case", () => {
    const r = run();
    expect(r.M).toBeCloseTo(40);
    expect(r.sigma).toBeCloseTo(3_750_000, 3);
    expect(r.delta).toBeCloseTo(0.001, 9);
  });
  it("doubling force doubles moment, stress and deflection", () => {
    const a = run(), b = run({ F: 200 });
    expect(b.M / a.M).toBeCloseTo(2);
    expect(b.sigma / a.sigma).toBeCloseTo(2);
    expect(b.delta / a.delta).toBeCloseTo(2);
  });
  it("doubling depth cuts stress 4x and deflection 8x", () => {
    const a = run(), b = run({ h: 0.08 });
    expect(a.sigma / b.sigma).toBeCloseTo(4);
    expect(a.delta / b.delta).toBeCloseTo(8);
  });
  it("rejects invalid input", () => {
    expect(cantileverEndLoad({ ...base, h: 0 }).ok).toBe(false);
    expect(cantileverEndLoad({ ...base, E: NaN }).ok).toBe(false);
    expect(cantileverEndLoad({ ...base, F: -1 }).ok).toBe(false);
  });
  it("refuses non-straight members", () => {
    expect(beamModelApplies("straight").ok).toBe(true);
    expect(beamModelApplies("curved").ok).toBe(false);
    expect(beamModelApplies("joint-system").ok).toBe(false);
  });
  it("uses USDA E at 12% MC", () => {
    expect(woodE_Pa("oak")).toBeCloseTo(1.78 * 6894.76 * 1e6, -3);
    expect(woodE_Pa("pine", "green")).toBeCloseTo(0.99 * 6894.76 * 1e6, -3);
  });
});
