// Bending stress at a joint compared with an educational reference stress derived from USDA data.
// σ = M / S. With M in N·m and S in cm³, σ in MPa is simply M / S (the 10⁶ factors cancel).
import { referenceStressMPa, type WoodId } from "./woodProperties";

export type Level = "ok" | "watch" | "high";

export interface JointStress {
  stressMPa: number;
  refMPa: number;
  /** stress ÷ reference stress */
  utilisation: number;
  level: Level;
}

/** Below half the reference: ok. Up to the reference: watch. Above it: high. */
export function levelOfUtilisation(u: number): Level {
  return u < 0.5 ? "ok" : u <= 1 ? "watch" : "high";
}

export const bendingStressMPa = (momentNm: number, sectionCm3: number) => momentNm / sectionCm3;

/** Rectangular section modulus (cm³), bending across depth h. */
export const rectSection = (b: number, h: number) => (b * h * h) / 6;

export function jointStress(momentNm: number, sectionCm3: number, wood: WoodId): JointStress {
  const stressMPa = bendingStressMPa(momentNm, sectionCm3);
  const refMPa = referenceStressMPa(wood);
  const utilisation = stressMPa / refMPa;
  return { stressMPa, refMPa, utilisation, level: levelOfUtilisation(utilisation) };
}
