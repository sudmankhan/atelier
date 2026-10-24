import { describe, expect, it } from "vitest";
import { calculatedObservations, chairTipping } from "./calculated";
import { kangarooStress } from "./stress";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";

describe("mentor calculated context", () => {
  it("quotes every stress pin, tipping and the load assumption", () => {
    const lines = calculatedObservations("kangaroo", BASELINE);
    expect(lines[0]).toMatch(/^\[ASSUMPTION\] Assumed loads/);
    expect(lines.filter((l) => l.startsWith("[CALCULATED]") && l.includes("MPa"))).toHaveLength(kangarooStress(BASELINE).pins.length);
    expect(lines.some((l) => l.includes("Tipping"))).toBe(true);
  });
  it("flags the oak stand-in for the Japanese chair and includes seat movement", () => {
    const lines = calculatedObservations("japanese", J_BASELINE);
    expect(lines.some((l) => l.startsWith("[ASSUMPTION]") && /oak/i.test(l))).toBe(true);
    expect(lines.some((l) => l.includes("Seasonal seat movement"))).toBe(true);
  });
  it("the Kangaroo's long rear foot holds the 250 N lean; the modestly splayed Japanese chair tips between 125 and 250 N", () => {
    expect(chairTipping("kangaroo", BASELINE).r).toMatchObject({ ok: true, status: "stays" });
    const j = chairTipping("japanese", J_BASELINE).r;
    expect(j.ok && j.thresholdF).toBeGreaterThan(125);
    expect(j.ok && j.thresholdF).toBeLessThan(250);
  });
});
