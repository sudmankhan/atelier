import { describe, expect, it } from "vitest";
import { BriefSchema, LAB_RANGES, START, heightCm, heuristicBrief, isChange, seatForHeight, toBrief } from "./brief";
import { evaluateLab } from "./lab";

describe("AI answer → engine settings", () => {
  it("applies valid settings on top of the starting chair", () => {
    const b = toBrief({ name: "Patio chair", base: "zframe", wood: "walnut", setting: "outdoor", seatHeight: 47, stretchers: false });
    expect(b.design).toMatchObject({ base: "zframe", wood: "walnut", seatHeight: 47, stretchers: false, joint: START.joint });
    expect(b.setting).toBe("outdoor");
    expect(b.name).toBe("Patio chair");
  });

  it("clamps out-of-range numbers to the slider limits and says so", () => {
    const b = toBrief({ seatHeight: 95, legThickness: 0.5, backAngle: 200 });
    expect(b.design.seatHeight).toBe(LAB_RANGES.seatHeight[1]);
    expect(b.design.legThickness).toBe(LAB_RANGES.legThickness[0]);
    expect(b.design.backAngle).toBe(LAB_RANGES.backAngle[1]);
    expect(b.clamped).toHaveLength(3);
  });

  it("ignores junk, unknown values and wrong types instead of crashing", () => {
    expect(toBrief("not json").design).toEqual(START);
    expect(toBrief({ base: "rocking", wood: "steel" }).design).toEqual(START);
    expect(BriefSchema.safeParse({ seatHeight: "tall" }).success).toBe(false);
    expect(toBrief({ seatHeight: "tall" }).design.seatHeight).toBe(START.seatHeight);
  });

  it("every chair it can return is one the engine can test", () => {
    for (const raw of [{}, { base: "sled", back: "panel", joint: "dowel" }, { base: "splayed", back: "spindles", joint: "wedged" }, { base: "zframe", back: "none", seatHeight: 30 }]) {
      expect(() => evaluateLab(toBrief(raw).design, { setting: "outdoor" })).not.toThrow();
    }
  });

  it("splayed legs always get some splay; other bases none", () => {
    expect(toBrief({ base: "splayed" }).design.splay).toBeGreaterThan(0);
    expect(toBrief({ base: "zframe", splay: 12 }).design.splay).toBe(0);
  });

  it("keeps the current chair when describing a change", () => {
    const current = { ...START, wood: "walnut" as const, seatHeight: 40 };
    expect(toBrief({ seatHeight: 44 }, current).design).toMatchObject({ wood: "walnut", seatHeight: 44 });
    expect(toBrief({ seatHeight: 44 }, current, "outdoor").setting).toBe("outdoor");
    expect(heuristicBrief("make it a reading chair", current, "outdoor").setting).toBe("outdoor");
  });
});

describe("keyword fallback (no AI)", () => {
  it("reads heights in feet, cm and metres", () => {
    expect(heightCm("I'm 6'2\"")).toBe(188);
    expect(heightCm("about 5 ft 6")).toBe(168);
    expect(heightCm("I am 180 cm")).toBe(180);
    expect(heightCm("1.75 m tall")).toBe(175);
    expect(heightCm("a chair")).toBeNull();
    expect(seatForHeight(188)).toBe(47);
  });

  it("a sturdy patio chair for a tall person", () => {
    const b = heuristicBrief("A sturdy patio dining chair. I'm 6'2\".");
    expect(b.setting).toBe("outdoor");
    expect(b.design.wood).toBe("oak");
    expect(b.design.seatHeight).toBe(47);
    expect(b.design.stretchers).toBe(true);
    expect(b.name).toBe("Patio chair");
  });

  it("says honestly what it can't build", () => {
    expect(heuristicBrief("a rocking chair with armrests and cushions").cannotDo).toEqual(["rockers (curved runners)", "armrests", "upholstery"]);
  });

  it("styles map to the engine's parts", () => {
    expect(heuristicBrief("Japanese style stick chair").design).toMatchObject({ base: "splayed", back: "spindles", joint: "wedged" });
    expect(heuristicBrief("a small chair for a kid").design.seatHeight).toBe(30);
    expect(heuristicBrief("a laid back reading chair").design.backAngle).toBe(110);
  });
});

describe("the starting chair", () => {
  it("passes every test, so a described chair starts sound", () => {
    expect(evaluateLab(START).filter((r) => r.level === "bad")).toEqual([]);
  });
});

describe("new chair vs. change to this one", () => {
  it("tells the two apart", () => {
    for (const t of ["make it taller", "Add armrests", "more upright please", "change the wood to walnut", "it should be wider"]) expect(isChange(t)).toBe(true);
    for (const t of ["A reading chair for my patio", "a sturdy dining chair, I'm 6'2\"", "Japanese style stick chair", "I want a kids chair"]) expect(isChange(t)).toBe(false);
  });
  it("a chair asked for on a blank bench gets a back", () => {
    const blankish = { ...START, back: "none" as const };
    expect(heuristicBrief("make it a reading chair", blankish).design.back).toBe("slats");
    expect(heuristicBrief("make it a stool", START).design.back).toBe("none");
  });
});
