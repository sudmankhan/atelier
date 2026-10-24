// Pure grain + joint-stress model for the 3D overlay. Rule-of-thumb mechanics,
// not FEA: loads are fixed teaching assumptions, results are compared to the original.
import { BASELINE, type ChairParams } from "./params";
import { computeGeometry, lerp2, type V2 } from "./geometry";
import { J_BASELINE, type JapaneseParams } from "./japanese/params";
import { computeJapanese, CREST_BOW } from "./japanese/geometry";

export type Level = "ok" | "watch" | "high";
export type P3 = [number, number, number];

export interface StressPin {
  id: string;
  label: string;
  pos: P3;
  moment: number; // N·m
  ratio: number; // vs original design
  level: Level;
  why: string;
}

export interface GrainRun {
  id: string;
  label: string;
  a: P3;
  b: P3;
  runoutDeg: number; // slope of grain if cut from straight stock
  level: Level;
  note: string;
}

export interface StressReport {
  pins: StressPin[];
  grain: GrainRun[];
  movementMm: number | null; // seasonal cross-grain movement of a solid panel
  assumptions: string;
}

export const LEAN_LOAD_N = 250; // sitter leaning hard on the back, applied at the top
export const SEAT_LOAD_N = 900; // ~90 kg sitter
export const MAX_RUNOUT_DEG = (Math.atan(1 / 12) * 180) / Math.PI; // 1:12 slope-of-grain limit ≈ 4.8°
export const MOVEMENT_PER_CM = 0.1; // mm per cm width, ≈1% seasonal swing, flat-sawn hardwood

export function levelOf(ratio: number): Level {
  return ratio < 1.1 ? "ok" : ratio < 1.3 ? "watch" : "high";
}
const runoutOf = (sagitta: number, length: number) => (Math.atan((4 * sagitta) / Math.max(1, length)) * 180) / Math.PI;
const p3 = (x: number, v: V2): P3 => [x, v.y, v.z];
const r1 = (n: number) => Math.round(n * 10) / 10;

function kMoments(p: ChairParams) {
  const g = computeGeometry(p);
  return {
    g,
    rear: (LEAN_LOAD_N * Math.max(1, g.backTop.y - g.rearJoint.y)) / 100,
    front: (SEAT_LOAD_N * 0.5 * Math.abs(g.seatFront.z - g.frontFoot.z + 4)) / 100 + (SEAT_LOAD_N * 0.05 * g.frontLegLength) / 100,
    rails: (SEAT_LOAD_N * 0.1 * g.seatFront.y) / 100,
    backTop: (LEAN_LOAD_N * 0.5 * g.backrestLength * 0.1) / 100,
  };
}

export function kangarooStress(p: ChairParams): StressReport {
  const m = kMoments(p);
  const b = kMoments(BASELINE);
  const g = m.g;
  const x = g.frameX;
  const pin = (id: string, label: string, pos: P3, mo: number, base: number, why: string): StressPin => {
    const ratio = mo / base;
    return { id, label, pos, moment: r1(mo), ratio: r1(ratio * 100) / 100, level: levelOf(ratio), why };
  };
  const postSag = p.backCurve * 3;
  const postRunout = runoutOf(postSag, g.backrestLength + 20);
  return {
    pins: [
      pin("rearJoint", "Back post ↔ rear support", p3(x, g.rearJoint), m.rear, b.rear, "Leaning back levers the post over this joint; a taller post above it means more twist on the tenon."),
      pin("frontJoint", "Front leg ↔ seat rail", p3(x, g.seatFront), m.front, b.front, "Seat load pushes the front leg forward; a longer, more raked leg bends this joint harder."),
      pin("railJoints", "Stretcher rails", p3(x, g.frontRail), m.rails, b.rails, "Sideways rocking (racking) is resisted only by the rail joints; a higher seat gives a longer lever."),
      pin("backTopJoint", "Top rail ↔ post", p3(x, lerp2(g.seatRear, g.backTop, 0.9)), m.backTop, b.backTop, "The cane pulls the top rail forward under load; longer posts mean a longer lever on it."),
    ],
    grain: [
      { id: "frontLeg", label: "Front leg", a: p3(x + 3, g.frontFoot), b: p3(x + 3, g.seatFront), runoutDeg: 0, level: "ok", note: "Straight member: run the grain end to end." },
      { id: "seatRail", label: "Seat rail", a: p3(x + 3, g.seatFront), b: p3(x + 3, g.seatRear), runoutDeg: 0, level: "ok", note: "Straight member: grain along the length." },
      {
        id: "backPost",
        label: "Back post",
        a: p3(x + 3, g.seatRear),
        b: p3(x + 3, g.backTop),
        runoutDeg: r1(postRunout),
        level: postRunout > MAX_RUNOUT_DEG ? "high" : postRunout > MAX_RUNOUT_DEG * 0.7 ? "watch" : "ok",
        note:
          postRunout > MAX_RUNOUT_DEG
            ? `Bow this deep sawn from straight stock leaves ${r1(postRunout)}° of short grain (limit ≈ 4.8°). Pick a board whose grain follows the curve, or laminate.`
            : `Sawn bow leaves ${r1(postRunout)}° grain runout — within the 1:12 rule.`,
      },
      { id: "rearSupport", label: "Rear support", a: p3(x + 3, g.rearJoint), b: p3(x + 3, g.rearFoot), runoutDeg: 0, level: "ok", note: "Straight member: grain along the length." },
    ],
    movementMm: null,
    assumptions: `${LEAN_LOAD_N} N lean at the back top, ${SEAT_LOAD_N} N seat load. Compared with the original; not an engineering check.`,
  };
}

