// Verified clear-wood properties from USDA FPL-GTR-282 (2021), Wood Handbook, Chapter 5, Table 5–3b
// (inch–pound original) with Table 5–3a (metric) as a cross-check. PDF page numbers are file pages.
// - Values are means from tests on small CLEAR specimens: NOT design-allowable stresses.
// - E is as tabulated (center-loaded, span/depth 14:1, includes shear deflection). The optional
//   ~10% shear correction (footnote c) is intentionally NOT applied.
// - MOR is kept for educational comparison only; never use it to certify a safe load.
// - Heuristic scoring (lab.ts rackingIndex / WOODS) is separate and does not read this module.

export type MoistureCondition = "green" | "12pct";
export type WoodId = "oak" | "ash" | "walnut" | "pine";

export const PSI_TO_MPA = 0.00689476;
export const MPSI_TO_MPA = 6894.76;

/** Assumed reference condition for furniture calculations — not a measurement of the user's wood. */
export const DEFAULT_MOISTURE: MoistureCondition = "12pct";
export const DEFAULT_MOISTURE_NOTE =
  "12% moisture content is an assumed reference condition for air-dried furniture wood, not a measurement of your stock.";

export interface SourceRecord {
  document: "USDA FPL-GTR-282 (2021), Wood Handbook, Ch. 5";
  table: "Table 5–3b";
  pdfPage: number;
  crossCheck: { table: "Table 5–3a"; pdfPage: number; MOR_kPa: number; E_MPa: number };
  originalUnits: { MOR: "lbf/in²"; E: "10^6 lbf/in²" };
  MOR_original: number;
  E_original: number;
}

export interface MechanicalValue {
  moisture: MoistureCondition;
  MOR_MPa: number | null;
  E_MPa: number | null;
  basis: "clear-specimen test mean (not design allowable)";
  eShearCorrectionApplied: false;
  source: SourceRecord;
}

export interface WoodProperties {
  id: WoodId;
  commonName: string;
  scientificName: string;
  tableRowLabel: string;
  values: Record<MoistureCondition, MechanicalValue>;
}

const DOC = "USDA FPL-GTR-282 (2021), Wood Handbook, Ch. 5" as const;

function mv(moisture: MoistureCondition, MOR_psi: number, E_Mpsi: number, pdfPage: number, xPage: number, xMOR_kPa: number, xE_MPa: number): MechanicalValue {
  return {
    moisture,
    MOR_MPa: MOR_psi * PSI_TO_MPA,
    E_MPa: E_Mpsi * MPSI_TO_MPA,
    basis: "clear-specimen test mean (not design allowable)",
    eShearCorrectionApplied: false,
    source: {
      document: DOC,
      table: "Table 5–3b",
      pdfPage,
      crossCheck: { table: "Table 5–3a", pdfPage: xPage, MOR_kPa: xMOR_kPa, E_MPa: xE_MPa },
      originalUnits: { MOR: "lbf/in²", E: "10^6 lbf/in²" },
      MOR_original: MOR_psi,
      E_original: E_Mpsi,
    },
  };
}

export const WOOD_PROPERTIES: Record<WoodId, WoodProperties> = {
  oak: {
    id: "oak", commonName: "White oak", scientificName: "Quercus alba", tableRowLabel: "Oak, white → White",
    values: { green: mv("green", 8300, 1.25, 11, 6, 57000, 8600), "12pct": mv("12pct", 15200, 1.78, 11, 6, 105000, 12300) },
  },
  ash: {
    id: "ash", commonName: "White ash", scientificName: "Fraxinus americana", tableRowLabel: "Ash → White",
    values: { green: mv("green", 9500, 1.44, 9, 4, 66000, 9900), "12pct": mv("12pct", 15400, 1.74, 9, 4, 106000, 12000) },
  },
  walnut: {
    id: "walnut", commonName: "Black walnut", scientificName: "Juglans nigra", tableRowLabel: "Walnut, black",
    values: { green: mv("green", 9500, 1.42, 11, 6, 66000, 9800), "12pct": mv("12pct", 14600, 1.68, 11, 6, 101000, 11600) },
  },
  pine: {
    id: "pine", commonName: "Eastern white pine", scientificName: "Pinus strobus", tableRowLabel: "Pine → Eastern white (not Cedar → Eastern white)",
    values: { green: mv("green", 4900, 0.99, 12, 7, 34000, 6800), "12pct": mv("12pct", 8600, 1.24, 12, 7, 59000, 8500) },
  },
};

export function woodValue(id: WoodId, moisture: MoistureCondition = DEFAULT_MOISTURE): MechanicalValue {
  return WOOD_PROPERTIES[id].values[moisture];
}
