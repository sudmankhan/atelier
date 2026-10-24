// Calculated results handed to the mentor as [CALCULATED] lines, each with the assumption it rests on.
// Built from the same functions the panels use, so the mentor can only quote numbers the user can see.
import { computeGeometry } from "./geometry";
import type { ChairParams } from "./params";
import { computeJapanese, POST_LEAN } from "./japanese/geometry";
import type { JapaneseParams } from "./japanese/params";
import { japaneseStress, kangarooStress } from "./stress";
import { japaneseMass, kangarooMass } from "./chairMass";
import { DEFAULT_LOADS, LOADS_NOTE } from "./loads";
import { DEFAULT_DELTA_MC } from "./movement";
import { combineWeights, defaultComZ, leverArm, tippingStatics } from "../statics";

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

export function chairTipping(typology: "kangaroo" | "japanese", params: ChairParams | JapaneseParams) {
  const L = DEFAULT_LOADS;
  let pivotZ: number, occZ: number, h: number;
  let mass;
  if (typology === "kangaroo") {
    const p = params as ChairParams;
    const g = computeGeometry(p);
    pivotZ = g.rearFoot.z;
    occZ = defaultComZ(g.seatRear.z, g.seatFront.z, L.comFraction, g.backRecline);
    h = g.backTop.y;
    mass = kangarooMass(p);
  } else {
    const p = params as JapaneseParams;
    const g = computeJapanese(p);
    pivotZ = g.rearFoot.z;
    occZ = defaultComZ(-p.seatDepth / 2, p.seatDepth / 2, L.comFraction, POST_LEAN);
    h = p.seatHeight + p.backHeight;
    mass = japaneseMass(p);
  }
  const both = combineWeights({ W: L.seatN, z: occZ }, { W: mass.N, z: mass.comZ });
  const r = tippingStatics({ W: both.W, d: leverArm(both.z, pivotZ), F: L.leanN, h: h / 100 });
  return { r, mass, pushHeightCm: h };
}

export function calculatedObservations(typology: "kangaroo" | "japanese", params: ChairParams | JapaneseParams): string[] {
  const s = typology === "kangaroo" ? kangarooStress(params as ChairParams) : japaneseStress(params as JapaneseParams);
  const out = [`[ASSUMPTION] ${LOADS_NOTE} Reference stress = USDA Wood Handbook mean bending strength, reduced to the 5th percentile (16% variation) and divided by 2.1 for long-term load and safety.`];
  if (s.wood.proxy) out.push(`[ASSUMPTION] ${s.wood.note}`);
  for (const p of s.pins) {
    out.push(`[CALCULATED] ${p.label}: ${r1(p.moment)} N·m on ${p.section} → ${r1(p.stressMPa)} MPa, ${r0(p.utilisation * 100)}% of the ${r1(p.refMPa)} MPa reference (${p.level}). ${p.how}`);
  }
  const t = chairTipping(typology, params);
  if (t.r.ok) {
    out.push(`[CALCULATED] Tipping (static 2D model, sitter + ${r1(t.mass.kg)} kg chair): ${t.r.label}; tips at ${t.r.thresholdF === null ? "n/a" : `${r0(t.r.thresholdF)} N`} pushed ${r0(t.pushHeightCm)} cm up.`);
  }
  if (s.movementMm !== null) {
    out.push(`[CALCULATED] Seasonal seat movement across the grain ≈ ${r1(s.movementMm)} mm for a ${DEFAULT_DELTA_MC}-point moisture swing (Wood Handbook Eq. 13–2, Table 13–5).`);
  }
  return out;
}
