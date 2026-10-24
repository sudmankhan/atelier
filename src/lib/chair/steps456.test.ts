import { describe, expect, it } from "vitest";
import { JOINTS, checkJoint, jointGrade } from "./joinery";
import { evaluateOrder, OPS } from "../assembly";
import { BLANK, evaluateLab, tipMargin, rackingIndex } from "../lab";

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
  it("a heavily reclined back on an unsplayed base tips", () => {
    expect(tipMargin({ ...BLANK, back: "slats", backAngle: 125 })).toBeLessThan(0);
  });
  it("screws in pine without stretchers rack loose", () => {
    expect(rackingIndex(BLANK)).toBeGreaterThan(1);
  });
  it("oak mortise & tenon with stretchers holds", () => {
    const r = evaluateLab({ ...BLANK, joint: "mt", wood: "oak", stretchers: true, legThickness: 3.8 });
    expect(r.find((x) => x.area === "Joints")!.level).toBe("good");
  });
});
