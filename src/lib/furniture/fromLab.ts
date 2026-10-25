// Turns a Build-your-own (Component Lab) design into a furniture data file, so anyone can make a new
// chair without writing code: design it in the Lab, press Save, and the app writes the file.
// Geometry mirrors LabModel.tsx exactly, so the saved chair looks like the one on the bench.
import { JOINT_TYPES, WOODS, labJointSize, type LabDesign } from "@/lib/lab";
import { FurnitureSchema, type FurnitureSpec, type PartSpec } from "./spec";

type V = [number, number, number];
const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (p: V): V => [r2(p[0]), r2(p[1]), r2(p[2])];
const len = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const BASE_LABEL: Record<LabDesign["base"], string> = { four: "four straight legs", splayed: "four splayed legs", sled: "a sled base", zframe: "a Z-frame" };
const BACK_LABEL: Record<LabDesign["back"], string> = { none: "no back", slats: "a slatted back", spindles: "a spindle back", panel: "a solid panel back" };

/**
 * One part type made of one or more sticks. `extra` = cm added to the drawn length for joints
 * (a tenon or dowel into the next part), so the cut list is what you'd actually saw.
 */
function stickPart(id: string, name: string, role: PartSpec["role"], sticks: [V, V][], w: number, t: number, extra: number, note: string, round = false): PartSpec {
  return { id, name, role, size: [r1(len(sticks[0]![0], sticks[0]![1]) + extra), r1(w), r1(t)], note, round: round || undefined, sticks: sticks.map(([a, b]) => [pt(a), pt(b)]) } as PartSpec;
}

