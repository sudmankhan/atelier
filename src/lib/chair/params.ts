// Typed data model for the simplified, Kangaroo-inspired educational chair.
// All lengths are centimetres, all angles degrees.

export type WoodId = "teak" | "walnut" | "oak";

export type Typology = "kangaroo" | "japanese";

export interface ChairParams {
  seatHeight: number; // height of the seat front edge above the floor
  seatWidth: number; // clear width between the two side frames
  seatDepth: number; // front-to-back length of the seat plane
  backAngle: number; // interior angle between seat plane and backrest
  supportSpacing: number; // how far the rear support kicks back behind the seat
  backCurve: number; // 0..1 simplified bow of the back post
  wood: WoodId;
}

export type NumericParam = Exclude<keyof ChairParams, "wood">;

export const BASELINE: ChairParams = {
  seatHeight: 36,
  seatWidth: 54,
  seatDepth: 56,
  backAngle: 112,
  supportSpacing: 22,
  backCurve: 0.35,
  wood: "teak",
};

export interface ParamSpec {
  key: NumericParam;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
}

export const PARAM_SPECS: ParamSpec[] = [
  { key: "seatHeight", label: "Seat height", min: 30, max: 48, step: 0.5, unit: "cm", hint: "Front edge of the seat, from the floor" },
  { key: "seatWidth", label: "Seat width", min: 44, max: 66, step: 0.5, unit: "cm", hint: "Clear width between the side frames" },
  { key: "seatDepth", label: "Seat depth", min: 44, max: 64, step: 0.5, unit: "cm", hint: "Length of the seat plane" },
  { key: "backAngle", label: "Backrest angle", min: 95, max: 132, step: 0.5, unit: "°", hint: "Interior angle between seat and back" },
  { key: "supportSpacing", label: "Support spacing", min: 8, max: 34, step: 0.5, unit: "cm", hint: "Rear support kick behind the seat" },
  { key: "backCurve", label: "Back curvature", min: 0, max: 1, step: 0.05, unit: "", hint: "Simplified bow of the back post" },
];

export const WOODS: Record<WoodId, { label: string; base: string; dark: string; note: string }> = {
  teak: { label: "Teak", base: "#9a6a3f", dark: "#6e4626", note: "The wood associated with the Chandigarh furniture" },
  walnut: { label: "Walnut", base: "#6f4c36", dark: "#43291b", note: "Darker, finer-textured alternative" },
  oak: { label: "White oak", base: "#c29a6b", dark: "#94704a", note: "Paler, open-grained alternative" },
};

export function clampParams(p: ChairParams): ChairParams {
  const out = { ...p };
  for (const s of PARAM_SPECS) out[s.key] = Math.min(s.max, Math.max(s.min, out[s.key]));
  return out;
}
