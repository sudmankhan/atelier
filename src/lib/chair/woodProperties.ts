// Verified clear-wood properties from USDA FPL-GTR-282 (2021), Wood Handbook. Page numbers are the
// printed page labels (e.g. 11 = page 5–11 in Chapter 5).
// - Strength/stiffness: Table 5–3b (domestic, inch–pound) or Table 5–4b (imported), with the metric
//   Table 5–3a / 5–4a as a cross-check.
// - Values are means from tests on small CLEAR specimens: NOT design-allowable stresses.
// - E is as tabulated (center-loaded, span/depth 14:1, includes shear deflection). The optional
//   ~10% shear correction (footnote c) is intentionally NOT applied.
// - Specific gravity: same table rows (oven-dry weight, volume at 12% MC).
// - Dimensional change coefficients: Table 13–5 (p. 13–17); teak derived from Table 4–4 with Eq. 13–2.

export type MoistureCondition = "green" | "12pct";
export type WoodId = "oak" | "ash" | "walnut" | "pine" | "teak";

export const PSI_TO_MPA = 0.00689476;
export const MPSI_TO_MPA = 6894.76;

/** Assumed reference condition for furniture calculations — not a measurement of the user's wood. */
export const DEFAULT_MOISTURE: MoistureCondition = "12pct";
export const DEFAULT_MOISTURE_NOTE =
  "12% moisture content is an assumed reference condition for air-dried furniture wood, not a measurement of your stock.";

export const HANDBOOK = "USDA FPL-GTR-282 (2021), Wood Handbook" as const;
export const HANDBOOK_URL = "https://research.fs.usda.gov/treesearch/62200";

type StrengthTable = "Table 5–3b" | "Table 5–4b";
type MetricTable = "Table 5–3a" | "Table 5–4a";

