// Component Lab: build a chair from blank parts, then test it with simple rules.
// Statics are 2D side-view approximations — teaching numbers, not a strength certificate.
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

export const WOODS: Record<Wood, { name: string; strength: number; note: string }> = {
  oak: { name: "White oak", strength: 1.0, note: "Strong, steam-bends well." },
  ash: { name: "Ash", strength: 1.0, note: "Tough and springy — the classic chair wood." },
  walnut: { name: "Walnut", strength: 0.8, note: "Beautiful, but brittler in thin parts." },
  pine: { name: "Pine", strength: 0.5, note: "Soft: joints crush and wear loose." },
};
export const JOINT_FACTOR: Record<JointType, { name: string; f: number }> = {
  mt: { name: "Mortise & tenon", f: 1.0 },
  wedged: { name: "Wedged round tenon", f: 0.95 },
  dowel: { name: "Dowels", f: 0.6 },
  screw: { name: "Butt + screws", f: 0.3 },
};

export type Level = "good" | "warn" | "bad";
export interface LabResult { area: string; level: Level; title: string; detail: string }

const rad = (d: number) => (d * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Rear tipping margin (cm) when a sitter leans back hard: positive = stable. */
export function tipMargin(d: LabDesign) {
  const recline = d.back === "none" ? 0 : Math.max(0, d.backAngle - 90 - 5);
  // Leaning sitter's weight shifts back with recline (≈0.6 cm per degree beyond upright, teaching approximation).
  const comX = d.seatDepth * 0.65 + recline * 0.6 + (d.back === "none" ? 0 : 3);
  const footSpread = Math.tan(rad(d.splay)) * d.seatHeight;
  const baseRear =
    d.base === "sled" ? d.seatDepth + 4 : d.base === "zframe" ? d.seatDepth + 14 : d.seatDepth + footSpread;
  return r1(baseRear - comX);
}

/** Racking demand vs resistance: 0–1+ (above 1 = will loosen). */
export function rackingIndex(d: LabDesign) {
  const lever = d.seatHeight / 45;
  const legs = d.base === "sled" || d.base === "zframe" ? 0.6 : 1;
  const stretch = d.stretchers ? 0.55 : 1;
  const section = Math.pow(3.5 / d.legThickness, 2);
  const resist = JOINT_FACTOR[d.joint].f * WOODS[d.wood].strength;
  return r1((lever * legs * stretch * section * 0.6) / resist);
}

export function evaluateLab(d: LabDesign): LabResult[] {
  const out: LabResult[] = [];
  const tm = tipMargin(d);
  out.push(tm < 0
    ? { area: "Stability", level: "bad", title: `Tips backward (${tm} cm short)`, detail: "When the sitter leans back, their weight passes behind the rear feet. Splay the back legs, lengthen the base, or reduce recline." }
    : tm < 4 ? { area: "Stability", level: "warn", title: `Marginal (${tm} cm to spare)`, detail: "A hard lean-back gets close to the tipping point. A few degrees of rear splay buys real safety." }
    : { area: "Stability", level: "good", title: `Stable (${tm} cm to spare)`, detail: "Rear feet sit well behind the sitter's leaning weight." });

  const ri = rackingIndex(d);
  out.push(ri > 1
    ? { area: "Joints", level: "bad", title: `Will rack loose (index ${ri})`, detail: `${JOINT_FACTOR[d.joint].name} in ${WOODS[d.wood].name.toLowerCase()} can't resist the leverage of a ${d.seatHeight} cm leg${d.stretchers ? "" : " with no stretchers"}. Use mortise & tenon or wedged tenons, add stretchers, or thicken legs.` }
    : ri > 0.7 ? { area: "Joints", level: "warn", title: `Will loosen over years (index ${ri})`, detail: "Fine on day one; daily rocking slowly works it loose. Stretchers or a stronger joint add margin." }
    : { area: "Joints", level: "good", title: `Holds (index ${ri})`, detail: "Joint and wood resist the leg leverage with margin." });

  if (d.legThickness < 2.8) out.push({ area: "Parts", level: d.legThickness < 2.4 ? "bad" : "warn", title: "Thin legs", detail: `At ${d.legThickness} cm there's little wood left around a joint — walls blow out. Most chair legs are 3.2–4.5 cm.` });

  const h = d.seatHeight;
  out.push(h < 36 || h > 50
    ? { area: "Comfort", level: "bad", title: `Seat height ${h} cm`, detail: h < 36 ? "Too low for most adults to rise from easily (lounge chairs go ~36–40)." : "Feet dangle; the front edge presses behind the knees." }
    : h > 47 || h < 40 ? { area: "Comfort", level: "warn", title: `Seat height ${h} cm`, detail: "Usable, but outside the 40–47 cm dining range — fine only if it's a lounge or bar chair by intent." }
    : { area: "Comfort", level: "good", title: `Seat height ${h} cm`, detail: "In the 40–47 cm range that fits most adults." });

  if (d.seatDepth > 48) out.push({ area: "Comfort", level: "warn", title: "Deep seat", detail: "Shorter sitters can't reach the back without the seat edge hitting their knees." });
  if (d.back === "none") out.push({ area: "Comfort", level: "warn", title: "Stool, not a chair", detail: "No back means no lumbar support. Add slats, spindles or a panel to test a real chair." });
  else {
    const a = d.backAngle;
    out.push(a < 95 || a > 120
      ? { area: "Comfort", level: "bad", title: `Back angle ${a}°`, detail: a < 95 ? "Bolt upright: pushes the sitter forward." : "So reclined you'll need a footrest to stay in it." }
      : { area: "Comfort", level: "good", title: `Back angle ${a}°`, detail: a > 108 ? "Lounge recline." : "Dining/work posture." });
    if (d.back === "panel") out.push({ area: "Wood movement", level: "warn", title: "Solid back panel", detail: "A wide panel moves ~1 cm across the grain seasonally. Float it in a groove; never glue it all round." });
    if (d.back === "spindles" && d.base === "four" && d.joint === "screw") out.push({ area: "Craft", level: "warn", title: "Mixed construction", detail: "Spindle backs are drilled into a solid seat — that's a wedged-tenon chair. Screws undercut the whole idea." });
  }
  if (d.joint === "wedged" && d.base !== "splayed") out.push({ area: "Craft", level: "warn", title: "Wedged tenons want a solid seat", detail: "Wedged round tenons work best through a thick slab with splayed legs (Windsor / Japanese tradition)." });
  if (d.splay > 14) out.push({ area: "Parts", level: "warn", title: `Splay ${d.splay}°`, detail: "Feet stick out into walkways, and the angled socket leaves short grain at the seat edge." });
  return out;
}

export function labScore(rs: LabResult[]) {
  const pts = rs.reduce((s, r) => s + (r.level === "good" ? 2 : r.level === "warn" ? 1 : 0), 0);
  return Math.round((pts / (rs.length * 2)) * 100);
}