function jMoments(p: JapaneseParams) {
  const g = computeJapanese(p);
  return {
    g,
    legs: (SEAT_LOAD_N * 0.25 * g.run + SEAT_LOAD_N * 0.08 * g.legLength) / 100,
    arms: (LEAN_LOAD_N * 0.5 * p.armHeight) / 100,
    posts: (LEAN_LOAD_N * 0.5 * p.backHeight) / 100,
  };
}

export function japaneseStress(p: JapaneseParams): StressReport {
  const m = jMoments(p);
  const b = jMoments(J_BASELINE);
  const g = m.g;
  const x = g.legTopX;
  const pin = (id: string, label: string, pos: P3, mo: number, base: number, why: string): StressPin => {
    const ratio = mo / base;
    return { id, label, pos, moment: r1(mo), ratio: r1(ratio * 100) / 100, level: levelOf(ratio), why };
  };
  const crestRunout = runoutOf(CREST_BOW, p.seatWidth);
  const movement = p.seatDepth * MOVEMENT_PER_CM;
  return {
    pins: [
      pin("legJoints", "Leg ↔ seat (wedged tenon)", [x, g.seatTop, g.rearLegTop.z], m.legs, b.legs, "More splay and longer legs lever the tenon in its mortise when the chair is dragged or rocked."),
      pin("armJoints", "Arm ↔ back post", [x, g.armBack.y, g.armBack.z], m.arms, b.arms, "Pushing up out of the chair loads this joint; a higher arm is a longer lever."),
      pin("postJoints", "Back post ↔ seat", [x, g.postBase.y + 0.5, g.postBase.z], m.posts, b.posts, "Leaning back bends the posts at the seat; taller backs multiply it."),
    ],
    grain: [
      { id: "leg", label: "Leg", a: [x + g.run, 0, g.frontFoot.z], b: [x, g.seatTop, g.frontLegTop.z], runoutDeg: 0, level: "ok", note: "Rive or saw legs straight with the grain — splay is drilled into the seat, not cut into the leg." },
      {
        id: "crest",
        label: "Crest rail",
        a: [-p.seatWidth / 2 + 3, g.postTop.y + 2, g.postTop.z],
        b: [p.seatWidth / 2 - 3, g.postTop.y + 2, g.postTop.z],
        runoutDeg: r1(crestRunout),
        level: crestRunout > MAX_RUNOUT_DEG ? "high" : crestRunout > MAX_RUNOUT_DEG * 0.7 ? "watch" : "ok",
        note:
          crestRunout > MAX_RUNOUT_DEG
            ? `A ${CREST_BOW} cm bow sawn from a straight board leaves ${r1(crestRunout)}° short grain — steam-bend or laminate the crest.`
            : `Sawn bow leaves ${r1(crestRunout)}° runout — acceptable, though steam-bending is stronger.`,
      },
      {
        id: "seat",
        label: "Seat slab",
        a: [-p.seatWidth / 2 + 4, g.seatTop + 0.3, 0],
        b: [p.seatWidth / 2 - 4, g.seatTop + 0.3, 0],
        runoutDeg: 0,
        level: movement > 5 ? "watch" : "ok",
        note: `Grain runs side to side, so the slab moves ≈ ${r1(movement)} mm front-to-back each year. Never glue a batten across it.`,
      },
    ],
    movementMm: r1(movement),
    assumptions: `${SEAT_LOAD_N} N seat load, ${LEAN_LOAD_N} N lean. Compared with the original; not an engineering check.`,
  };
}
