// Rule evaluation: deterministic geometry facts + reviewed educational guidance.
// No safety scores, no comfort guarantees.
import { BASELINE, type ChairParams, type NumericParam } from "./params";
import { backBowCm, computeGeometry, type ChairGeometry } from "./geometry";
import type { AnyPartId, PartId } from "./parts";

export type ConnectionId = "frontJoint" | "rearJoint" | "railJoints" | "backTopJoint";

export interface Observation {
  id: string;
  title: string;
  detail: string;
  parts: AnyPartId[];
  attention?: boolean;
}

export interface Consequences {
  changed: NumericParam[];
  geometry: Observation[];
  human: Observation[];
  craft: Observation[];
  affectedParts: AnyPartId[];
  misaligned: ConnectionId[];
  current: ChairGeometry;
  baseline: ChairGeometry;
}

/** Joint angle changes beyond this (degrees) mean the baseline joinery no longer aligns. */
export const JOINT_TOLERANCE_DEG = 10;

const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "±") + f1(Math.abs(n));

export interface UserMeasurements {
  poplitealHeight?: number; // floor to back of knee, seated, cm
}

export function computeConsequences(
  p: ChairParams,
  base: ChairParams = BASELINE,
  user: UserMeasurements = {},
): Consequences {
  const g = computeGeometry(p);
  const b = computeGeometry(base);
  const keys: NumericParam[] = ["seatHeight", "seatWidth", "seatDepth", "backAngle", "supportSpacing", "backCurve"];
  const changed = keys.filter((k) => Math.abs(p[k] - base[k]) > 1e-6);

  const geometry: Observation[] = [];
  const human: Observation[] = [];
  const craft: Observation[] = [];
  const misaligned: ConnectionId[] = [];

  const dRear = g.rearJointAngle - b.rearJointAngle;
  const dFront = g.frontJointAngle - b.frontJointAngle;
  const dRearLeg = g.rearLegAngle - b.rearLegAngle;
  if (Math.abs(dRear) > JOINT_TOLERANCE_DEG) misaligned.push("rearJoint");
  if (Math.abs(dFront) > JOINT_TOLERANCE_DEG) misaligned.push("frontJoint");
  if (Math.abs(dRearLeg) > JOINT_TOLERANCE_DEG) misaligned.push("railJoints");
  if (Math.abs(p.backAngle - base.backAngle) > JOINT_TOLERANCE_DEG || Math.abs(p.backCurve - base.backCurve) > 0.5)
    misaligned.push("backTopJoint");

  if (changed.includes("seatHeight")) {
    const d = p.seatHeight - base.seatHeight;
    geometry.push({
      id: "g-height",
      title: `Seat front ${sign(d)} cm`,
      detail: `Front leg length becomes ${f1(g.frontLegLength)} cm (was ${f1(b.frontLegLength)}). Back top rises to ${f1(g.backTop.y)} cm.`,
      parts: ["sideFrame", "seat", "connections"],
    });
    human.push({
      id: "h-height",
      title: d < 0 ? "Lower, more reclined sitting" : "Higher, more upright entry",
      detail:
        d < 0
          ? "Lower seats suit lounging but generally take more effort to rise from. How it feels depends on the sitter's lower-leg length."
          : "A higher seat is generally easier to sit down on and rise from, but it moves away from the low lounging character of the original.",
      parts: ["seat"],
    });
    craft.push({
      id: "c-height",
      title: "New side-frame template",
      detail: `The front leg changes length by ${sign(g.frontLegLength - b.frontLegLength)} cm, so the full-size side-frame template and blank length change.`,
      parts: ["sideFrame"],
    });
  }

  if (user.poplitealHeight && user.poplitealHeight > 0) {
    const d = p.seatHeight - user.poplitealHeight;
    human.push({
      id: "h-popliteal",
      title: `Seat front is ${f1(Math.abs(d))} cm ${d <= 0 ? "below" : "above"} your knee height`,
      detail:
        d > 0
          ? "A seat front above the back of the knee can press on the underside of the thigh. Cushioning and shoes change this."
          : "For a lounge chair a seat below knee height is expected; the further below, the more the knees rise and the harder it may be to stand.",
      parts: ["seat"],
      attention: d > 0,
    });
  }

  if (changed.includes("seatWidth")) {
    const d = p.seatWidth - base.seatWidth;
    geometry.push({
      id: "g-width",
      title: `Side frames ${sign(d)} cm apart`,
      detail: `Rails and seat cross-members become ${f1(g.railLength)} cm. Footprint width is ${f1(g.footprintWidth)} cm.`,
      parts: ["rails", "seat", "backrest", "sideFrame"],
    });
    human.push({
      id: "h-width",
      title: d > 0 ? "More room to shift posture" : "A closer, more enclosing seat",
      detail: "Width affects how freely a sitter can shift position. Whether it fits a particular person depends on hip width, which we don't know.",
      parts: ["seat"],
    });
    craft.push({
      id: "c-width",
      title: "Every cross-member changes length",
      detail: `All rails, seat and back cross-members must be recut to ${f1(g.railLength)} cm (shoulder to shoulder). Longer spans flex more under the same load.`,
      parts: ["rails", "seat", "backrest"],
    });
  }

  if (changed.includes("seatDepth")) {
    const d = p.seatDepth - base.seatDepth;
    geometry.push({
      id: "g-depth",
      title: `Seat plane ${sign(d)} cm deeper`,
      detail: `Footprint depth becomes ${f1(g.footprintDepth)} cm; the back post now starts ${f1(Math.abs(g.seatRear.z - b.seatRear.z))} cm ${d > 0 ? "further back" : "further forward"}.`,
      parts: ["seat", "sideFrame", "cane"],
    });
    human.push({
      id: "h-depth",
      title: d > 0 ? "Deeper seat" : "Shallower seat",
      detail:
        d > 0
          ? "Deeper seats can press behind the knees of shorter sitters, or keep them from reaching the backrest. This depends on thigh length."
          : "A shallower seat supports less of the thigh; taller sitters may feel less supported.",
      parts: ["seat"],
    });
    craft.push({
      id: "c-depth",
      title: "Seat frame and cane panel resize",
      detail: "The seat side members lengthen or shorten and the woven area changes — a new caning layout is required.",
      parts: ["seat", "cane"],
    });
  }

  if (changed.includes("backAngle")) {
    const d = p.backAngle - base.backAngle;
    geometry.push({
      id: "g-back",
      title: `Backrest ${sign(d)}° from the original`,
      detail: `Back leans ${f1(g.backRecline)}° from vertical. Joint between back post and rear support changes by ${sign(dRear)}°.`,
      parts: ["backrest", "sideFrame", "connections"],
      attention: misaligned.includes("rearJoint"),
    });
    human.push({
      id: "h-back",
      title: d > 0 ? "More recline" : "More upright",
      detail:
        d > 0
          ? "More recline moves more body weight onto the backrest — often read as relaxing, but it makes reading at a table or rising harder. Comfort is not guaranteed by any angle."
          : "A more upright back suits alert sitting; it moves away from the original's lounging character.",
      parts: ["backrest"],
    });
    craft.push({
      id: "c-back",
      title: "Joint angles must be re-laid out",
      detail: misaligned.includes("rearJoint")
        ? "The rear junction now differs by more than " + JOINT_TOLERANCE_DEG + "° from the original — tenons and shoulders cut to the old angle would no longer seat."
        : "Small changes can usually be absorbed by adjusting the layout; the template still needs redrawing.",
      parts: ["connections", "sideFrame"],
      attention: misaligned.includes("rearJoint"),
    });
  }

  if (changed.includes("supportSpacing")) {
    const d = p.supportSpacing - base.supportSpacing;
    geometry.push({
      id: "g-spacing",
      title: `Rear foot ${sign(d)} cm`,
      detail: `Rear support now ${f1(g.rearLegAngle)}° from vertical (was ${f1(b.rearLegAngle)}°). Footprint depth ${f1(g.footprintDepth)} cm.`,
      parts: ["sideFrame", "rails", "connections"],
      attention: misaligned.includes("railJoints"),
    });
    craft.push({
      id: "c-spacing",
      title: "Steeper supports mean more short grain",
      detail: "A more angled rear support crosses more grain if cut from straight stock, and the rear rail shoulders must be cut to the new angle.",
      parts: ["sideFrame", "rails"],
      attention: misaligned.includes("railJoints"),
    });
  }

  if (changed.includes("backCurve")) {
    geometry.push({
      id: "g-curve",
      title: `Back post bow ${f1(backBowCm(p))} cm`,
      detail: `The back post now bows ${f1(backBowCm(p))} cm behind its straight line (original ${f1(backBowCm(base))} cm).`,
      parts: ["sideFrame", "backrest"],
    });
    craft.push({
      id: "c-curve",
      title: "Curves cost material or process",
      detail: "A stronger bow needs wider stock to saw from, or a bending / lamination process instead of sawing.",
      parts: ["sideFrame"],
    });
  }

  if (g.backOverhang > 0) {
    geometry.push({
      id: "g-overhang",
      title: "Back top projects behind the rear feet",
      detail: `The top of the back sits ${f1(g.backOverhang)} cm behind the rear foot. This is a geometric observation only — any such design would need physical testing.`,
      parts: ["sideFrame", "backrest"],
      attention: true,
    });
  }

  const affected = new Set<AnyPartId>();
  [...geometry, ...human, ...craft].forEach((o) => o.parts.forEach((pt) => affected.add(pt)));
  if (misaligned.length) affected.add("connections");

  return { changed, geometry, human, craft, affectedParts: [...affected], misaligned, current: g, baseline: b };
}
