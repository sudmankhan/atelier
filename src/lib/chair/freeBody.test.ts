import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { computeGeometry, FRONT_RAKE } from "./geometry";
import { japaneseMoments, kangarooMoments, kangarooReactions } from "./freeBody";
import { DEFAULT_LOADS } from "./loads";
import { bendingStressMPa, jointStress, levelOfUtilisation, rectSection } from "./jointStress";
import { jointSpec, tenonSectionModulus } from "./joinery";
import { movementMm } from "./movement";
import { referenceStressMPa } from "./woodProperties";

const byId = (ms: { id: string; moment: number }[], id: string) => ms.find((m) => m.id === id)!.moment;

describe("free-body joint moments (Kangaroo, per side frame)", () => {
  it("floor reactions balance the sitter's weight", () => {
    const r = kangarooReactions(BASELINE);
    expect(r.Rf + r.Rr).toBeCloseTo(DEFAULT_LOADS.seatN / 2, 9);
  });
  it("a more reclined back moves the sitter back, loading the rear feet", () => {
    expect(kangarooReactions({ ...BASELINE, backAngle: 125 }).Rr).toBeGreaterThan(kangarooReactions(BASELINE).Rr);
  });
  it("with no lean, the front reaction is W·(com − rear foot)/(front foot − rear foot)", () => {
    const g = computeGeometry(BASELINE);
    const L = { ...DEFAULT_LOADS, leanN: 0 };
    const r = kangarooReactions(BASELINE, L);
    expect(r.Rf).toBeCloseTo((450 * (r.comZ - g.rearFoot.z)) / (g.frontFoot.z - g.rearFoot.z), 9);
  });
  it("a backward lean shifts load off the front feet by F·h / span", () => {
    const g = computeGeometry(BASELINE);
    const a = kangarooReactions(BASELINE, { ...DEFAULT_LOADS, leanN: 0 });
    const b = kangarooReactions(BASELINE);
    expect(a.Rf - b.Rf).toBeCloseTo((125 * g.backTop.y) / (g.frontFoot.z - g.rearFoot.z), 9);
  });
  it("front leg joint moment = R_front × the 5 cm rake", () => {
    const r = kangarooReactions(BASELINE);
    expect(byId(kangarooMoments(BASELINE), "frontJoint")).toBeCloseTo(r.Rf * FRONT_RAKE * 0.01, 9);
  });
  it("back post moment = half the lean × height of the back top above the seat rear", () => {
    const g = computeGeometry(BASELINE);
    expect(byId(kangarooMoments(BASELINE), "backPost")).toBeCloseTo(125 * (g.backTop.y - g.seatRear.y) * 0.01, 9);
  });
  it("hand checks: top rail 250 N × 0.54 m / 12 = 11.25 N·m; racking 150/4 × 0.36 m = 13.5 N·m", () => {
    const ms = kangarooMoments(BASELINE);
    expect(byId(ms, "backTopJoint")).toBeCloseTo(11.25, 9);
    expect(byId(ms, "railJoints")).toBeCloseTo(13.5, 9);
  });
  it("a taller seat raises the racking moment in proportion", () => {
    expect(byId(kangarooMoments({ ...BASELINE, seatHeight: 48 }), "railJoints") / byId(kangarooMoments(BASELINE), "railJoints")).toBeCloseTo(48 / 36, 9);
  });
});

describe("free-body joint moments (Japanese)", () => {
  it("with no splay, the sideways shove governs: 150/4 × 0.42 m = 15.75 N·m", () => {
    expect(byId(japaneseMoments({ ...J_BASELINE, legSplay: 0 }), "legJoints")).toBeCloseTo(15.75, 9);
  });
  it("more splay → more leg-socket moment", () => {
    expect(byId(japaneseMoments({ ...J_BASELINE, legSplay: 14 }), "legJoints")).toBeGreaterThan(byId(japaneseMoments(J_BASELINE), "legJoints"));
  });
  it("more spindles take lean off the posts; a taller back adds it", () => {
    const base = byId(japaneseMoments(J_BASELINE), "postJoints");
    expect(byId(japaneseMoments({ ...J_BASELINE, spindles: 6 }), "postJoints")).toBeLessThan(base);
    expect(byId(japaneseMoments({ ...J_BASELINE, backHeight: 50 }), "postJoints")).toBeGreaterThan(base);
  });
  it("two posts and no spindles would each take exactly half the lean", () => {
    expect(byId(japaneseMoments({ ...J_BASELINE, spindles: 0 }), "postJoints")).toBeCloseTo(125 * 0.4, 9);
  });
});

describe("joint stress", () => {
  it("σ (MPa) = M (N·m) / S (cm³)", () => {
    // 1 N·m on 1 cm³: 1 / 1e-6 Pa = 1 MPa
    expect(bendingStressMPa(1, 1)).toBe(1);
    // 1.3 × 3.8 cm tenon bent on edge: S = 1.3 × 3.8² / 6 = 3.1287 cm³; 10 N·m → 3.196 MPa
    const S = tenonSectionModulus(jointSpec("kangaroo", "front"));
    expect(S).toBeCloseTo(3.1287, 3);
    expect(bendingStressMPa(10, S)).toBeCloseTo(3.196, 3);
    expect(rectSection(3.8, 5)).toBeCloseTo((3.8 * 25) / 6, 9);
  });
  it("round tenon section modulus is π d³ / 32", () => {
    expect(tenonSectionModulus(jointSpec("kangaroo", "rail"))).toBeCloseTo((Math.PI * 1.6 ** 3) / 32, 9);
  });
  it("utilisation levels: < 0.5 ok, ≤ 1 watch, > 1 high", () => {
    expect(levelOfUtilisation(0.49)).toBe("ok");
    expect(levelOfUtilisation(1)).toBe("watch");
    expect(levelOfUtilisation(1.01)).toBe("high");
    const s = jointStress(10, 1, "oak");
    expect(s.utilisation).toBeCloseTo(10 / referenceStressMPa("oak"), 9);
  });
});

describe("wood movement (Eq. 13–2)", () => {
  it("44 cm flatsawn white oak over a 4-point swing: 440 × 0.00376 × 4 = 6.6 mm", () => {
    expect(movementMm(44, "oak")).toBeCloseTo(6.6176, 4);
  });
  it("quartersawn moves less than flatsawn", () => {
    expect(movementMm(44, "oak", 4, "quarter")).toBeLessThan(movementMm(44, "oak"));
  });
});
