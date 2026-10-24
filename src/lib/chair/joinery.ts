// Pure joint checks: classic shop rules of thumb for mortise & tenon / round tenon joints.
// Units cm. These are rules of thumb taught in shops, not engineering guarantees.
import type { Typology } from "./params";

export type JointKind = "mortise-tenon" | "round-tenon";
export interface JointSpec {
  id: string;
  name: string;
  kind: JointKind;
  /** thickness of the member carrying the tenon */
  tenonMember: number;
  /** thickness (or width for round sockets) of the member receiving the mortise */
  mortiseMember: number;
  /** default tenon thickness (or diameter) */
  tenonT: number;
  /** default tenon length */
  tenonL: number;
  /** depth available in the mortised member */
  mortiseDepthMax: number;
  why: string;
}

export const JOINTS: Record<Typology, JointSpec[]> = {
  kangaroo: [
    { id: "front", name: "Front leg → seat rail", kind: "mortise-tenon", tenonMember: 3.8, mortiseMember: 3.8, tenonT: 1.3, tenonL: 3, mortiseDepthMax: 5, why: "Carries the sitter's weight straight down and resists racking when they shuffle forward." },
    { id: "rear", name: "Rear support → back post", kind: "mortise-tenon", tenonMember: 3.8, mortiseMember: 3.8, tenonT: 1.3, tenonL: 3, mortiseDepthMax: 5, why: "The most loaded joint: leaning back levers this joint open." },
    { id: "rail", name: "Stretcher → side frame", kind: "round-tenon", tenonMember: 2.8, mortiseMember: 3.8, tenonT: 1.6, tenonL: 2.5, mortiseDepthMax: 3.8, why: "Holds the two sides apart so the chair doesn't fold sideways." },
  ],
  japanese: [
    { id: "leg", name: "Leg → seat (wedged through)", kind: "round-tenon", tenonMember: 4, mortiseMember: 4.5, tenonT: 2.5, tenonL: 4.5, mortiseDepthMax: 4.5, why: "Every bit of load goes through four of these; splay levers them sideways." },
    { id: "spindle", name: "Spindle → crest rail", kind: "round-tenon", tenonMember: 2, mortiseMember: 3, tenonT: 1.3, tenonL: 2, mortiseDepthMax: 3, why: "Small, but many; the crest rail is thin, so drilling deep weakens it." },
    { id: "arm", name: "Arm → back post", kind: "mortise-tenon", tenonMember: 2.5, mortiseMember: 3.5, tenonT: 0.9, tenonL: 2.5, mortiseDepthMax: 3.5, why: "People push on arms to stand up — a short-grain-sensitive joint." },
  ],
};

export type Level = "good" | "warn" | "bad";
export interface JointCheck { rule: string; value: string; level: Level; advice: string }

const r1 = (n: number) => Math.round(n * 10) / 10;

export function checkJoint(j: JointSpec, tenonT: number, tenonL: number): JointCheck[] {
  const out: JointCheck[] = [];
  const ratio = tenonT / j.tenonMember;
  if (j.kind === "mortise-tenon") {
    out.push({
      rule: "Tenon ≈ ⅓ of the member's thickness",
      value: `${r1(tenonT)} / ${j.tenonMember} cm = ${Math.round(ratio * 100)}%`,
      level: ratio < 0.25 ? "bad" : ratio < 0.3 || ratio > 0.4 ? "warn" : ratio > 0.5 ? "bad" : "good",
      advice: ratio < 0.3 ? "Tenon is thin: it can snap at the shoulder. Thicken toward ⅓." : ratio > 0.4 ? "Tenon is fat: the cheeks around it in the mortise get thin. Go back toward ⅓." : "Classic proportion — tenon and the walls around it share the load evenly.",
    });
  } else {
    out.push({
      rule: "Round tenon ≈ ½–⅔ of the member",
      value: `⌀${r1(tenonT)} / ${j.tenonMember} cm = ${Math.round(ratio * 100)}%`,
      level: ratio < 0.4 ? "bad" : ratio < 0.5 || ratio > 0.7 ? "warn" : "good",
      advice: ratio < 0.5 ? "Thin peg: it will flex and wear loose in the socket." : ratio > 0.7 ? "Little shoulder left: the member can split where it steps down." : "Good — enough shoulder to bear on, enough wood to resist bending.",
    });
  }
  const wall = (j.mortiseMember - tenonT) / 2;
  out.push({
    rule: "Mortise walls ≥ 0.6 cm each side",
    value: `${r1(wall)} cm walls`,
    level: wall < 0.45 ? "bad" : wall < 0.6 ? "warn" : "good",
    advice: wall < 0.6 ? "Walls this thin blow out when you clamp or when the wedge drives in. Thin the tenon or use thicker stock." : "Walls are thick enough to survive clamping and seasonal movement.",
  });
  const depthRatio = tenonL / j.mortiseDepthMax;
  const lenRatio = tenonL / j.tenonMember;
  out.push({
    rule: "Length ≥ the member's thickness, without breaking through by accident",
    value: `${r1(tenonL)} cm long (max ${j.mortiseDepthMax} cm)`,
    level: depthRatio > 1 ? "bad" : lenRatio < 0.6 ? "bad" : lenRatio < 0.8 ? "warn" : "good",
    advice: depthRatio > 1 ? "Longer than the mortise can be — it would poke through. Shorten it." : lenRatio < 0.8 ? "Short tenon = little glue area; the joint works loose under leverage." : "Plenty of glue surface for this load.",
  });
  // Glue area: long-grain cheeks only (end grain glues poorly).
  const glue = j.kind === "mortise-tenon" ? 2 * tenonL * Math.min(j.tenonMember * 1.3, 5) : Math.PI * tenonT * tenonL;
  out.push({
    rule: "Long-grain glue area",
    value: `${r1(glue)} cm²`,
    level: glue < 8 ? "bad" : glue < 12 ? "warn" : "good",
    advice: glue < 12 ? "Small glue area. Consider a wedge or drawbore peg to lock it mechanically." : "Healthy glue area.",
  });
  return out;
}

export function jointGrade(checks: JointCheck[]): Level {
  if (checks.some((c) => c.level === "bad")) return "bad";
  if (checks.some((c) => c.level === "warn")) return "warn";
  return "good";
}
