// Durability report: what this chair is built for, what wears first, and how to look after it.
// Every line is read off checks the app already runs (tipping, joint stress, leg bending, wood movement,
// weather). It deliberately gives NO lifespan in years: that depends on use, climate and care, and no
// honest source can promise a number.
import { evaluateLab, labJointStress, labRackingMoment, labTipping, type LabDesign, type LabUser } from "./lab";
import { DEFAULT_LOADS } from "./chair/loads";
import { cantileverEndLoad, toMm, woodE_Pa } from "./chair/beam";
import { movementMm } from "./chair/movement";
import { DECAY, DELTA_MC, type Setting } from "./weather";

export type Grade = "heavy" | "everyday" | "light" | "not-ready";
export const GRADES: Record<Grade, { title: string; line: string }> = {
  heavy: { title: "Built for heavy daily use", line: "Kitchen table, kids, people who lean back. It has margin to spare." },
  everyday: { title: "Built for everyday use", line: "Fine for normal sitting every day. Hard lean-backers and rough use will find its limits." },
  light: { title: "Built for light use", line: "Occasional sitting: a spare or accent chair. Daily rocking will loosen it." },
  "not-ready": { title: "Not ready to build yet", line: "At least one test fails. Use \"ways to fix this\" first." },
};

/** Which "see the math" panel backs a line. */
export type MathTopic = "tipping" | "joints" | "bending" | "movement" | "weather";
export interface Fact { text: string; good: boolean; math: MathTopic }
export interface WearPoint { part: string; why: string; sign: string; math: MathTopic }
export interface DurabilityReport { grade: Grade; facts: Fact[]; wearsFirst: WearPoint[]; care: string[]; setting: Setting }

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Sideways shove at the floor bends each leg like a diving board fixed at the seat (teaching model). */
export function legFlexMm(d: LabDesign): number | null {
  const E = woodE_Pa(d.wood);
  if (!E) return null;
  const lever = (d.stretchers && d.base !== "zframe" && d.base !== "sled" ? 0.65 : 1) * (d.seatHeight - 3);
  const t = d.legThickness / 100;
  const r = cantileverEndLoad({ F: DEFAULT_LOADS.rackN / 4, L: lever / 100, b: t, h: t, E });
  return r.ok ? r1(toMm(r.delta)) : null;
}