export function labToSpec(d: LabDesign, name: string, now = new Date()): FurnitureSpec {
  const W = d.seatWidth, D = d.seatDepth, H = d.seatHeight, T = d.legThickness;
  const hx = W / 2 - T, fz = D / 2 - T, rz = -D / 2 + T;
  const seatT = 3;
  const top = H - seatT;
  const sp = Math.tan((d.splay * Math.PI) / 180) * top;
  const j = labJointSize(d);
  const tenon = d.joint === "screw" ? 0 : Math.min(3.5, j.len); // into the seat
  const end = d.joint === "screw" ? 0 : 1.5; // each end of a rail or stretcher
  const parts: PartSpec[] = [];

  if (d.base === "four" || d.base === "splayed") {
    const legs: { top: V; foot: V }[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const z = sz > 0 ? fz : rz;
      legs.push({ top: [sx * hx, top, z], foot: [sx * (hx + sp), 0, z + sz * sp] });
    }
    parts.push(stickPart("leg", "Leg", "leg", legs.map((l) => [l.foot, l.top]), T, T, tenon, d.splay ? `Leans out ${d.splay}° from the seat.` : "Straight, square to the seat.", d.base === "splayed"));
    if (d.stretchers) {
      const at = (l: { top: V; foot: V }, k: number): V => [l.foot[0] + (l.top[0] - l.foot[0]) * k, l.foot[1] + (l.top[1] - l.foot[1]) * k, l.foot[2] + (l.top[2] - l.foot[2]) * k];
      const [a, b, c, e] = legs as [typeof legs[0], typeof legs[0], typeof legs[0], typeof legs[0]];
      parts.push(stickPart("sideStretcher", "Side stretcher", "stretcher", [[at(a, 0.35), at(b, 0.35)], [at(c, 0.35), at(e, 0.35)]], 2.2, 2.2, 2 * end, "Front leg to back leg, a third of the way up.", true));
      parts.push(stickPart("backStretcher", "Back stretcher", "stretcher", [[at(a, 0.35), at(c, 0.35)]], 2.2, 2.2, 2 * end, "Between the back legs.", true));
    }
  } else if (d.base === "sled") {
    const posts: [V, V][] = [], rears: [V, V][] = [], runners: [V, V][] = [];
    for (const sx of [-1, 1]) {
      const x = sx * hx;
      const ff: V = [x, 0, fz + 2], rf: V = [x, 0, rz - 6];
      posts.push([ff, [x, top, fz]]);
      rears.push([rf, [x, top, rz]]);
      runners.push([ff, rf]);
    }
    parts.push(stickPart("frontPost", "Front post", "leg", posts, T, T, tenon, "Seat to the front of the runner."));
    parts.push(stickPart("rearPost", "Rear post", "leg", rears, T, T, tenon, "Seat to the back of the runner, raked back."));
    parts.push(stickPart("runner", "Runner", "leg", runners, T, T, 0, "Sits on the floor and ties the posts together."));
    parts.push(stickPart("crossStretcher", "Cross stretcher", "stretcher", [[[-hx, 1.5, rz - 4], [hx, 1.5, rz - 4]]], 2.2, 2.2, 2 * end, "Joins the two runners.", true));
  } else {
    const fronts: [V, V][] = [], rears: [V, V][] = [];
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 - 1.9);
      fronts.push([[x, 0, fz + 2], [x, top, fz]]);
      rears.push([[x, 0, rz - 16], [x, top + 14, rz + 2]]);
    }
    parts.push(stickPart("frontLeg", "Front leg", "leg", fronts, 3.8, 3.8, tenon, "Straight down from the front of the seat."));
    parts.push(stickPart("rearSupport", "Rear support", "leg", rears, 3.8, 3.8, tenon, "Runs from behind the seat down to the floor: the most loaded joint."));
    parts.push(stickPart("lowStretcher", "Low stretcher", "stretcher", [[[-W / 2 + 3, 8, rz - 10], [W / 2 - 3, 8, rz - 10]]], 2.8, 2.8, 2 * end, "Ties the rear supports together.", true));
  }

  parts.push({ id: "seat", name: "Seat", role: "seat", size: [r1(W), r1(D), seatT], note: "Solid seat board.", boards: [{ at: pt([0, top + seatT / 2, 0]) }] } as PartSpec);

  if (d.back !== "none") {
    const rec = ((d.backAngle - 90) * Math.PI) / 180;
    const bh = d.backHeight;
    const bz = -D / 2 + 1.5;
    const P = (x: number, k: number): V => [x, H + Math.cos(rec) * bh * k, bz - Math.sin(rec) * bh * k];
    const px = W / 2 - 2;
    parts.push(stickPart("backPost", "Back post", "post", [[P(-px, 0), P(-px, 1)], [P(px, 0), P(px, 1)]], 3, 3, tenon, `Rises from the seat, leaning back ${d.backAngle - 90}°.`));
    parts.push(stickPart("crest", "Crest rail", "back", [[P(-px, 1), P(px, 1)]], 2.5, 5, 2 * end, "Top rail between the back posts."));
    if (d.back === "slats") {
      parts.push(stickPart("slat", "Back slat", "back", [0.4, 0.62, 0.84].map((k) => [P(-px, k), P(px, k)] as [V, V]), 1.6, 6, 2 * end, "Between the back posts."));
    } else if (d.back === "spindles") {
      const n = 7;
      const xs = Array.from({ length: n }, (_, i) => -px + (2 * px * (i + 1)) / (n + 1));
      parts.push(stickPart("spindle", "Spindle", "back", xs.map((x) => [P(x, 0), P(x, 1)] as [V, V]), 1.5, 1.5, 2 * end, "Seat to crest rail.", true));
    } else {
      parts.push(stickPart("panel", "Back panel", "back", [[P(0, 0.05), P(0, 0.95)]], 2 * px - 3, 1.8, 0, "Solid panel: let it float in a groove so it can move."));
    }
  }

  const back = d.back !== "none";
  const joint = JOINT_TYPES[d.joint].name.toLowerCase();
  const steps = [
    { id: "mill", label: "Mill all parts flat, square and to size", needs: [] },
    { id: "layout", label: d.joint === "screw" ? "Mark every screw position" : "Mark out every joint", needs: [{ id: "mill", why: "Marks made on rough, twisted stock aren't square, so every joint inherits the error." }] },
    { id: "cut", label: d.joint === "screw" ? "Drill pilot and clearance holes" : `Cut the joints (${joint})`, needs: [{ id: "layout", why: "You can't cut a joint you haven't marked." }] },
    { id: "dry", label: "Dry-fit the whole chair", needs: [{ id: "cut", why: "There's nothing to fit until the joints are cut." }] },
    { id: "base", label: d.stretchers ? "Glue up the base: legs and stretchers" : "Glue up the base", needs: [{ id: "dry", why: "Fit first, then glue: glue sets in minutes and a bad joint is stuck forever." }] },
    { id: "seat", label: "Fix the seat to the base", needs: [{ id: "base", why: "A base that isn't glued square will twist the seat." }] },
    ...(back ? [{ id: "back", label: "Fit and glue the back", needs: [{ id: "seat", why: "The back posts go into the seat, so the seat has to be on first." }] }] : []),
    { id: "finish", label: "Finish coats", needs: [{ id: back ? "back" : "seat", why: "Finish stops glue sticking, and squeeze-out shows through finish: assemble first." }] },
  ];

  const spec = {
    id: `my-${now.getTime().toString(36)}`,
    name: name.trim() || "My chair",
    category: "Chairs" as const,
    style: "Your own",
    description: `Designed in Build your own: ${BASE_LABEL[d.base]}, ${BACK_LABEL[d.back]}, ${joint} joints in ${WOODS[d.wood].name.toLowerCase()}.`,
    source: `Saved from Build your own on ${now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}. Not yet checked by a maker.`,
    verified: false,
    wood: d.wood,
    joint: d.joint,
    units: "cm; x = side to side, y = up, z = front (+) to back (-)",
    construction: { base: d.base, back: d.back === "none" ? undefined : d.back, splay: d.splay, legThickness: d.legThickness },
    adjust: { seatHeight: [30, 60], seatWidth: [34, 60], seatDepth: [30, 60], ...(back ? { backHeight: [15, 70] } : {}) },
    parts,
    steps,
  };
  return FurnitureSchema.parse(JSON.parse(JSON.stringify(spec)));
}
