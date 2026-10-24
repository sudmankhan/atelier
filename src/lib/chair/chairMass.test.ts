import { describe, expect, it } from "vitest";
import { kangarooMass, japaneseMass, labMass } from "./chairMass";
import { density12 } from "./woodProperties";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { BLANK } from "../lab";

describe("chair self-weight", () => {
  it("same parts, heavier wood: mass scales exactly with USDA density", () => {
    const pine = labMass(BLANK).kg;
    const oak = labMass({ ...BLANK, wood: "oak" }).kg;
    expect(oak / pine).toBeCloseTo(density12("oak") / density12("pine"), 9);
  });
  it("a symmetric stool's centre of mass is at the seat centre", () => {
    expect(labMass(BLANK).comZ).toBeCloseTo(0, 6);
  });
  it("both reference chairs weigh what a real chair weighs (5–15 kg)", () => {
    for (const m of [kangarooMass(BASELINE), japaneseMass(J_BASELINE)]) {
      expect(m.kg).toBeGreaterThan(5);
      expect(m.kg).toBeLessThan(15);
    }
  });
  it("a reclined back moves the chair's own centre of mass rearward", () => {
    expect(labMass({ ...BLANK, back: "slats", backAngle: 120 }).comZ).toBeLessThan(labMass({ ...BLANK, back: "slats", backAngle: 95 }).comZ);
  });
});
