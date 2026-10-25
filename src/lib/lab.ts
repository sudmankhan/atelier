// Component Lab: build a chair from blank parts, then test it.
// Stability = static torque model with the chair's own weight; joints = portal-method racking moment on the
// joint section vs a USDA-derived reference stress. Teaching numbers under stated loads, not a strength certificate.
import { DEFAULT_PUSH_HEIGHT_CM, combineWeights, defaultComZ, labRearPivotZ, leverArm, tippingStatics, type StaticsResult } from "./statics";
import { labMass, type ChairMass } from "./chair/chairMass";
import { DEFAULT_LOADS, type LoadCase } from "./chair/loads";
import { jointStress, type JointStress } from "./chair/jointStress";
import { movementMm, DEFAULT_DELTA_MC } from "./chair/movement";
import { WOOD_PROPERTIES } from "./chair/woodProperties";
import { DELTA_MC, weatherResults, type Setting } from "./weather";

export type Base = "four" | "splayed" | "sled" | "zframe";
export type Back = "none" | "slats" | "spindles" | "panel";
export type JointType = "mt" | "dowel" | "wedged" | "screw";
export type Wood = "oak" | "ash" | "walnut" | "pine";

export interface LabDesign {
  base: Base; back: Back; joint: JointType; wood: Wood;
  seatHeight: number; seatDepth: number; seatWidth: number;
  backAngle: number; // seat-to-back included angle, degrees
  backHeight: number; legThickness: number; splay: number; stretchers: boolean;
}

export const BLANK: LabDesign = {
  base: "four", back: "none", joint: "screw", wood: "pine",
  seatHeight: 45, seatDepth: 40, seatWidth: 42, backAngle: 100, backHeight: 40, legThickness: 3, splay: 0, stretchers: false,
};

export const WOODS: Record<Wood, { name: string; note: string }> = {
  oak: { name: "White oak", note: "Strong, steam-bends well." },
  ash: { name: "Ash", note: "Tough and springy — the classic chair wood." },
  walnut: { name: "Walnut", note: "Beautiful, a little weaker than oak or ash." },
  pine: { name: "Pine", note: "Soft and light: about half the bending strength of oak, and joints crush and wear loose." },
};
export const JOINT_TYPES: Record<JointType, { name: string }> = {
  mt: { name: "Mortise & tenon" },
  wedged: { name: "Wedged round tenon" },
  dowel: { name: "Dowels" },
  screw: { name: "Butt + screws" },
};

export type Level = "good" | "warn" | "bad";
/** calculated = from geometry/statics/USDA data; assumption = calculated but driven by an assumed load; rule = shop rule of thumb */
export type Basis = "calculated" | "assumption" | "rule";
export interface LabResult { area: string; level: Level; title: string; detail: string; basis: Basis }
export interface LabUser { poplitealHeight?: number; /** where the chair will live; adds weather checks */ setting?: Setting }

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The hidden part that carries a leg-to-seat joint, sized exactly as LabModel draws it.
 * Mortise & tenon: ⅓-thick tenon, 0.8 × leg wide. Wedged: round tenon 0.6 × leg (the ½–⅔ rule). Dowel: one ⌀0.9 cm.
 */
export function labJointSize(d: LabDesign) {
  const T = d.legThickness;
  if (d.joint === "mt") return { round: false, t: T / 3, w: T * 0.8, len: 3.5 };
  if (d.joint === "wedged") return { round: true, t: T * 0.6, w: T * 0.6, len: 3.5 };
  if (d.joint === "dowel") return { round: true, t: 0.9, w: 0.9, len: 4 };
  return { round: true, t: 0.4, w: 0.4, len: 6 };
}

/** Section modulus (cm³) of the joint section, or null for screws (withdrawal-governed, not modelled). */
export function labJointSection(d: LabDesign): number | null {
  if (d.joint === "screw") return null;
  const s = labJointSize(d);
  // Rectangular tenon: racking may come from any direction, so use the weaker (flat) axis.
  return s.round ? (Math.PI * s.t ** 3) / 32 : (s.w * s.t * s.t) / 6;
}