export interface SourceRecord {
  document: "USDA FPL-GTR-282 (2021), Wood Handbook, Ch. 5";
  table: StrengthTable;
  pdfPage: number;
  crossCheck: { table: MetricTable; pdfPage: number; MOR_kPa: number; E_MPa: number };
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

export interface Shrinkage {
  /** fractional change in dimension per 1% change in moisture content, radial (quartersawn width) */
  C_R: number;
  /** same, tangential (flatsawn width) — the larger, worst case */
  C_T: number;
  source: string;
}

export interface WoodProperties {
  id: WoodId;
  commonName: string;
  scientificName: string;
  tableRowLabel: string;
  /** specific gravity, oven-dry weight / volume at 12% MC */
  specificGravity12: number;
  values: Record<MoistureCondition, MechanicalValue>;
  shrinkage: Shrinkage;
}

const DOC = "USDA FPL-GTR-282 (2021), Wood Handbook, Ch. 5" as const;

function mv(moisture: MoistureCondition, MOR_psi: number, E_Mpsi: number, pdfPage: number, xPage: number, xMOR_kPa: number, xE_MPa: number, table: StrengthTable = "Table 5–3b"): MechanicalValue {
  return {
    moisture,
    MOR_MPa: MOR_psi * PSI_TO_MPA,
    E_MPa: E_Mpsi * MPSI_TO_MPA,
    basis: "clear-specimen test mean (not design allowable)",
    eShearCorrectionApplied: false,
    source: {
      document: DOC,
      table,
      pdfPage,
      crossCheck: { table: table === "Table 5–3b" ? "Table 5–3a" : "Table 5–4a", pdfPage: xPage, MOR_kPa: xMOR_kPa, E_MPa: xE_MPa },
      originalUnits: { MOR: "lbf/in²", E: "10^6 lbf/in²" },
      MOR_original: MOR_psi,
      E_original: E_Mpsi,
    },
  };
}

const T135 = "Table 13–5, p. 13–17";

/** Wood Handbook Eq. 13–2: dimensional change coefficient from total green-to-ovendry shrinkage S (%), FSP 30%, start 10% MC. */
export function dccFromShrinkage(S: number, fsp = 30, mI = 10) {
  return S / (fsp * 100 - S * (fsp - mI));
}

export const WOOD_PROPERTIES: Record<WoodId, WoodProperties> = {
  oak: {
    id: "oak", commonName: "White oak", scientificName: "Quercus alba", tableRowLabel: "Oak, white → White", specificGravity12: 0.68,
    values: { green: mv("green", 8300, 1.25, 11, 6, 57000, 8600), "12pct": mv("12pct", 15200, 1.78, 11, 6, 105000, 12300) },
    shrinkage: { C_R: 0.00194, C_T: 0.00376, source: `${T135}, "White oak, white"` },
  },
  ash: {
    id: "ash", commonName: "White ash", scientificName: "Fraxinus americana", tableRowLabel: "Ash → White", specificGravity12: 0.6,
    values: { green: mv("green", 9500, 1.44, 9, 4, 66000, 9900), "12pct": mv("12pct", 15400, 1.74, 9, 4, 106000, 12000) },
    shrinkage: { C_R: 0.00169, C_T: 0.00274, source: `${T135}, "Ash, white"` },
  },
  walnut: {
    id: "walnut", commonName: "Black walnut", scientificName: "Juglans nigra", tableRowLabel: "Walnut, black", specificGravity12: 0.55,
    values: { green: mv("green", 9500, 1.42, 11, 6, 66000, 9800), "12pct": mv("12pct", 14600, 1.68, 11, 6, 101000, 11600) },
    shrinkage: { C_R: 0.0019, C_T: 0.00274, source: `${T135}, "Walnut, black"` },
  },
  pine: {
    id: "pine", commonName: "Eastern white pine", scientificName: "Pinus strobus", tableRowLabel: "Pine → Eastern white (not Cedar → Eastern white)", specificGravity12: 0.35,
    values: { green: mv("green", 4900, 0.99, 12, 7, 34000, 6800), "12pct": mv("12pct", 8600, 1.24, 12, 7, 59000, 8500) },
    shrinkage: { C_R: 0.00071, C_T: 0.00212, source: `${T135}, "Pine, eastern white"` },
  },
  teak: {
    id: "teak", commonName: "Teak", scientificName: "Tectona grandis", tableRowLabel: "Teak (Tectona grandis)", specificGravity12: 0.55,
    values: {
      green: mv("green", 11600, 1.37, 25, 21, 80000, 9400, "Table 5–4b"),
      "12pct": mv("12pct", 14600, 1.55, 25, 21, 100700, 10700, "Table 5–4b"),
    },
    // Not in Table 13–5; derived with Eq. 13–2 from Table 4–4 (p. 4–9) shrinkage: radial 2.5%, tangential 5.8%.
    shrinkage: { C_R: dccFromShrinkage(2.5), C_T: dccFromShrinkage(5.8), source: "Derived by Eq. 13–2 from Table 4–4, p. 4–9 (radial 2.5%, tangential 5.8%); FSP assumed 30%" },
  },
};

export function woodValue(id: WoodId, moisture: MoistureCondition = DEFAULT_MOISTURE): MechanicalValue {
  return WOOD_PROPERTIES[id].values[moisture];
}

/** Density (kg/m³) at 12% MC: SG is on oven-dry weight, so the water adds 12% to the mass. */
export function density12(id: WoodId) {
  return WOOD_PROPERTIES[id].specificGravity12 * 1000 * 1.12;
}

// ---- Educational reference stress (how design values are derived from clear-wood data) ----

/** Table 5–6 (p. 5–26): average coefficient of variation of MOR for clear wood. */
export const MOR_COV = 0.16;
/** One-sided normal z for the 5th percentile ("5% exclusion limit", Ch. 7 p. 7–5). */
export const Z_5PCT = 1.645;
/** Ch. 7 p. 7–10: factor for an assumed 10-year duration of load and safety applied to 5th-percentile MOR. */
export const DURATION_SAFETY_FACTOR = 2.1;

/**
 * Educational reference bending stress (MPa): mean clear-wood MOR → 5th percentile → ÷2.1.
 * Clear wood only (no knots or grade reduction), so real lumber is lower. NOT an allowable design value.
 */
export function referenceStressMPa(id: WoodId, moisture: MoistureCondition = DEFAULT_MOISTURE) {
  const mor = woodValue(id, moisture).MOR_MPa!;
  return (mor * (1 - Z_5PCT * MOR_COV)) / DURATION_SAFETY_FACTOR;
}

// ---- Mapping chair choices to data ----

export interface WoodChoice { id: WoodId | null; proxy: boolean; note: string }

const KANGAROO_WOODS: Record<string, WoodId> = { teak: "teak", walnut: "walnut", oak: "oak" };

/** Which USDA record backs a chair's wood choice. Keyaki (zelkova) has no USDA entry: white oak is a labelled stand-in. */
export function woodForChoice(choice: string): WoodChoice {
  if (KANGAROO_WOODS[choice]) return { id: KANGAROO_WOODS[choice]!, proxy: false, note: WOOD_PROPERTIES[KANGAROO_WOODS[choice]!].commonName };
  if (choice === "keyaki" || choice === "lacquer")
    return { id: "oak", proxy: true, note: "Keyaki (zelkova) is not in the USDA Wood Handbook; white oak is used as a stand-in of similar density. Numbers are indicative only." };
  return { id: null, proxy: false, note: "No verified data for this wood." };
}
