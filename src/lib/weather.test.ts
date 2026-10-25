import { describe, expect, it } from "vitest";
import { BLANK, evaluateLab } from "./lab";
import { weatherResults } from "./weather";
import { splitWords } from "./words";
import { plainResult } from "./plain";
import { specResults } from "./furniture/engine";
import { specById } from "./furniture/spec";

describe("where the chair lives", () => {
  it("adds nothing unless asked (old results unchanged)", () => {
    expect(evaluateLab(BLANK).some((r) => r.area === "Weather")).toBe(false);
  });
  it("indoors is a single reassurance", () => {
    expect(weatherResults({ wood: "ash", joint: "mt", seatWidthCm: 42 }, "indoor")).toHaveLength(1);
  });
  it("outdoors, rot depends on the wood", () => {
    const rot = (wood: "oak" | "ash" | "walnut" | "pine") => weatherResults({ wood, joint: "mt", seatWidthCm: 42 }, "outdoor")[0]!.level;
    expect(rot("oak")).toBe("good");
    expect(rot("walnut")).toBe("good");
    expect(rot("pine")).toBe("bad");
    expect(rot("ash")).toBe("bad");
  });
  it("outdoors the seat moves 3× as much as indoors (12 vs 4 point swing)", () => {
    const mm = (s: "indoor" | "outdoor") => weatherResults({ wood: "oak", joint: "mt", seatWidthCm: 40 }, "outdoor")[1]!.detail.match(/([\d.]+) mm/g)!;
    const [out, inn] = mm("outdoor").map((x) => parseFloat(x));
    expect(out! / inn!).toBeCloseTo(3, 1);
  });
  it("file chairs get the weather checks too", () => {
    expect(specResults(specById("nordic-ladder-back")!, { setting: "outdoor" }).filter((r) => r.area === "Weather").length).toBe(5);
  });
  it("never claims a lifespan in years", () => {
    for (const s of ["indoor", "covered", "outdoor"] as const) for (const r of weatherResults({ wood: "pine", joint: "screw", seatWidthCm: 42 }, s)) expect(`${r.title} ${r.detail}`).not.toMatch(/\d+ years?/);
  });
});

describe("beginner words", () => {
  it("finds the jargon in a real result", () => {
    const r = evaluateLab({ ...BLANK, joint: "mt", back: "slats" }).find((x) => x.area === "Joints")!;
    const hits = splitWords(r.detail).filter((p) => typeof p !== "string").map((p) => (p as { word: { term: string } }).word.term);
    expect(hits).toEqual(expect.arrayContaining(["Mortise & tenon", "N·m (moment)", "MPa (stress)"]));
    expect(splitWords(r.detail).map((p) => (typeof p === "string" ? p : p.text)).join("")).toBe(r.detail);
  });
  it("every Lab result has a plain-English version", () => {
    const designs = [BLANK, { ...BLANK, back: "panel" as const, joint: "mt" as const, legThickness: 2.2, splay: 18, seatDepth: 55, backAngle: 130 }, { ...BLANK, back: "slats" as const, backAngle: 90, seatHeight: 52 }];
    for (const d of designs) for (const r of evaluateLab(d, { poplitealHeight: 40, setting: "outdoor" })) {
      const p = plainResult(r);
      expect(p.title.length).toBeGreaterThan(3);
      if (r.area !== "Weather") expect(p.title).not.toMatch(/MPa|N·m|\d+ N\b/);
    }
  });
});
