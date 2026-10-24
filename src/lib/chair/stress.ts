// Grain + joint-stress report for the 3D overlay. Not FEA:
// joint moments come from free-body statics (freeBody.ts) under the stated load cases (loads.ts),
// stress is M/S on the tenon (joinery.ts sizes), compared with a reference stress from USDA data.
import { BASELINE, type ChairParams } from "./params";
import { backBowCm, computeGeometry, lerp2, type V2 } from "./geometry";
import { J_BASELINE, type JapaneseParams } from "./japanese/params";
import { computeJapanese, CREST_BOW } from "./japanese/geometry";
import { japaneseMoments, kangarooMoments, KANGAROO_POST_SECTION, type JointMoment } from "./freeBody";
import { jointSpec, tenonSectionModulus } from "./joinery";
import { jointStress, rectSection, type Level } from "./jointStress";
import { movementMm, DEFAULT_DELTA_MC } from "./movement";
import { woodForChoice, type WoodChoice } from "./woodProperties";
import { LOADS_NOTE } from "./loads";

export type { Level };
export type P3 = [number, number, number];

export interface StressPin {
  id: string;
  label: string;
  pos: P3;
  moment: number; // N·m
  stressMPa: number;
  refMPa: number;
  utilisation: number; // stress ÷ reference
  /** moment compared with the original design (secondary information) */
  ratio: number;
  level: Level;
  section: string;
  why: string;
  how: string;
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
  wood: WoodChoice;
  assumptions: string;
}

export const MAX_RUNOUT_DEG = (Math.atan(1 / 12) * 180) / Math.PI; // 1:12 slope-of-grain limit ≈ 4.8°

/** Slope (deg) at the end of a bow of depth `sagitta` over `length`, sawn from straight stock (parabola end slope 4s/L). */
const runoutOf = (sagitta: number, length: number) => (Math.atan((4 * sagitta) / Math.max(1, length)) * 180) / Math.PI;
const p3 = (x: number, v: V2): P3 => [x, v.y, v.z];
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const runoutLevel = (deg: number): Level => (deg > MAX_RUNOUT_DEG ? "high" : deg > MAX_RUNOUT_DEG * 0.7 ? "watch" : "ok");

interface PinDef { id: string; label: string; pos: P3; section: { cm3: number; label: string }; why: string }

function buildPins(defs: PinDef[], now: JointMoment[], base: JointMoment[], wood: WoodChoice): StressPin[] {
  return defs.map((d) => {
    const m = now.find((x) => x.id === d.id)!;
    const b = base.find((x) => x.id === d.id)!;
    const s = jointStress(m.moment, d.section.cm3, wood.id ?? "oak");
    return {
      id: d.id, label: d.label, pos: d.pos, moment: r1(m.moment), stressMPa: r1(s.stressMPa), refMPa: r1(s.refMPa),
      utilisation: r2(s.utilisation), ratio: b.moment > 0 ? r2(m.moment / b.moment) : 1, level: s.level,
      section: d.section.label, why: d.why, how: m.how,
    };
  });
}

const tenon = (typ: "kangaroo" | "japanese", id: string) => {
  const j = jointSpec(typ, id);
  const cm3 = tenonSectionModulus(j);
  const label = j.kind === "round-tenon" ? `⌀${j.tenonT} cm round tenon` : `${j.tenonT} × ${j.tenonW} cm tenon`;
  return { cm3, label };
};

const JOINT_TO_PIN: Record<string, string> = {
  front: "frontJoint", rear: "rearJoint", rail: "railJoints", backTop: "backTopJoint",
  leg: "legJoints", arm: "armJoints", post: "postJoints",
};

/** Stress in one joint of the current design at a trial tenon size (joint inspector). Null if the joint isn't modelled. */
export function trialJointStress(typology: "kangaroo" | "japanese", params: ChairParams | JapaneseParams, jointId: string, tenonT: number) {
  const pinId = JOINT_TO_PIN[jointId];
  if (!pinId) return null;
  const moments = typology === "kangaroo" ? kangarooMoments(params as ChairParams) : japaneseMoments(params as JapaneseParams);
  const m = moments.find((x) => x.id === pinId);
  if (!m) return null;
  const wood = woodForChoice(typology === "kangaroo" ? (params as ChairParams).wood : (params as JapaneseParams).finish);
  const cm3 = tenonSectionModulus(jointSpec(typology, jointId), tenonT);
  return { moment: m.moment, sectionCm3: cm3, wood, how: m.how, ...jointStress(m.moment, cm3, wood.id ?? "oak") };
}

