// Pure parametric geometry for the side profile of the chair.
// Coordinates are a side view: z = forward (+) / back (-), y = up. Units cm.
import type { ChairParams } from "./params";

export interface V2 {
  z: number;
  y: number;
}

export const SEAT_TILT_DEG = 6; // seat slopes down toward the back
export const BACK_LENGTH = 60; // length of the back post above the seat
export const FRAME_T = 3.6; // side-frame thickness
export const FRONT_RAKE = 5; // front foot sits ahead of the seat front
/** cm of back-post bow per unit of the backCurve slider; the only place this scale lives. */
export const BACK_BOW_PER_UNIT = 7;
export const backBowCm = (p: Pick<ChairParams, "backCurve">) => p.backCurve * BACK_BOW_PER_UNIT;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const add = (a: V2, b: V2, s = 1): V2 => ({ z: a.z + b.z * s, y: a.y + b.y * s });
const sub = (a: V2, b: V2): V2 => ({ z: a.z - b.z, y: a.y - b.y });
const len = (a: V2) => Math.hypot(a.z, a.y);
export const lerp2 = (a: V2, b: V2, t: number): V2 => ({ z: a.z + (b.z - a.z) * t, y: a.y + (b.y - a.y) * t });

function angleBetween(a: V2, b: V2) {
  const c = (a.z * b.z + a.y * b.y) / (len(a) * len(b));
  return deg(Math.acos(Math.max(-1, Math.min(1, c))));
}

export interface ChairGeometry {
  tilt: number; // rad
  seatDir: V2; // unit vector along seat, pointing forward
  backDir: V2; // unit vector up the back post
  frameX: number; // x of side-frame centreline
  frontFoot: V2;
  seatFront: V2;
  seatRear: V2;
  backMid: V2;
  backTop: V2;
  rearJoint: V2;
  rearFoot: V2;
  frontRail: V2;
  rearRail: V2;
  seatCenter: V2;
  backrestCenter: V2;
  backrestLength: number;
  // derived measurements
  railLength: number;
  frontLegLength: number;
  rearLegLength: number;
  footprintDepth: number;
  footprintWidth: number;
  overallHeight: number;
  overallDepth: number;
  rearLegAngle: number; // deg from vertical
  rearJointAngle: number; // deg between back post and rear support
  frontJointAngle: number; // deg between front leg and seat
  backRecline: number; // deg the back leans from vertical
  backOverhang: number; // cm the back top projects behind the rear feet (+ = behind)
}

export function computeGeometry(p: ChairParams): ChairGeometry {
  const tilt = rad(SEAT_TILT_DEG);
  const seatDir: V2 = { z: Math.cos(tilt), y: Math.sin(tilt) };
  const ba = tilt + rad(p.backAngle);
  const backDir: V2 = { z: Math.cos(ba), y: Math.sin(ba) };
  const backNormalRear: V2 = { z: -Math.sin(ba), y: Math.cos(ba) }; // perpendicular, pointing behind the post

  const halfD = p.seatDepth / 2;
  const seatFront: V2 = { z: halfD, y: p.seatHeight };
  const seatRear = add(seatFront, seatDir, -p.seatDepth);
  const frontFoot: V2 = { z: halfD + FRONT_RAKE, y: 0 };
  const backTop = add(seatRear, backDir, BACK_LENGTH);
  const backMid = add(add(seatRear, backDir, BACK_LENGTH / 2), backNormalRear, backBowCm(p));
  const rearJoint = add(seatRear, seatDir, 8);
  const rearFoot: V2 = { z: seatRear.z - p.supportSpacing, y: 0 };
  const frontRail = lerp2(frontFoot, seatFront, 0.3);
  const rearRail = lerp2(rearFoot, rearJoint, 0.38);
  const seatUp: V2 = { z: -Math.sin(tilt), y: Math.cos(tilt) };
  const seatCenter = add(lerp2(seatFront, seatRear, 0.5), seatUp, 2.4);
  const backFwd: V2 = { z: Math.sin(ba), y: -Math.cos(ba) };
  const backrestLength = BACK_LENGTH * 0.62;
  const backrestCenter = add(add(seatRear, backDir, BACK_LENGTH * 0.56), backFwd, 2.4);

  const minZ = Math.min(rearFoot.z, backTop.z, backMid.z);
  return {
    tilt,
    seatDir,
    backDir,
    frameX: p.seatWidth / 2 + FRAME_T / 2,
    frontFoot,
    seatFront,
    seatRear,
    backMid,
    backTop,
    rearJoint,
    rearFoot,
    frontRail,
    rearRail,
    seatCenter,
    backrestCenter,
    backrestLength,
    railLength: p.seatWidth,
    frontLegLength: len(sub(seatFront, frontFoot)),
    rearLegLength: len(sub(rearJoint, rearFoot)),
    footprintDepth: frontFoot.z - rearFoot.z,
    footprintWidth: p.seatWidth + 2 * FRAME_T,
    overallHeight: Math.max(backTop.y, p.seatHeight),
    overallDepth: frontFoot.z - minZ,
    rearLegAngle: deg(Math.atan2(rearJoint.z - rearFoot.z, rearJoint.y)),
    rearJointAngle: angleBetween(backDir, sub(rearFoot, rearJoint)),
    frontJointAngle: angleBetween(sub(frontFoot, seatFront), { z: -seatDir.z, y: -seatDir.y }),
    backRecline: deg(Math.atan2(-backDir.z, backDir.y)),
    backOverhang: rearFoot.z - backTop.z,
  };
}

/** SVG path of the side profile, for 2D diagrams. Scale = px per cm. */
export function sideProfilePaths(g: ChairGeometry, scale: number, originZ: number, floorY: number) {
  const P = (v: V2) => `${(originZ + v.z * scale).toFixed(1)} ${(floorY - v.y * scale).toFixed(1)}`;
  return {
    frame: `M ${P(g.frontFoot)} L ${P(g.seatFront)} L ${P(g.seatRear)} Q ${P(g.backMid)} ${P(g.backTop)}`,
    rear: `M ${P(g.rearJoint)} L ${P(g.rearFoot)}`,
  };
}
