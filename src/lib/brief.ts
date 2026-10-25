// "Describe it → design". The AI never draws or calculates: it only picks settings for the Build-your-own
// engine (lab.ts). Whatever it returns is validated and clamped to the engine's slider ranges here, then the
// engine builds the 3D model and runs every test. If the AI is unavailable, `heuristicBrief` reads keywords.
import { z } from "zod";
import type { LabDesign } from "./lab";
import type { Setting } from "./weather";

/** Same ranges as the Build-your-own sliders. */
export const LAB_RANGES = {
  seatHeight: [30, 60],
  seatDepth: [30, 60],
  seatWidth: [34, 60],
  legThickness: [2, 5],
  splay: [0, 20],
  backAngle: [88, 130],
  backHeight: [15, 70],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * A sound starting chair that passes every test: the AI and the keyword reader change it rather than starting
 * from a flimsy blank. The legs spread 8° because in the tipping model a straight-legged chair with a back
 * tips at under half the reference lean.
 */
export const START: LabDesign = {
  base: "four", back: "slats", joint: "mt", wood: "oak",
  seatHeight: 45, seatDepth: 46, seatWidth: 44, backAngle: 102, backHeight: 40, legThickness: 3.6, splay: 8, stretchers: true,
};

const num = z.number().finite().nullable().optional();
/** What the AI is allowed to send back. Anything else is ignored. */
export const BriefSchema = z.object({
  name: z.string().max(60).nullable().optional(),
  summary: z.string().max(400).nullable().optional(),
  base: z.enum(["four", "splayed", "sled", "zframe"]).nullable().optional(),
  back: z.enum(["none", "slats", "spindles", "panel"]).nullable().optional(),
  joint: z.enum(["mt", "dowel", "wedged", "screw"]).nullable().optional(),
  wood: z.enum(["oak", "ash", "walnut", "pine"]).nullable().optional(),
  setting: z.enum(["indoor", "covered", "outdoor"]).nullable().optional(),
  seatHeight: num, seatDepth: num, seatWidth: num, backAngle: num, backHeight: num, legThickness: num, splay: num,
  stretchers: z.boolean().nullable().optional(),
  cannotDo: z.array(z.string().max(160)).max(5).nullable().optional(),
});
export type RawBrief = z.infer<typeof BriefSchema>;

export interface Brief {
  name: string;
  summary: string;
  design: LabDesign;
  setting: Setting;
  /** Things asked for that this engine can't build (e.g. rockers, armrests). Shown honestly, never faked. */
  cannotDo: string[];
  /** Values the engine had to pull back into range. */
  clamped: string[];
}

const LABELS: Record<keyof typeof LAB_RANGES, string> = {
  seatHeight: "seat height", seatDepth: "seat depth", seatWidth: "seat width", legThickness: "leg thickness", splay: "leg splay", backAngle: "back angle", backHeight: "back height",
};

/** Validates and clamps an AI (or keyword) answer onto a starting design. Never throws. */
export function toBrief(raw: unknown, base: LabDesign = START, baseSetting: Setting = "indoor"): Brief {
  const parsed = BriefSchema.safeParse(raw);
  const r: RawBrief = parsed.success ? parsed.data : {};
  const d: LabDesign = { ...base };
  if (r.base) d.base = r.base;
  if (r.back) d.back = r.back;
  if (r.joint) d.joint = r.joint;
  if (r.wood) d.wood = r.wood;
  if (typeof r.stretchers === "boolean") d.stretchers = r.stretchers;
  const clamped: string[] = [];
  for (const k of Object.keys(LAB_RANGES) as (keyof typeof LAB_RANGES)[]) {
    const v = r[k];
    if (typeof v !== "number") continue;
    const [lo, hi] = LAB_RANGES[k];
    const step = k === "legThickness" ? 10 : 1;
    const c = Math.round(Math.min(hi, Math.max(lo, v)) * step) / step;
    if (Math.abs(c - v) > 0.5 / step) clamped.push(`${LABELS[k]} kept to ${c}${k === "splay" || k === "backAngle" ? "°" : " cm"} (asked ${Math.round(v * 10) / 10})`);
    d[k] = c;
  }
  // A Z-frame is drawn with its own fixed members, and a sled has runners: splay means nothing there.
  if (d.base !== "splayed" && d.base !== "four") d.splay = 0;
  if (d.base === "splayed" && d.splay === 0) d.splay = 8;
  return {
    name: (r.name ?? "").trim() || "My chair",
    summary: (r.summary ?? "").trim(),
    design: d,
    setting: r.setting ?? baseSetting,
    cannotDo: (r.cannotDo ?? []).map((s) => s.trim()).filter(Boolean),
    clamped,
  };
}

/**
 * Is this a change to the chair on the bench ("make it taller", "add a back") or a new chair ("a patio chair")?
 * New descriptions start from the sound START chair, not from whatever happens to be on the bench.
 */
export function isChange(text: string): boolean {
  return /^\s*(make|change|turn|switch|swap|use|add|remove|drop|give|put|keep|set|lower|raise|widen|narrow|shorten|lengthen|now|and|also|but|instead|more|less|bigger|smaller|taller|shorter|wider|narrower|deeper|shallower|it|its|it's|this|same)\b/i.test(text);
}

/** Height words → centimetres: "6'2", "6 ft 2", "188 cm", "1.88 m". */
export function heightCm(text: string): number | null {
  const ft = text.match(/(\d)\s*(?:'|’|ft|feet|foot)\s*(\d{1,2})?\s*(?:"|”|in|inches)?/i);
  if (ft) return Math.round((Number(ft[1]) * 12 + Number(ft[2] ?? 0)) * 2.54);
  const cm = text.match(/(1\d{2}|2[0-2]\d)\s*cm/i);
  if (cm) return Number(cm[1]);
  const m = text.match(/\b(1\.\d{1,2}|2\.[0-2]\d?)\s*m\b/i);
  if (m) return Math.round(Number(m[1]) * 100);
  return null;
}

/** Seat height for a person: about a quarter of their height (knee height plus shoe, a common rule of thumb). */
export const seatForHeight = (cm: number) => Math.round(Math.min(LAB_RANGES.seatHeight[1], Math.max(LAB_RANGES.seatHeight[0], cm * 0.25)));

const UNSUPPORTED: [RegExp, string][] = [
  [/rock(ing|er)/i, "rockers (curved runners)"],
  [/arm ?rests?|armchair|\barms\b/i, "armrests"],
  [/swivel|wheel|castor|caster/i, "swivel or wheels"],
  [/upholster|cushion|padded|fabric/i, "upholstery"],
  [/fold(ing|able)/i, "folding"],
  [/metal|steel|plastic|aluminium|aluminum/i, "non-wood materials"],
  [/bench|sofa|couch|table|bed|desk|shelf|stool for two/i, "furniture other than a single chair"],
];

/** Keyword reader used when the AI is unavailable, so the demo never shows an error. */
export function heuristicBrief(text: string, base: LabDesign = START, baseSetting: Setting = "indoor"): Brief {
  const t = text.toLowerCase();
  const raw: RawBrief = {};
  const notes: string[] = [];
  if (/outdoor|outside|patio|garden|deck|balcony|porch|backyard/.test(t)) raw.setting = /porch|covered|veranda/.test(t) ? "covered" : "outdoor";
  if (/walnut/.test(t)) raw.wood = "walnut";
  else if (/\bash\b/.test(t)) raw.wood = "ash";
  else if (/pine|cheap|budget/.test(t)) raw.wood = "pine";
  else if (/oak/.test(t) || raw.setting) raw.wood = "oak";
  if (/japan|windsor|stick ?chair|spindle/.test(t)) { raw.base = "splayed"; raw.back = "spindles"; raw.joint = "wedged"; raw.splay = 8; notes.push("splayed legs wedged through the seat"); }
  if (/kangaroo|z-?frame|cantilever/.test(t)) raw.base = "zframe";
  if (/sled|runner/.test(t)) raw.base = "sled";
  if (/stool|no back|backless/.test(t)) raw.back = "none";
  else if (base.back === "none" && /chair/.test(t)) raw.back = "slats";
  else if (/panel|solid back/.test(t)) raw.back = "panel";
  else if (/ladder|slat|nordic|scandi|shaker|farmhouse/.test(t)) raw.back = "slats";
  if (/lounge|relax|reading|recline|laid[- ]back/.test(t)) { raw.backAngle = 110; raw.seatHeight = 40; raw.seatDepth = 48; }
  if (/dining|desk|work|kitchen/.test(t)) { raw.backAngle = 100; raw.seatHeight = 45; }
  if (/kid|child|toddler/.test(t)) { raw.seatHeight = 30; raw.seatWidth = 34; raw.seatDepth = 30; raw.backHeight = 25; }
  if (/bar|counter/.test(t)) raw.seatHeight = 60;
  if (/sturdy|strong|heavy|solid|durable/.test(t)) { raw.legThickness = 4.2; raw.stretchers = true; raw.joint = raw.joint ?? "mt"; }
  if (/light|minimal|delicate|slim/.test(t)) raw.legThickness = 3;
  if (/modern|minimal|clean/.test(t) && !raw.back) raw.back = "slats";
  if (/wide|big|large|broad/.test(t)) { raw.seatWidth = 52; raw.seatDepth = raw.seatDepth ?? 46; }
  const h = heightCm(text);
  if (h && !/kid|child|bar|counter/.test(t)) { raw.seatHeight = seatForHeight(h); if (h > 183) { raw.seatDepth = Math.max(raw.seatDepth ?? 0, 46); raw.backHeight = 46; } }
  raw.cannotDo = UNSUPPORTED.filter(([re]) => re.test(t)).map(([, s]) => s);
  const where = (raw.setting ?? baseSetting) === "outdoor" ? "for outdoors" : (raw.setting ?? baseSetting) === "covered" ? "for a covered porch" : "for indoors";
  const woodName = { oak: "white oak", ash: "ash", walnut: "walnut", pine: "pine" }[raw.wood ?? base.wood];
  raw.summary = `A ${woodName} chair ${where}${h ? `, seat set for someone ${h} cm tall` : ""}${notes.length ? `, ${notes.join(", ")}` : ""}.`;
  raw.name = /patio|garden|deck/.test(t) ? "Patio chair" : /kid|child/.test(t) ? "Kid's chair" : /lounge|reading/.test(t) ? "Reading chair" : /dining|kitchen/.test(t) ? "Dining chair" : "My chair";
  return toBrief(raw, base, baseSetting);
}

/** What the AI is told. It describes the engine honestly so the AI only picks things that exist. */
export const BRIEF_SYSTEM = `You translate a person's description of a chair into settings for a chair design engine.
You do NOT design shapes or calculate strength: the engine builds the 3D model and tests it. You only choose settings.
Return ONLY a JSON object with these keys (omit or null any you have no reason to change from the CURRENT design):
name: short name, e.g. "Patio dining chair"
summary: one plain sentence describing the chair you chose and why, for a non-woodworker
base: "four" (four straight legs) | "splayed" (legs angled out, Japanese/Windsor style) | "sled" (side runners on the floor) | "zframe" (modernist Z-shaped side frame that kicks back)
back: "none" (a stool) | "slats" (horizontal boards) | "spindles" (thin round sticks) | "panel" (one solid board)
joint: "mt" (mortise and tenon, strongest) | "wedged" (wedged round tenon, for splayed legs) | "dowel" | "screw" (weakest; only if asked)
wood: "oak" | "ash" | "walnut" | "pine"   (outdoors prefer oak or walnut: ash and pine rot)
setting: "indoor" | "covered" | "outdoor"
seatHeight cm 30-60 (dining 44-46; lounge 38-42; bar 60; small child 30; for a tall person about a quarter of their height)
seatDepth cm 30-60, seatWidth cm 34-60, backAngle degrees 88-130 (seat-to-back: 100 dining, 108-115 lounge), backHeight cm 15-70,
legThickness cm 2-5, splay degrees 0-20 (only for "splayed"), stretchers true|false (low bars between legs; add them for sturdy chairs)
cannotDo: list anything asked for that this engine cannot build (it only makes single wooden chairs from the parts above: no rockers, armrests, upholstery, swivels, metal, benches or tables). Never pretend.
Convert feet/inches to cm. Prefer sturdy, sensible choices when the person doesn't say. Never invent strength claims.`;