/** Whole-chair tipping: sitter (recline-aware) + chair self-weight, backward lean at the top of the back. */
export function labTipping(d: LabDesign, L: LoadCase = DEFAULT_LOADS): { result: StaticsResult; mass: ChairMass; comZ: number; occupantZ: number; pivotZ: number; pushHeightCm: number } {
  const mass = labMass(d);
  const recline = d.back === "none" ? 0 : d.backAngle - 90;
  const occupantZ = defaultComZ(-d.seatDepth / 2, d.seatDepth / 2, L.comFraction, recline);
  const both = combineWeights({ W: L.seatN, z: occupantZ }, { W: mass.N, z: mass.comZ });
  const pivotZ = labRearPivotZ(d);
  const pushHeightCm = d.back === "none" ? DEFAULT_PUSH_HEIGHT_CM : d.seatHeight + Math.cos((recline * Math.PI) / 180) * d.backHeight;
  const r = tippingStatics({ W: both.W, d: leverArm(both.z, pivotZ), F: L.leanN, h: pushHeightCm / 100 });
  if (!r.ok) throw new Error(r.error);
  return { result: r, mass, comZ: both.z, occupantZ, pivotZ, pushHeightCm };
}

/**
 * Racking moment (N·m) at each leg-to-seat joint, portal method with pinned feet: each of the 4 legs takes rack/4.
 * Stretchers at 0.35 of the leg height take the lower part; sled runners fix the feet (inflection at mid-height).
 */
export function labRackingMoment(d: LabDesign, L: LoadCase = DEFAULT_LOADS) {
  const H = d.seatHeight / 100;
  const per = L.rackN / 4;
  if (d.base === "sled") return per * (H / 2);
  if (d.base === "zframe") return per * (H - 0.08);
  return per * (d.stretchers ? H * 0.65 : H);
}

export function labJointStress(d: LabDesign, L: LoadCase = DEFAULT_LOADS): (JointStress & { moment: number; sectionCm3: number }) | null {
  const S = labJointSection(d);
  if (S === null) return null;
  const moment = labRackingMoment(d, L);
  return { moment, sectionCm3: S, ...jointStress(moment, S, d.wood) };
}

