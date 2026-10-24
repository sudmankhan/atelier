import { describe, expect, it } from "vitest";
import { JOINTS, checkJoint, jointGrade } from "./joinery";
import { evaluateOrder, OPS } from "../assembly";
import { BLANK, evaluateLab, labJointStress, labRackingMoment, labTipping } from "../lab";

describe("joint inspector", () => {
  const front = JOINTS.kangaroo[0]!;
  it("a one-third tenon passes the 1/3 rule", () => {
    expect(checkJoint(front, 1.3, 3.5)[0]!.level).toBe("good");
  });
  it("a tenon leaving walls under 0.45 cm is flagged bad", () => {
    expect(checkJoint(front, 3.0, 3.5)[1]!.level).toBe("bad");
  });
  it("a tenon longer than the mortise depth is bad", () => {
    expect(jointGrade(checkJoint(front, 1.3, 6))).toBe("bad");
  });
});

describe("assembly order", () => {
  it("the listed order has no errors", () => {
    expect(evaluateOrder("kangaroo", OPS.kangaroo.map((o) => o.id))).toHaveLength(0);
    expect(evaluateOrder("japanese", OPS.japanese.map((o) => o.id))).toHaveLength(0);
  });
  it("gluing before dry-fit is caught", () => {
    const errs = evaluateOrder("kangaroo", ["mill", "layout", "cut", "groove", "glueSides", "dry"]);
    expect(errs.some((e) => e.opId === "glueSides")).toBe(true);
  });
});

describe("component lab", () => {
  it("a tall, heavily reclined back on an unsplayed base tips under a gentle lean", () => {
    const d = { ...BLANK, back: "slats" as const, backAngle: 125, backHeight: 60 };
    expect(labTipping(d).result.status).toBe("tips");
    expect(evaluateLab(d).find((x) => x.area === "Stability")!.level).toBe("bad");
  });
  it("more rear splay raises the force needed to tip", () => {
    const a = labTipping({ ...BLANK, back: "slats" }).result.thresholdF!;
    const b = labTipping({ ...BLANK, back: "slats", splay: 12 }).result.thresholdF!;
    expect(b).toBeGreaterThan(a);
  });
  it("screwed butt joints are not calculated, and flagged", () => {
    expect(labJointStress(BLANK)).toBeNull();
    expect(evaluateLab(BLANK).find((x) => x.area === "Joints")!.basis).toBe("rule");
  });
  it("racking moment is rack/4 × seat height without stretchers (portal method)", () => {
    expect(labRackingMoment({ ...BLANK, seatHeight: 45 })).toBeCloseTo((150 / 4) * 0.45, 6);
    expect(labRackingMoment({ ...BLANK, seatHeight: 45, stretchers: true })).toBeCloseTo((150 / 4) * 0.45 * 0.65, 6);
  });
  it("oak mortise & tenon with stretchers holds", () => {
    const r = evaluateLab({ ...BLANK, joint: "mt", wood: "oak", stretchers: true, legThickness: 3.8 });
    expect(r.find((x) => x.area === "Joints")!.level).toBe("good");
  });
});