export function durabilityReport(d: LabDesign, user: LabUser = {}): DurabilityReport {
  const setting = user.setting ?? "indoor";
  const results = evaluateLab(d, user);
  const bad = results.filter((r) => r.level === "bad");
  const thr = labTipping(d).result.thresholdF ?? 0;
  const js = labJointStress(d);
  const util = js ? js.utilisation : null;
  const flex = legFlexMm(d);
  const seatMove = movementMm(d.seatWidth, d.wood, DELTA_MC[setting]);
  const decay = DECAY[d.wood];

  const grade: Grade =
    bad.length ? "not-ready"
    : thr >= DEFAULT_LOADS.leanN && util !== null && util < 0.5 ? "heavy"
    : util !== null && util < 0.8 ? "everyday"
    : "light";

  const facts: Fact[] = [];
  facts.push(thr >= DEFAULT_LOADS.leanN
    ? { text: `Won't tip, even when someone leans back hard (it takes ${r0(thr)} N; a hard lean is about ${DEFAULT_LOADS.leanN}).`, good: true, math: "tipping" }
    : thr >= DEFAULT_LOADS.leanN / 2
      ? { text: `Stays put for normal sitting, but a hard lean-back could tip it (it takes ${r0(thr)} N; a hard lean is about ${DEFAULT_LOADS.leanN}).`, good: false, math: "tipping" }
      : { text: `Tips too easily: a gentle lean of ${r0(thr)} N is enough.`, good: false, math: "tipping" });
  facts.push(util === null
    ? { text: "Screwed joints: their grip in the wood isn't calculated, and daily rocking works screws loose.", good: false, math: "joints" }
    : { text: `Each leg joint works at ${r0(util * 100)}% of what the wood can safely take when the chair is rocked${util < 0.5 ? ": plenty of margin" : util < 0.8 ? ": fine, with some margin" : util <= 1 ? ": near its limit" : ": over its limit"}.`, good: util < 0.8, math: "joints" });
  if (flex !== null) facts.push({ text: `A sideways shove flexes each leg about ${flex} mm${flex < 2 ? ", too little to feel" : flex < 5 ? ", a slight give" : ": you'll feel it wobble"}${d.stretchers ? " (stretchers help)" : ""}.`, good: flex < 5, math: "bending" });
  facts.push({ text: `The seat grows and shrinks about ${r1(seatMove)} mm across its width through the year${setting === "indoor" ? " indoors" : " outside"}. Built to float, that's harmless; glued tight, it cracks.`, good: true, math: "movement" });
  if (setting !== "indoor") facts.push(decay.group === "resistant"
    ? { text: `${d.wood === "oak" ? "White oak" : "Walnut"} heartwood resists rot, so it suits outdoor use.`, good: true, math: "weather" }
    : { text: `${d.wood === "pine" ? "Pine" : "Ash"} rots outside. Use white oak or walnut, or keep it under cover.`, good: false, math: "weather" });

  // What wears first, most likely first.
  const wear: WearPoint[] = [];
  if (setting === "outdoor" && decay.group !== "resistant") wear.push({ part: "The feet and leg ends", why: `${d.wood === "pine" ? "Pine" : "Ash"} isn't rot-resistant, and leg ends soak up water.`, sign: "Soft, dark wood at the bottom of the legs.", math: "weather" });
  if (d.joint === "screw") wear.push({ part: "The screwed joints", why: "Every rock works the screws in their holes.", sign: "A creak, then a wobble you can feel.", math: "joints" });
  else wear.push({ part: d.base === "zframe" ? "The joints where the frame meets the seat" : "The leg-to-seat joints", why: `They take the twist every time the chair is rocked (${r1(labRackingMoment(d))} N·m each).`, sign: "A faint creak or click when you shift your weight.", math: "joints" });
  if (d.back !== "none" && d.backAngle >= 105) wear.push({ part: "The back post joints", why: "A reclined back is a long lever: leaning back pries those joints open.", sign: "The back feels springy when you lean.", math: "tipping" });
  if (thr < DEFAULT_LOADS.leanN) wear.push({ part: "The back feet", why: "The chair rocks onto them whenever someone leans back hard.", sign: "Worn or chipped back edges on the rear feet.", math: "tipping" });
  if (setting === "outdoor") wear.push({ part: "The finish", why: "Sun breaks it down and rain gets under it.", sign: "Grey, dry-looking wood.", math: "weather" });
  if (d.back === "panel") wear.push({ part: "The back panel", why: "A wide solid board swells and shrinks the most.", sign: "A crack along the grain if it was glued in tight.", math: "movement" });

  const care: string[] = [];
  care.push(d.joint === "screw" ? "Tighten the screws every few months." : "Once a year, check every joint by gently rocking the chair. Re-glue at the first creak: early is easy, late means taking it apart.");
  care.push(setting === "outdoor" ? "Re-oil every spring, cover or store it in winter, and keep the feet off wet ground." : setting === "covered" ? "Re-oil every year or two and keep it off damp floors." : "Wax or oil every year or two; keep it away from radiators so it doesn't dry and crack.");
  if (d.back !== "none" && d.backAngle >= 105) care.push("Ask people not to tip back on two legs: it's the fastest way to loosen a reclined chair.");
  if (thr < DEFAULT_LOADS.leanN) care.push("Avoid hard lean-backs, or use \"ways to fix this\" to spread the legs.");

  return { grade, facts, wearsFirst: wear.slice(0, 3), care, setting };
}
