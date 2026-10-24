// Free-body statics for joint moments. Pure, deterministic, SI out (N, N·m).
// Model: rigid 2D frames, loads from loads.ts. Feet resist vertical load; under a backward lean the
// rear feet also supply the friction that keeps the chair from sliding. Each joint moment is the
// moment of every force on one side of a cut through that joint, so it is exact for these assumptions.
// Racking uses the portal method with pinned feet (a standard hand method for frames).
import { computeGeometry, type V2 } from "./geometry";
import type { ChairParams } from "./params";
import { computeJapanese, POST_LEAN } from "./japanese/geometry";
import { defaultComZ } from "../statics";
import type { JapaneseParams } from "./japanese/params";
import { DEFAULT_LOADS, type LoadCase } from "./loads";

const M = 0.01; // cm → m

export interface JointMoment {
  id: string;
  /** bending moment at the joint, N·m (always ≥ 0) */
  moment: number;
  /** one-line description of the free body used */
  how: string;
}

/** Moment (N·m) about point o of force (fz, fy) N applied at p, coordinates in cm. */
const momentAbout = (o: V2, p: V2, fz: number, fy: number) => ((p.z - o.z) * fy - (p.y - o.y) * fz) * M;

/** Floor reactions for one side frame of the Kangaroo under seat load + backward lean. */
export function kangarooReactions(p: ChairParams, L: LoadCase = DEFAULT_LOADS) {
  const g = computeGeometry(p);
  const W = L.seatN / 2;
  const F = L.leanN / 2;
  const comZ = defaultComZ(g.seatRear.z, g.seatFront.z, L.comFraction, g.backRecline);
  // Σ moments about the rear foot = 0  →  R_front · span = W · (comZ − z_rear) − F · y_backTop
  const span = (g.frontFoot.z - g.rearFoot.z) * M;
  const Rf = (W * (comZ - g.rearFoot.z) * M - F * g.backTop.y * M) / span;
  return { g, W, F, comZ, Rf, Rr: W - Rf, H: F };
}

export function kangarooMoments(p: ChairParams, L: LoadCase = DEFAULT_LOADS): JointMoment[] {
  const { g, F, Rf, Rr, H } = kangarooReactions(p, L);
  const front = Math.abs(momentAbout(g.seatFront, g.frontFoot, 0, Rf));
  const rear = Math.abs(momentAbout(g.rearJoint, g.rearFoot, H, Rr));
  const post = Math.abs(momentAbout(g.seatRear, g.backTop, -F, 0));
  // Back-frame top rail: lean load spread along its span, ends treated as fixed → end moment wL²/12 = F·L/12.
  const span = g.railLength * M;
  const topRail = (L.leanN * span) / 12;
  // Racking: two portals (front legs + front stretcher, rear supports + rear stretcher), pinned feet.
  // Each column carries rack/4; joint equilibrium puts (rack/4)·seatHeight into the rail joint.
  const rails = (L.rackN / 4) * p.seatHeight * M;
  return [
    { id: "frontJoint", moment: front, how: `Front leg cut at the seat: floor pushes up ${Rf.toFixed(0)} N, ${(g.frontFoot.z - g.seatFront.z).toFixed(1)} cm ahead of the joint.` },
    { id: "rearJoint", moment: rear, how: `Rear support cut at the back post: floor pushes up ${Rr.toFixed(0)} N and grips ${H.toFixed(0)} N forward at the foot.` },
    { id: "backPost", moment: post, how: `Back post cut at the seat: ${F.toFixed(0)} N lean, ${(g.backTop.y - g.seatRear.y).toFixed(1)} cm above it.` },
    { id: "backTopJoint", moment: topRail, how: `Top rail ${g.railLength.toFixed(0)} cm long carrying the ${L.leanN} N lean, ends fixed: M = F·L/12.` },
    { id: "railJoints", moment: rails, how: `${L.rackN} N sideways shove shared by 4 legs, portal method: M = (F/4) × ${p.seatHeight} cm seat height.` },
  ];
}

/** Finished back-post section (cm), the same 5 × 3.8 used in the shop cut list; h lies in the side-frame plane. */
export const KANGAROO_POST_SECTION = { b: 3.8, h: 5 } as const;

/** Finished diameters (cm) of the Japanese back post and spindle, matching the shop cut list. */
export const POST_D = 3.5;
export const SPINDLE_D = 2;

export function japaneseReactions(p: JapaneseParams, L: LoadCase = DEFAULT_LOADS) {
  const g = computeJapanese(p);
  const comZ = defaultComZ(-p.seatDepth / 2, p.seatDepth / 2, L.comFraction, POST_LEAN);
  const span = g.frontFoot.z - g.rearFoot.z;
  const front = (L.seatN * (comZ - g.rearFoot.z)) / span;
  return { g, comZ, perFrontLeg: front / 2, perRearLeg: (L.seatN - front) / 2 };
}

export function japaneseMoments(p: JapaneseParams, L: LoadCase = DEFAULT_LOADS): JointMoment[] {
  const { g, perFrontLeg, perRearLeg } = japaneseReactions(p, L);
  // A leg splayed equally in x and z puts its foot √2·run sideways of its top (plan view diagonal).
  const offset = Math.SQRT2 * g.run;
  const seated = Math.max(perFrontLeg, perRearLeg) * offset * M;
  // Sideways shove: seat rigid, 4 legs as columns with pinned feet → each takes rack/4 at seat height.
  const rack = (L.rackN / 4) * p.seatHeight * M;
  const legs = Math.max(seated, rack);
  // Posts and spindles all rise from the seat to the crest, so the crest shares the lean among them in
  // proportion to bending stiffness (∝ d⁴ for equal lengths): 3.5 cm posts vs 2.0 cm spindles (shop sizes).
  const postShare = 1 / (2 + p.spindles * (SPINDLE_D / POST_D) ** 4);
  const posts = L.leanN * postShare * p.backHeight * M;
  const armLen = Math.hypot(g.armFront.z - g.armBack.z, g.armFront.y - g.armBack.y);
  const arms = (L.armN * armLen * M) / 8;
  return [
    {
      id: "legJoints",
      moment: legs,
      how:
        seated >= rack
          ? `Most-loaded leg carries ${Math.max(perFrontLeg, perRearLeg).toFixed(0)} N; its foot sits ${offset.toFixed(1)} cm out from the socket.`
          : `Sideways shove governs: ${L.rackN} N over 4 legs × ${p.seatHeight} cm seat height.`,
    },
    { id: "armJoints", moment: arms, how: `${L.armN} N push at mid-arm, arm ${armLen.toFixed(0)} cm long, ends fixed: M = F·L/8.` },
    { id: "postJoints", moment: posts, how: `Each post takes ${Math.round(postShare * 100)}% of the ${L.leanN} N lean (the ${p.spindles} spindles take the rest by stiffness), ${p.backHeight} cm above the seat.` },
  ];
}
