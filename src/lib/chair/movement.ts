// Seasonal across-grain movement, Wood Handbook Eq. 13–2: ΔD = D · C · ΔMC.
// C is the dimensional change coefficient (Table 13–5): tangential for flatsawn faces (worst case),
// radial for quartersawn. Along the grain movement is negligible and ignored.
import { WOOD_PROPERTIES, type WoodId } from "./woodProperties";

/** Table 13–2 (p. 13–5): interior furniture in most of the US sits at 6–10% MC → a 4-point seasonal swing. */
export const DEFAULT_DELTA_MC = 4;

export type SawnFace = "flat" | "quarter";

/** Change in width (mm) of a board `widthCm` wide, measured across the grain. */
export function movementMm(widthCm: number, wood: WoodId, deltaMC = DEFAULT_DELTA_MC, face: SawnFace = "flat") {
  const s = WOOD_PROPERTIES[wood].shrinkage;
  return widthCm * 10 * (face === "flat" ? s.C_T : s.C_R) * deltaMC;
}
