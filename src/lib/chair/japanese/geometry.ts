// Pure parametric geometry for the Japanese-inspired spindle-back armchair.
// Same convention as the Kangaroo model: side view, z = forward (+) / back (-), y = up. Units cm.
import type { JapaneseParams } from "./params";
import { lerp2, type V2 } from "../geometry";

export const POST_LEAN = 6; // deg the back posts lean back from vertical
export const SLAB_T = 3.5; // seat slab thickness
export const LEG_INSET = 4; // leg tops sit this far inside the slab edge
export const CREST_BOW = 4; // cm the crest rail bows back behind the posts
export const CREST_RISE = 2.5; // cm the crest centre rises above the post tops

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export interface JGeometry {
  seatTop: number;
  run: number; // horizontal kick of each leg foot, per direction
  legLength: number; // true 3D leg length (splayed in x and z)
  legTopX: number; // |x| of leg tops
  legFootX: number; // |x| of leg feet
  frontLegTop: V2;
  frontFoot: V2;
  rearLegTop: V2;
  rearFoot: V2;
  postBase: V2;
  postTop: V2;
  crestMid: V2;
  armFront: V2;
  armBack: V2;
  armSlope: number; // deg the arm rises from front to back
  spindleSpacing: number; // centre-to-centre
  spindleLength: number;
  legSeatAngle: number; // deg between leg axis and the seat plane (side view)
  footprintWidth: number;
  footprintDepth: number;
  overallHeight: number;
  crestSpan: number;
}

export function computeJapanese(p: JapaneseParams): JGeometry {
  const splay = rad(p.legSplay);
  const run = Math.tan(splay) * p.seatHeight;
  const halfW = p.seatWidth / 2;
  const halfD = p.seatDepth / 2;

  const frontLegTop: V2 = { z: halfD - LEG_INSET, y: p.seatHeight };
  const frontFoot: V2 = { z: frontLegTop.z + run, y: 0 };
  const rearLegTop: V2 = { z: -halfD + LEG_INSET, y: p.seatHeight };
  const rearFoot: V2 = { z: rearLegTop.z - run, y: 0 };

  const lean = rad(POST_LEAN);
  const postBase: V2 = { z: -halfD + 5, y: p.seatHeight };
  const postTop: V2 = {
    z: postBase.z - Math.sin(lean) * p.backHeight,
    y: p.seatHeight + Math.cos(lean) * p.backHeight,
  };
  const crestMid: V2 = { z: postTop.z - CREST_BOW, y: postTop.y + CREST_RISE };

  const armFront: V2 = { z: halfD - LEG_INSET, y: p.seatHeight + 2 };
  const armBack: V2 = { z: postBase.z + 1, y: p.seatHeight + p.armHeight };
  const armSlope = deg(Math.atan2(armBack.y - armFront.y, armFront.z - armBack.z));

  return {
    seatTop: p.seatHeight,
    run,
    legLength: Math.hypot(p.seatHeight, run * Math.SQRT2),
    legTopX: halfW - LEG_INSET,
    legFootX: halfW - LEG_INSET + run,
    frontLegTop,
    frontFoot,
    rearLegTop,
    rearFoot,
    postBase,
    postTop,
    crestMid,
    armFront,
    armBack,
    armSlope,
    spindleSpacing: (p.seatWidth - 12) / (p.spindles + 1),
    spindleLength: p.backHeight * 0.94,
    legSeatAngle: deg(Math.atan2(p.seatHeight, run)),
    footprintWidth: (halfW - LEG_INSET + run) * 2 + 3,
    footprintDepth: frontFoot.z - rearFoot.z + 3,
    overallHeight: crestMid.y + 2,
    crestSpan: p.seatWidth,
  };
}

/** Height of the crest rail underside at a given x, for spindle lengths. */
export function crestYAt(g: JGeometry, halfW: number, x: number): { y: number; z: number } {
  const t = Math.min(1, Math.abs(x) / Math.max(1, halfW - 3));
  const k = 1 - t * t;
  return { y: g.postTop.y + CREST_RISE * k, z: g.postTop.z - CREST_BOW * k };
}

/** SVG path of the side profile, for 2D diagrams. Scale = px per cm. */
export function japaneseSideProfilePaths(g: JGeometry, p: JapaneseParams, scale: number, originZ: number, floorY: number) {
  const P = (v: V2) => `${(originZ + v.z * scale).toFixed(1)} ${(floorY - v.y * scale).toFixed(1)}`;
  const seatF: V2 = { z: p.seatDepth / 2, y: p.seatHeight };
  const seatR: V2 = { z: -p.seatDepth / 2, y: p.seatHeight };
  const armMid = lerp2(g.armFront, g.armBack, 0.5);
  const armBow: V2 = { z: armMid.z, y: armMid.y + 1.5 };
  return {
    frontLeg: `M ${P(g.frontFoot)} L ${P(g.frontLegTop)}`,
    rearLeg: `M ${P(g.rearFoot)} L ${P(g.rearLegTop)}`,
    seat: `M ${P(seatF)} L ${P(seatR)}`,
    post: `M ${P(g.postBase)} L ${P(g.postTop)}`,
    crest: `M ${P(g.postTop)} Q ${P(g.crestMid)} ${P({ z: g.postTop.z, y: g.postTop.y })}`,
    arm: `M ${P(g.armFront)} Q ${P(armBow)} ${P(g.armBack)}`,
  };
}
