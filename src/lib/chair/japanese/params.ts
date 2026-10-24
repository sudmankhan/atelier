// Typed data model for the Japanese-inspired spindle-back armchair
// (black lacquered frame, light solid seat, curved crest rail).
// All lengths are centimetres, all angles degrees.

export type JFinish = "lacquer" | "keyaki" | "walnut";

export interface JapaneseParams {
  seatHeight: number; // top of the seat slab above the floor
  seatWidth: number; // width of the seat slab
  seatDepth: number; // front-to-back depth of the seat slab
  backHeight: number; // seat top to the crest rail
  legSplay: number; // degrees each leg kicks out from vertical (both directions)
  spindles: number; // inner spindles between the two back posts
  armHeight: number; // armrest height above the seat at the back post
  finish: JFinish;
}

export type JNumericParam = Exclude<keyof JapaneseParams, "finish">;

export const J_BASELINE: JapaneseParams = {
  seatHeight: 42,
  seatWidth: 52,
  seatDepth: 44,
  backHeight: 40,
  legSplay: 8,
  spindles: 4,
  armHeight: 22,
  finish: "lacquer",
};

export interface JParamSpec {
  key: JNumericParam;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
}

export const J_PARAM_SPECS: JParamSpec[] = [
  { key: "seatHeight", label: "Seat height", min: 36, max: 48, step: 0.5, unit: "cm", hint: "Top of the seat slab, from the floor" },
  { key: "seatWidth", label: "Seat width", min: 44, max: 62, step: 0.5, unit: "cm", hint: "Width of the seat slab and crest span" },
  { key: "seatDepth", label: "Seat depth", min: 36, max: 52, step: 0.5, unit: "cm", hint: "Front-to-back depth of the seat slab" },
  { key: "backHeight", label: "Back height", min: 26, max: 50, step: 0.5, unit: "cm", hint: "Seat top to the crest rail" },
  { key: "legSplay", label: "Leg splay", min: 0, max: 14, step: 0.5, unit: "°", hint: "How far the legs kick out from vertical" },
  { key: "spindles", label: "Spindles", min: 2, max: 6, step: 1, unit: "", hint: "Inner spindles between the back posts" },
  { key: "armHeight", label: "Arm height", min: 14, max: 30, step: 0.5, unit: "cm", hint: "Armrest height above the seat, at the back post" },
];

export const J_FINISHES: Record<JFinish, { label: string; frame: string; seat: string; note: string }> = {
  lacquer: { label: "Black urushi", frame: "#221e1b", seat: "#d9bd8f", note: "Built-up lacquer over a hardwood frame, pale seat left clear" },
  keyaki: { label: "Keyaki (zelkova)", frame: "#8a5a33", seat: "#c99a63", note: "The classic Japanese cabinet hardwood, warm and open-grained" },
  walnut: { label: "Walnut", frame: "#4a3324", seat: "#8a6742", note: "A darker, quieter Western reading of the same form" },
};

export function clampJapanese(p: JapaneseParams): JapaneseParams {
  const out = { ...p };
  for (const s of J_PARAM_SPECS) out[s.key] = Math.min(s.max, Math.max(s.min, out[s.key]));
  out.spindles = Math.round(out.spindles);
  return out;
}
