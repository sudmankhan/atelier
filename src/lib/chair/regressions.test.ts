import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { backBowCm, computeGeometry } from "./geometry";
import { kangarooStress } from "./stress";
import { kangarooShop } from "./shop";
import { checkJoint, JOINTS } from "./joinery";

describe("regressions", () => {
  it("back-post bow is the same number in geometry, stress and shop", () => {
    const p = { ...BASELINE, backCurve: 0.8 };
    const g = computeGeometry(p);
    const straightMid = { z: (g.seatRear.z + g.backTop.z) / 2, y: (g.seatRear.y + g.backTop.y) / 2 };
    expect(Math.hypot(g.backMid.z - straightMid.z, g.backMid.y - straightMid.y)).toBeCloseTo(backBowCm(p), 6);
    const post = kangarooStress(p).grain.find((x) => x.id === "backPost")!;
    expect(post.runoutDeg).toBeCloseTo((Math.atan((4 * backBowCm(p)) / (g.backrestLength + 20)) * 180) / Math.PI, 1);
    const cut = kangarooShop(p).cuts.find((c) => c.part === "Back post")!;
    expect(cut.finished.w).toBeCloseTo(5 + backBowCm(p), 1);
  });

  it("a tenon over half the member thickness is graded bad", () => {
    const j = JOINTS.kangaroo.find((x) => x.kind === "mortise-tenon")!;
    const fat = checkJoint(j, j.tenonMember * 0.55, j.tenonL)[0]!;
    expect(fat.level).toBe("bad");
    const ok = checkJoint(j, j.tenonMember / 3, j.tenonL)[0]!;
    expect(ok.level).toBe("good");
  });
});