export function kangarooStress(p: ChairParams): StressReport {
  const g = computeGeometry(p);
  const x = g.frameX;
  const wood = woodForChoice(p.wood);
  const post = { cm3: rectSection(KANGAROO_POST_SECTION.b, KANGAROO_POST_SECTION.h), label: `${KANGAROO_POST_SECTION.b} × ${KANGAROO_POST_SECTION.h} cm post` };
  const pins = buildPins(
    [
      { id: "frontJoint", label: "Front leg ↔ seat rail", pos: p3(x, g.seatFront), section: tenon("kangaroo", "front"), why: "The floor pushes up on the raked front leg; the offset levers its tenon." },
      { id: "rearJoint", label: "Rear support ↔ back post", pos: p3(x, g.rearJoint), section: tenon("kangaroo", "rear"), why: "The rear feet carry most of the sitter and, when leaning, the friction that stops the chair sliding." },
      { id: "backPost", label: "Back post at the seat", pos: p3(x, g.seatRear), section: post, why: "Leaning back bends the post where it leaves the seat; a taller back is a longer lever." },
      { id: "backTopJoint", label: "Top rail ↔ post", pos: p3(x, lerp2(g.seatRear, g.backTop, 0.9)), section: tenon("kangaroo", "backTop"), why: "The sitter's back pushes the top rail; a wider chair means a longer rail and more bending at its ends." },
      { id: "railJoints", label: "Stretcher rails", pos: p3(x, g.frontRail), section: tenon("kangaroo", "rail"), why: "Sideways rocking (racking) is resisted only by the rail joints; a higher seat gives a longer lever." },
    ],
    kangarooMoments(p),
    kangarooMoments(BASELINE),
    wood,
  );
  const postRunout = runoutOf(backBowCm(p), g.backrestLength + 20);
  return {
    pins,
    grain: [
      { id: "frontLeg", label: "Front leg", a: p3(x + 3, g.frontFoot), b: p3(x + 3, g.seatFront), runoutDeg: 0, level: "ok", note: "Straight member: run the grain end to end." },
      { id: "seatRail", label: "Seat rail", a: p3(x + 3, g.seatFront), b: p3(x + 3, g.seatRear), runoutDeg: 0, level: "ok", note: "Straight member: grain along the length." },
      {
        id: "backPost",
        label: "Back post",
        a: p3(x + 3, g.seatRear),
        b: p3(x + 3, g.backTop),
        runoutDeg: r1(postRunout),
        level: runoutLevel(postRunout),
        note:
          postRunout > MAX_RUNOUT_DEG
            ? `Bow this deep sawn from straight stock leaves ${r1(postRunout)}° of short grain (limit ≈ 4.8°). Pick a board whose grain follows the curve, or laminate.`
            : `Sawn bow leaves ${r1(postRunout)}° grain runout — within the 1:12 rule.`,
      },
      { id: "rearSupport", label: "Rear support", a: p3(x + 3, g.rearJoint), b: p3(x + 3, g.rearFoot), runoutDeg: 0, level: "ok", note: "Straight member: grain along the length." },
    ],
    movementMm: null,
    wood,
    assumptions: `${LOADS_NOTE} Stress is M ÷ S on the tenon, compared with an educational reference stress for ${wood.note}. Not an engineering check.`,
  };
}

export function japaneseStress(p: JapaneseParams): StressReport {
  const g = computeJapanese(p);
  const x = g.legTopX;
  const wood = woodForChoice(p.finish);
  const pins = buildPins(
    [
      { id: "legJoints", label: "Leg ↔ seat (wedged tenon)", pos: [x, g.seatTop, g.rearLegTop.z], section: tenon("japanese", "leg"), why: "More splay and longer legs lever the tenon in its socket; a sideways shove does the same." },
      { id: "armJoints", label: "Arm ↔ back post", pos: [x, g.armBack.y, g.armBack.z], section: tenon("japanese", "arm"), why: "Pushing up out of the chair bends the arm; its end joints take that bending." },
      { id: "postJoints", label: "Back post ↔ seat", pos: [x, g.postBase.y + 0.5, g.postBase.z], section: tenon("japanese", "post"), why: "Leaning back bends the posts at the seat; taller backs multiply it." },
    ],
    japaneseMoments(p),
    japaneseMoments(J_BASELINE),
    wood,
  );
  const crestRunout = runoutOf(CREST_BOW, p.seatWidth);
  const movement = wood.id ? movementMm(p.seatDepth, wood.id) : null;
  return {
    pins,
    grain: [
      { id: "leg", label: "Leg", a: [x + g.run, 0, g.frontFoot.z], b: [x, g.seatTop, g.frontLegTop.z], runoutDeg: 0, level: "ok", note: "Rive or saw legs straight with the grain — splay is drilled into the seat, not cut into the leg." },
      {
        id: "crest",
        label: "Crest rail",
        a: [-p.seatWidth / 2 + 3, g.postTop.y + 2, g.postTop.z],
        b: [p.seatWidth / 2 - 3, g.postTop.y + 2, g.postTop.z],
        runoutDeg: r1(crestRunout),
        level: runoutLevel(crestRunout),
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
        level: movement !== null && movement > 3 ? "watch" : "ok",
        note:
          movement === null
            ? "Grain runs side to side, so the slab moves front-to-back with the seasons. Never glue a batten across it."
            : `Grain runs side to side, so a flatsawn slab moves ≈ ${r1(movement)} mm front-to-back over a ${DEFAULT_DELTA_MC}-point moisture swing. Never glue a batten across it.`,
      },
    ],
    movementMm: movement === null ? null : r1(movement),
    wood,
    assumptions: `${LOADS_NOTE} Stress is M ÷ S on the tenon, compared with an educational reference stress for ${wood.proxy ? "white oak (stand-in)" : wood.note}. Not an engineering check.`,
  };
}
