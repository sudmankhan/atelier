import { describe, expect, it } from "vitest";
import { durabilityReport, legFlexMm } from "./durability";
import { BLANK, evaluateLab } from "./lab";
import { START } from "./brief";
import { findFixes } from "./compromise";

describe("durability report", () => {
  it("a failing chair is 'not ready'", () => {
    const d = { ...BLANK, back: "slats" as const };
    expect(evaluateLab(d).some((r) => r.level === "bad")).toBe(true);
    expect(durabilityReport(d).grade).toBe("not-ready");
  });

  it("the sound starting chair is fit for use, and a fixed chair is too", () => {
    expect(durabilityReport(START).grade).not.toBe("not-ready");
    const fix = findFixes({ ...BLANK, back: "slats" })[0]!;
    expect(durabilityReport(fix.design).grade).not.toBe("not-ready");
  });

  it("never promises a number of years", () => {
    for (const d of [START, BLANK, { ...START, wood: "pine" as const }]) for (const setting of ["indoor", "outdoor"] as const) {
      const r = durabilityReport(d, { setting });
      const all = [...r.facts.map((f) => f.text), ...r.wearsFirst.flatMap((w) => [w.part, w.why, w.sign]), ...r.care].join(" ");
      expect(all).not.toMatch(/\d+\s*(years?|yrs?)\b/i);
    }
  });

  it("outdoors, non-rot-resistant wood shows up first in 'wears first'", () => {
    const r = durabilityReport({ ...START, wood: "ash" }, { setting: "outdoor" });
    expect(r.wearsFirst[0]!.part).toMatch(/feet/);
    expect(r.facts.some((f) => /rots outside/.test(f.text))).toBe(true);
    expect(durabilityReport({ ...START, wood: "oak" }, { setting: "outdoor" }).facts.some((f) => /resists rot/.test(f.text))).toBe(true);
  });

  it("screwed joints are flagged and get their own care step", () => {
    const r = durabilityReport({ ...START, joint: "screw" });
    expect(r.wearsFirst.some((w) => /screwed/.test(w.part))).toBe(true);
    expect(r.care[0]).toMatch(/Tighten the screws/);
  });

  it("legs flex less with stretchers and thicker legs (same beam model as the Bending panel)", () => {
    const base = { ...START, stretchers: false };
    expect(legFlexMm({ ...base, stretchers: true })!).toBeLessThan(legFlexMm(base)!);
    expect(legFlexMm({ ...base, legThickness: 4.5 })!).toBeLessThan(legFlexMm(base)!);
  });
});