export function evaluateLab(d: LabDesign, user: LabUser = {}, L: LoadCase = DEFAULT_LOADS): LabResult[] {
  const out: LabResult[] = [];

  const tip = labTipping(d, L);
  const t = tip.result;
  // Graded by the backward push it takes to tip: < ½ the reference lean = a gentle lean tips it.
  const thr = t.thresholdF ?? 0;
  const why = `Sitter + ${r1(tip.mass.kg)} kg chair, combined weight ${r1(Math.abs(tip.comZ - tip.pivotZ))} cm ${tip.comZ < tip.pivotZ ? "behind" : "in front of"} the rear feet, push ${r0(tip.pushHeightCm)} cm up.`;
  out.push(
    thr < L.leanN / 2
      ? { area: "Stability", level: "bad", basis: "assumption", title: thr <= 0 ? "Tips with no push at all" : `Tips at only ${r0(thr)} N of lean`, detail: `${why} A gentle lean (under half the ${L.leanN} N reference) tips it. Splay the back legs, move the rear feet back, or reduce recline.` }
      : thr < L.leanN
        ? { area: "Stability", level: "warn", basis: "assumption", title: `Tips at ${r0(thr)} N of lean`, detail: `${why} Fine for normal sitting, but a hard lean (the ${L.leanN} N reference) would tip it. More rear splay adds margin.` }
        : { area: "Stability", level: "good", basis: "assumption", title: `Tips only past ${r0(thr)} N of lean`, detail: `${why} Holds the ${L.leanN} N reference lean. Static model; not a proof of stability.` },
  );

  const js = labJointStress(d, L);
  if (!js) {
    out.push({ area: "Joints", level: "bad", basis: "rule", title: "Screwed butt joints: not calculated", detail: "A butt joint relies on the screws' grip in the wood (withdrawal strength, Wood Handbook Ch. 8), which this app doesn't model. Shop experience: screwed chair legs work loose under daily racking. Use mortise & tenon or wedged tenons." });
  } else {
    const pct = r0(js.utilisation * 100);
    const what = `${JOINT_TYPES[d.joint].name} in ${WOODS[d.wood].name.toLowerCase()}: ${r1(js.moment)} N·m racking on a ${r1(js.sectionCm3)} cm³ section → ${r1(js.stressMPa)} MPa, ${pct}% of the ${r1(js.refMPa)} MPa reference.`;
    out.push(
      js.level === "high"
        ? { area: "Joints", level: "bad", basis: "assumption", title: `Racking stress above reference (${pct}%)`, detail: `${what} Add stretchers, thicken legs or use a bigger joint.` }
        : js.level === "watch"
          ? { area: "Joints", level: "warn", basis: "assumption", title: `Racking stress ${pct}% of reference`, detail: `${what} Daily rocking may loosen it over time; stretchers add margin.` }
          : { area: "Joints", level: "good", basis: "assumption", title: `Racking stress ${pct}% of reference`, detail: `${what} Not a tested result.` },
    );
  }

  if (d.legThickness < 2.8) out.push({ area: "Parts", level: d.legThickness < 2.4 ? "bad" : "warn", basis: "rule", title: "Thin legs", detail: `At ${d.legThickness} cm there's little wood left around a joint, so mortise walls may blow out. Most chair legs are 3.2–4.5 cm.` });

  const h = d.seatHeight;
  if (user.poplitealHeight && user.poplitealHeight > 0) {
    const diff = h - user.poplitealHeight;
    out.push(diff > 0
      ? { area: "Comfort", level: "warn", basis: "calculated", title: `Seat ${r1(diff)} cm above your knee height`, detail: "The seat front would press under your thighs. Shoes add a little height; aim for at or just below your knee height." }
      : { area: "Comfort", level: diff < -10 ? "warn" : "good", basis: "calculated", title: `Seat ${r1(-diff)} cm below your knee height`, detail: diff < -10 ? "Your knees will rise well above the seat — lounge territory, harder to stand from." : "Feet flat, no pressure under the thigh." });
  } else {
    out.push(h < 36 || h > 50
      ? { area: "Comfort", level: "bad", basis: "rule", title: `Seat height ${h} cm`, detail: h < 36 ? "Too low for most adults to rise from easily (lounge chairs go ~36–40)." : "Feet dangle; the front edge presses behind the knees." }
      : h > 47 || h < 40 ? { area: "Comfort", level: "warn", basis: "rule", title: `Seat height ${h} cm`, detail: "Usable, but outside the 40–47 cm dining range — fine only if it's a lounge or bar chair by intent. Enter your knee height for a personal check." }
      : { area: "Comfort", level: "good", basis: "rule", title: `Seat height ${h} cm`, detail: "In the 40–47 cm range that fits most adults. Enter your knee height for a personal check." });
  }

  if (d.seatDepth > 48) out.push({ area: "Comfort", level: "warn", basis: "rule", title: "Deep seat", detail: "Shorter sitters can't reach the back without the seat edge hitting their knees." });
  if (d.back === "none") out.push({ area: "Comfort", level: "warn", basis: "rule", title: "Stool, not a chair", detail: "No back means no lumbar support. Add slats, spindles or a panel to test a real chair." });
  else {
    const a = d.backAngle;
    out.push(a < 95 || a > 120
      ? { area: "Comfort", level: "bad", basis: "rule", title: `Back angle ${a}°`, detail: a < 95 ? "Bolt upright: pushes the sitter forward." : "So reclined you'll need a footrest to stay in it." }
      : { area: "Comfort", level: "good", basis: "rule", title: `Back angle ${a}°`, detail: a > 108 ? "Lounge recline." : "Dining/work posture." });
    if (d.back === "panel") {
      const width = d.seatWidth - 7;
      const dmc = DELTA_MC[user.setting ?? "indoor"];
      const mm = movementMm(width, d.wood, dmc);
      out.push({ area: "Wood movement", level: "warn", basis: dmc === DEFAULT_DELTA_MC ? "calculated" : "assumption", title: `Solid back panel moves ≈ ${r1(mm)} mm`, detail: `A ${r0(width)} cm flatsawn ${WOOD_PROPERTIES[d.wood].commonName.toLowerCase()} panel changes ${r1(mm)} mm across the grain over a ${dmc}-point moisture swing (Wood Handbook Eq. 13–2). Float it in a groove; never glue it all round.` });
    }
    if (d.back === "spindles" && d.base === "four" && d.joint === "screw") out.push({ area: "Craft", level: "warn", basis: "rule", title: "Mixed construction", detail: "Spindle backs are drilled into a solid seat — that's a wedged-tenon chair. Screws undercut the whole idea." });
  }
  if (d.joint === "wedged" && d.base !== "splayed") out.push({ area: "Craft", level: "warn", basis: "rule", title: "Wedged tenons want a solid seat", detail: "Wedged round tenons work best through a thick slab with splayed legs (Windsor / Japanese tradition)." });
  if (d.splay > 14) out.push({ area: "Parts", level: "warn", basis: "rule", title: `Splay ${d.splay}°`, detail: "Feet stick out into walkways, and the angled socket leaves short grain at the seat edge." });
  if (user.setting) out.push(...weatherResults({ wood: d.wood, joint: d.joint, seatWidthCm: d.seatWidth }, user.setting));
  return out;
}
