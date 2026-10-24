import { describe, expect, it } from "vitest";
import { DEFAULT_MOISTURE, WOOD_PROPERTIES, woodValue, type WoodId } from "./woodProperties";
import { WOODS } from "../lab";

// [MOR psi, E Mpsi, MOR MPa, E MPa, 5–3b page, 5–3a page] per USDA FPL-GTR-282 Table 5–3
const EXPECT: Record<WoodId, { green: number[]; "12pct": number[] }> = {
  oak: { green: [8300, 1.25, 57.2, 8618, 11, 6], "12pct": [15200, 1.78, 104.8, 12273, 11, 6] },
  ash: { green: [9500, 1.44, 65.5, 9928, 9, 4], "12pct": [15400, 1.74, 106.2, 11997, 9, 4] },
  walnut: { green: [9500, 1.42, 65.5, 9791, 11, 6], "12pct": [14600, 1.68, 100.7, 11583, 11, 6] },
  pine: { green: [4900, 0.99, 33.8, 6826, 12, 7], "12pct": [8600, 1.24, 59.3, 8550, 12, 7] },
};

describe("USDA wood properties", () => {
  for (const id of Object.keys(EXPECT) as WoodId[]) {
    for (const mc of ["green", "12pct"] as const) {
      it(`${id} ${mc}`, () => {
        const [mor, e, morSI, eSI, pg, xpg] = EXPECT[id][mc];
        const v = WOOD_PROPERTIES[id].values[mc];
        expect(v.moisture).toBe(mc);
        expect(v.source.MOR_original).toBe(mor);
        expect(v.source.E_original).toBe(e);
        expect(v.MOR_MPa!).toBeCloseTo(morSI!, 1);
        expect(Math.abs(v.E_MPa! - eSI!)).toBeLessThan(1);
        expect(v.source.table).toBe("Table 5–3b");
        expect(v.source.pdfPage).toBe(pg);
        expect(v.source.crossCheck.pdfPage).toBe(xpg);
        expect(v.source.originalUnits).toEqual({ MOR: "lbf/in²", E: "10^6 lbf/in²" });
        expect(v.eShearCorrectionApplied).toBe(false);
        // conversion agrees with the handbook's own metric table within its rounding
        expect(Math.abs(v.MOR_MPa! * 1000 - v.source.crossCheck.MOR_kPa) / v.source.crossCheck.MOR_kPa).toBeLessThan(0.01);
        expect(Math.abs(v.E_MPa! - v.source.crossCheck.E_MPa) / v.source.crossCheck.E_MPa).toBeLessThan(0.01);
      });
    }
  }
  it("defaults to 12% MC", () => {
    expect(DEFAULT_MOISTURE).toBe("12pct");
    expect(woodValue("oak").E_MPa).toBe(WOOD_PROPERTIES.oak.values["12pct"].E_MPa);
  });
  it("covers every Lab wood id", () => {
    for (const id of Object.keys(WOODS)) expect(WOOD_PROPERTIES[id as WoodId]).toBeDefined();
  });
});
