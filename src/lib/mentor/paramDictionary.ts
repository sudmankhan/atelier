// Deterministic dictionary of real design parameters, used to resolve what the
// apprentice is asking about before the model sees the question.
export type Typ = "kangaroo" | "japanese";

export interface ParamDef {
  key: string;
  label: string;
  meaning: string;
  component: string;
  unit: string;
  synonyms: string[];
  calculation: string | null;
}

export const PARAM_DICTIONARY: Record<Typ, ParamDef[]> = {
  kangaroo: [
    { key: "seatHeight", label: "Seat height", meaning: "Height of the seat front edge above the floor", component: "Side frame / seat", unit: "cm", synonyms: ["seat height", "seat higher", "seat lower", "height of the seat"], calculation: "Side-frame geometry; occupant fit vs popliteal height" },
    { key: "seatWidth", label: "Seat width", meaning: "Clear width between the two side frames; sets the length of every rail and cross-member", component: "Rails, seat", unit: "cm", synonyms: ["seat width", "wider seat", "narrower seat", "rail length", "rail span"], calculation: "Rail length = seat width (shoulder to shoulder)" },
    { key: "seatDepth", label: "Seat depth", meaning: "Front-to-back length of the seat plane", component: "Seat, side frame", unit: "cm", synonyms: ["seat depth", "deeper seat", "seat length"], calculation: "Side-frame geometry; occupant fit vs buttock-popliteal length" },
    { key: "backAngle", label: "Backrest angle", meaning: "Interior angle between the seat plane and the backrest", component: "Backrest, rear joint", unit: "°", synonyms: ["back angle", "backrest angle", "recline", "back rake", "backrest tilt"], calculation: "Rear joint angle; centre-of-mass shift in the tipping check" },
    { key: "supportSpacing", label: "Support spacing", meaning: "How far the rear support kicks back behind the seat (rear kick-back). It is NOT the spacing between rails.", component: "Rear support / side frame", unit: "cm", synonyms: ["support spacing", "rear support", "kick-back", "kickback", "kick back", "rear kick"], calculation: "Rear pivot position in the static tipping check; rear joint angle" },
    { key: "backCurve", label: "Back curvature", meaning: "Simplified 0–1 bow of the back post", component: "Back post", unit: "", synonyms: ["back curve", "back curvature", "bow of the back", "curvature"], calculation: "Back-post geometry only (curved member: straight beam model does not apply)" },
  ],
  japanese: [
    { key: "seatHeight", label: "Seat height", meaning: "Top of the seat slab above the floor", component: "Legs, seat", unit: "cm", synonyms: ["seat height", "seat higher", "seat lower"], calculation: "Leg length geometry" },
    { key: "seatWidth", label: "Seat width", meaning: "Width of the seat slab and crest-rail span", component: "Seat slab, crest rail", unit: "cm", synonyms: ["seat width", "wider seat", "crest span"], calculation: "Seasonal movement estimate across the slab" },
    { key: "seatDepth", label: "Seat depth", meaning: "Front-to-back depth of the seat slab", component: "Seat slab", unit: "cm", synonyms: ["seat depth", "deeper seat"], calculation: "Seat geometry" },
    { key: "backHeight", label: "Back height", meaning: "Seat top to the crest rail; sets spindle and back-post length", component: "Back posts, spindles, crest rail", unit: "cm", synonyms: ["back height", "backrest height", "backrest length", "back length", "taller back", "spindle length"], calculation: "Spindle/post length geometry" },
    { key: "legSplay", label: "Leg splay", meaning: "Degrees each leg kicks out from vertical", component: "Legs", unit: "°", synonyms: ["leg splay", "splay", "leg angle", "rake of the legs"], calculation: "Footprint and drilling angle" },
    { key: "spindles", label: "Spindles", meaning: "Number of inner spindles between the two back posts", component: "Back", unit: "", synonyms: ["spindles", "spindle count", "number of spindles"], calculation: "Spindle gap geometry" },
    { key: "armHeight", label: "Arm height", meaning: "Armrest height above the seat at the back post", component: "Arms", unit: "cm", synonyms: ["arm height", "armrest height", "arms higher"], calculation: "Arm geometry" },
  ],
};

// Terms that sound like a parameter but match several real ones.
const AMBIGUOUS: Record<Typ, { term: RegExp; keys: string[] }[]> = {
  kangaroo: [
    { term: /\b(backrest|back)\s+(length|size)\b/, keys: ["backAngle", "backCurve"] },
    { term: /^(?!.*support).*\bspacing\b/, keys: ["supportSpacing", "seatWidth"] },
  ],
  japanese: [{ term: /^(?!.*spindle).*\bspacing\b/, keys: ["spindles", "seatWidth"] }],
};

// Terms that sound like a parameter but do not exist in this app.
const UNKNOWN: Record<Typ, { term: RegExp; closest: string[] }[]> = {
  kangaroo: [
    { term: /\brail\s+spacing\b|\bspacing\s+between\s+(the\s+)?rails\b/, closest: ["seatWidth", "supportSpacing"] },
    { term: /\bleg\s+splay\b|\bspindles?\b/, closest: ["supportSpacing"] },
  ],
  japanese: [
    { term: /\brail\s+spacing\b|\bsupport\s+spacing\b|\bkick-?\s?back\b|\bback\s*angle\b|\brecline\b/, closest: ["legSplay", "backHeight"] },
  ],
};

export type Resolution =
  | { kind: "resolved"; params: ParamDef[] }
  | { kind: "ambiguous"; term: string; options: ParamDef[] }
  | { kind: "unknown"; term: string; closest: ParamDef[] }
  | { kind: "none" };

const byKey = (t: Typ, k: string) => PARAM_DICTIONARY[t].find((p) => p.key === k)!;

export function resolveParams(question: string, typology: Typ): Resolution {
  const q = question.toLowerCase();
  for (const u of UNKNOWN[typology]) {
    const m = q.match(u.term);
    if (m) return { kind: "unknown", term: m[0], closest: u.closest.map((k) => byKey(typology, k)) };
  }
  const found = PARAM_DICTIONARY[typology].filter((p) => p.synonyms.some((s) => q.includes(s)));
  if (found.length) return { kind: "resolved", params: found };
  for (const a of AMBIGUOUS[typology]) {
    const m = q.match(a.term);
    if (m) return { kind: "ambiguous", term: m[0], options: a.keys.map((k) => byKey(typology, k)) };
  }
  return { kind: "none" };
}

export function describeParam(p: ParamDef, value: number | string | undefined) {
  return `${p.label} (${p.key}): ${p.meaning}. Component: ${p.component}. Current value: ${value ?? "n/a"}${p.unit ? " " + p.unit : ""}. Related calculation: ${p.calculation ?? "none"}.`;
}

export function clarifyReply(r: Extract<Resolution, { kind: "ambiguous" }>) {
  return `When you say "${r.term}", I'm not sure which you mean: ${r.options.map((o) => `${o.label.toLowerCase()} (${o.meaning.toLowerCase()})`).join(", or ")}. Which one should we look at?`;
}
