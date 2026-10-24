// Rule evaluation for the Japanese-inspired spindle-back armchair.
// Same contract as the Kangaroo rules: deterministic geometry facts + reviewed guidance.
import { J_BASELINE, type JapaneseParams, type JNumericParam } from "./params";
import { computeJapanese, type JGeometry } from "./geometry";
import type { JPartId } from "./parts";
import type { Observation, UserMeasurements } from "../consequences";

export type JConnectionId = "legJoints" | "armJoints";

export interface JConsequences {
  changed: JNumericParam[];
  geometry: Observation[];
  human: Observation[];
  craft: Observation[];
  affectedParts: JPartId[];
  misaligned: JConnectionId[];
  current: JGeometry;
  baseline: JGeometry;
}

/** Leg-splay change beyond this (degrees) means the baseline leg joints no longer align. */
export const J_SPLAY_TOLERANCE_DEG = 8;
/** Arm-slope change beyond this (degrees) means the arm joints must be re-laid out. */
export const J_ARM_TOLERANCE_DEG = 6;

const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "±") + f1(Math.abs(n));

export function computeJapaneseConsequences(
  p: JapaneseParams,
  base: JapaneseParams = J_BASELINE,
  user: UserMeasurements = {},
): JConsequences {
  const g = computeJapanese(p);
  const b = computeJapanese(base);
  const keys: JNumericParam[] = ["seatHeight", "seatWidth", "seatDepth", "backHeight", "legSplay", "spindles", "armHeight"];
  const changed = keys.filter((k) => Math.abs(p[k] - base[k]) > 1e-6);

  const geometry: Observation[] = [];
  const human: Observation[] = [];
  const craft: Observation[] = [];
  const misaligned: JConnectionId[] = [];

  if (Math.abs(p.legSplay - base.legSplay) > J_SPLAY_TOLERANCE_DEG) misaligned.push("legJoints");
  if (Math.abs(g.armSlope - b.armSlope) > J_ARM_TOLERANCE_DEG) misaligned.push("armJoints");

  if (changed.includes("seatHeight")) {
    const d = p.seatHeight - base.seatHeight;
    geometry.push({
      id: "jg-height",
      title: `Seat slab ${sign(d)} cm`,
      detail: `Legs become ${f1(g.legLength)} cm long (were ${f1(b.legLength)}). Overall height rises to ${f1(g.overallHeight)} cm.`,
      parts: ["legs", "seatSlab"],
    });
    human.push({
      id: "jh-height",
      title: d < 0 ? "Lower, more lounge-like" : "Toward dining height",
      detail:
        d < 0
          ? "Lower seats settle the sitter back but take more effort to rise from. Feel depends on the sitter's lower-leg length."
          : "Around 45 cm suits upright sitting at a table; this chair's character sits between dining and lounging.",
      parts: ["seatSlab"],
    });
  }

  if (user.poplitealHeight && user.poplitealHeight > 0) {
    const d = p.seatHeight - user.poplitealHeight;
    human.push({
      id: "jh-popliteal",
      title: `Seat is ${f1(Math.abs(d))} cm ${d <= 0 ? "below" : "above"} your knee height`,
      detail:
        d > 0
          ? "A hard slab front edge above the back of the knee can press on the underside of the thigh. A shaped front edge or cushion changes this."
          : "A seat below knee height lets the feet rest flat; the further below, the more the knees rise when seated.",
      parts: ["seatSlab"],
      attention: d > 0,
    });
  }

  if (changed.includes("seatWidth")) {
    const d = p.seatWidth - base.seatWidth;
    geometry.push({
      id: "jg-width",
      title: `Crest span ${sign(d)} cm`,
      detail: `Crest rail and seat slab become ${f1(p.seatWidth)} cm wide; footprint width ${f1(g.footprintWidth)} cm.`,
      parts: ["crestRail", "seatSlab", "arms"],
    });
    craft.push({
      id: "jc-width",
      title: "A wider crest bends more",
      detail:
        "Bending in the crest rail grows quickly with span. A wider chair asks for a stouter crest section, or the back will feel springy when leaned on.",
      parts: ["crestRail", "spindles"],
    });
    craft.push({
      id: "jc-width-movement",
      title: "More slab to move",
      detail: "A wider slab shrinks and swells more across the grain with the seasons; leg and spindle mortises must allow it.",
      parts: ["seatSlab", "connections"],
    });
  }

  if (changed.includes("seatDepth")) {
    const d = p.seatDepth - base.seatDepth;
    geometry.push({
      id: "jg-depth",
      title: `Slab ${sign(d)} cm deeper`,
      detail: `Arms lengthen to span the slab; footprint depth becomes ${f1(g.footprintDepth)} cm.`,
      parts: ["seatSlab", "arms", "legs"],
    });
    human.push({
      id: "jh-depth",
      title: d > 0 ? "Deeper seat" : "Shallower seat",
      detail:
        d > 0
          ? "Deeper seats can press behind the knees of shorter sitters or keep them from the backrest. It depends on thigh length."
          : "A shallower slab supports less of the thigh; taller sitters may feel perched.",
      parts: ["seatSlab"],
    });
  }

  if (changed.includes("backHeight")) {
    const d = p.backHeight - base.backHeight;
    geometry.push({
      id: "jg-back",
      title: `Back ${sign(d)} cm taller`,
      detail: `Overall height becomes ${f1(g.overallHeight)} cm; spindles grow to about ${f1(g.spindleLength)} cm.`,
      parts: ["spindles", "crestRail"],
    });
    craft.push({
      id: "jc-back",
      title: d > 0 ? "A longer lever on the crest joints" : "A stiffer, lower back",
      detail:
        d > 0
          ? "A taller back is a longer lever: the same lean at the crest multiplies into more force at the post-to-slab joints. Taller backs need deeper post mortises."
          : "A lower back shortens the lever, so the post joints work less hard — at the cost of upper-back support.",
      parts: ["connections", "spindles"],
      attention: d > 6,
    });
  }

  if (changed.includes("legSplay")) {
    const d = p.legSplay - base.legSplay;
    geometry.push({
      id: "jg-splay",
      title: `Legs splay ${sign(d)}°`,
      detail: `Footprint grows to ${f1(g.footprintWidth)} × ${f1(g.footprintDepth)} cm. Leg-to-seat angle becomes ${f1(g.legSeatAngle)}°.`,
      parts: ["legs", "connections"],
      attention: misaligned.includes("legJoints"),
    });
    craft.push({
      id: "jc-splay",
      title: misaligned.includes("legJoints") ? "Leg mortises must be re-angled" : "Compound angles shift",
      detail: misaligned.includes("legJoints")
        ? `The splay differs from the original by more than ${J_SPLAY_TOLERANCE_DEG}° — wedged tenons and mortises cut to the old compound angle would not seat.`
        : "Small splay changes still move the compound drilling angle of every leg mortise.",
      parts: ["connections", "legs"],
      attention: misaligned.includes("legJoints"),
    });
    human.push({
      id: "jh-splay",
      title: d > 0 ? "A wider, more planted stance" : "A straighter, quieter stance",
      detail:
        d > 0
          ? "More splay resists tipping and racking but spreads the footprint — the chair takes more floor and the legs grow longer."
          : "Less splay looks calmer and saves floor, but narrows the base the chair stands on.",
      parts: ["legs"],
    });
  }

  if (changed.includes("spindles")) {
    geometry.push({
      id: "jg-spindles",
      title: `Spindle spacing ${f1(g.spindleSpacing)} cm`,
      detail: `${p.spindles} inner spindles at ${f1(g.spindleSpacing)} cm centres (was ${f1(b.spindleSpacing)} cm).`,
      parts: ["spindles", "seatSlab"],
    });
    craft.push({
      id: "jc-spindles",
      title: p.spindles > base.spindles ? "More mortises near the slab edge" : "Each spindle carries more",
      detail:
        p.spindles > base.spindles
          ? "Every added spindle is another mortise close to the back edge of the slab — too many and the edge is weakened."
          : "Fewer spindles means each one, and each crest joint, carries a larger share when someone leans back.",
      parts: ["spindles", "connections"],
    });
  }

  if (changed.includes("armHeight")) {
    geometry.push({
      id: "jg-arms",
      title: `Arm slope ${f1(g.armSlope)}°`,
      detail: `Arm rises from ${f1(g.armFront.y)} cm at the front to ${f1(p.seatHeight + p.armHeight)} cm at the post (was ${f1(b.armSlope)}°).`,
      parts: ["arms", "connections"],
      attention: misaligned.includes("armJoints"),
    });
    human.push({
      id: "jh-arms",
      title: p.armHeight > base.armHeight ? "Higher arm support" : "Lower arm support",
      detail: "Arm height should relate to the sitter's elbow height seated; too high lifts the shoulders, too low gives no support. Bodies vary.",
      parts: ["arms"],
    });
    if (misaligned.includes("armJoints"))
      craft.push({
        id: "jc-arms",
        title: "Arm joints re-laid out",
        detail: `The arm slope changed by more than ${J_ARM_TOLERANCE_DEG}°, so the shoulder angles at both ends of the arm change with it.`,
        parts: ["connections", "arms"],
        attention: true,
      });
  }

  if (p.finish !== base.finish) {
    craft.push({
      id: "jc-finish",
      title: "Finish changes the making, not just the look",
      detail:
        "Black urushi-style lacquer is built up in many thin coats over a sealed surface and hides the grain; a clear oil finish shows every tool mark and demands cleaner surfacing.",
      parts: ["legs", "crestRail", "arms"],
    });
  }

  const affected = new Set<JPartId>();
  [...geometry, ...human, ...craft].forEach((o) => o.parts.forEach((pt) => affected.add(pt as JPartId)));
  if (misaligned.length) affected.add("connections");

  return { changed, geometry, human, craft, affectedParts: [...affected], misaligned, current: g, baseline: b };
}
