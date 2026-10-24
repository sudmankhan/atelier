// Educational cantilever bending estimate for a STRAIGHT, prismatic, rectangular wooden member,
// fixed at one end with a point load at the free end. SI internally (N, m, Pa).
// Assumptions: linear-elastic, small deflection, uniform section, ideal fixed support, load
// perpendicular to the member. NOT valid for curved members, tapered parts or joint systems.
// Excludes joint failure, shear, buckling, splitting, defects, creep and fatigue.
// USDA MOR is a clear-specimen test mean, never an allowable working stress.
import { DEFAULT_MOISTURE, WOOD_PROPERTIES, type MoistureCondition, type WoodId } from "./woodProperties";

export interface BeamInput { F: number; L: number; b: number; h: number; E: number }
export interface BeamResult { ok: true; M: number; I: number; sigma: number; delta: number }
export type BeamOutput = BeamResult | { ok: false; error: string };

export function cantileverEndLoad({ F, L, b, h, E }: BeamInput): BeamOutput {
  for (const [k, v] of Object.entries({ F, L, b, h, E })) if (!Number.isFinite(v)) return { ok: false, error: `${k} must be a finite number` };
  if (F < 0) return { ok: false, error: "Force cannot be negative" };
  if (L <= 0 || b <= 0 || h <= 0) return { ok: false, error: "Length, width and depth must be greater than 0" };
  if (E <= 0) return { ok: false, error: "E must be greater than 0" };
  const M = F * L;
  const I = (b * h ** 3) / 12;
  return { ok: true, M, I, sigma: (M * (h / 2)) / I, delta: (F * L ** 3) / (3 * E * I) };
}

export type MemberShape = "straight" | "curved" | "tapered" | "joint-system";
/** Only straight prismatic members may use this model. */
export function beamModelApplies(shape: MemberShape): { ok: boolean; reason?: string } {
  return shape === "straight" ? { ok: true } : { ok: false, reason: `The straight cantilever model does not apply to ${shape} members.` };
}

/** E (Pa) from the verified USDA dataset, as tabulated (no shear correction). */
export function woodE_Pa(id: WoodId, mc: MoistureCondition = DEFAULT_MOISTURE) {
  const e = WOOD_PROPERTIES[id].values[mc].E_MPa;
  return e === null ? null : e * 1e6;
}

export const toMPa = (pa: number) => pa / 1e6;
export const toMm = (m: number) => m * 1000;
