// Compromise options: when a chair fails a test, try small changes and keep only versions that pass.
// No AI here: every option is found by re-running the same tests (lab.ts) on each small change.
// Two strategies give two genuinely different answers: "keep the look" (change the stance and the build,
// not what you see and feel) and "change the feel" (sit more upright, shorter back). A person can lock any
// setting ("keep my recline"); the search then leaves it alone and finds another way, or says it can't.
import { WOODS, JOINT_TYPES, evaluateLab, labJointStress, labTipping, type LabDesign, type LabResult, type LabUser } from "./lab";
import { DEFAULT_LOADS } from "./chair/loads";

export type Lockable = "backAngle" | "backHeight" | "seatHeight" | "seatDepth" | "wood" | "joint" | "base" | "splay";
export const LOCKABLE: { key: Lockable; label: string }[] = [
  { key: "backAngle", label: "my recline" },
  { key: "backHeight", label: "my back height" },
  { key: "seatHeight", label: "my seat height" },
  { key: "wood", label: "my wood" },
  { key: "base", label: "my legs" },
];

interface Lever { key: keyof LabDesign; family: Lockable | "build"; step: (d: LabDesign) => LabDesign | null }


const LEVERS: Record<string, Lever> = {
  splay: { key: "splay", family: "splay", step: (d) => (d.base === "four" || d.base === "splayed") && d.splay < 14 ? { ...d, splay: Math.min(14, d.splay + 2) } : null },
  deeper: { key: "seatDepth", family: "seatDepth", step: (d) => d.seatDepth < 48 ? { ...d, seatDepth: Math.min(48, d.seatDepth + 2) } : null },
  thicker: { key: "legThickness", family: "build", step: (d) => d.legThickness < 4.5 ? { ...d, legThickness: Math.round(Math.min(4.5, d.legThickness + 0.3) * 10) / 10 } : null },
  stretchers: { key: "stretchers", family: "build", step: (d) => !d.stretchers && d.base !== "zframe" && d.base !== "sled" ? { ...d, stretchers: true } : null },
  joint: { key: "joint", family: "joint", step: (d) => d.joint === "screw" || d.joint === "dowel" ? { ...d, joint: d.base === "splayed" ? "wedged" : "mt" } : null },
  wood: { key: "wood", family: "wood", step: (d) => d.wood === "pine" || d.wood === "ash" ? { ...d, wood: "oak" } : null },
  upright: { key: "backAngle", family: "backAngle", step: (d) => d.back !== "none" && d.backAngle > 100 ? { ...d, backAngle: Math.max(100, d.backAngle - 2) } : null },
  recline: { key: "backAngle", family: "backAngle", step: (d) => d.back !== "none" && d.backAngle < 95 ? { ...d, backAngle: 96 } : d.back !== "none" && d.backAngle > 120 ? { ...d, backAngle: 118 } : null },
  shorterBack: { key: "backHeight", family: "backHeight", step: (d) => d.back !== "none" && d.backHeight > 28 ? { ...d, backHeight: Math.max(28, d.backHeight - 4) } : null },
  seatInRange: { key: "seatHeight", family: "seatHeight", step: (d) => d.seatHeight < 36 ? { ...d, seatHeight: 36 } : d.seatHeight > 50 ? { ...d, seatHeight: 50 } : null },
  shallower: { key: "seatDepth", family: "seatDepth", step: (d) => d.seatDepth > 48 ? { ...d, seatDepth: 48 } : null },
  lessSplay: { key: "splay", family: "splay", step: (d) => d.splay > 14 ? { ...d, splay: 14 } : null },
  zframe: { key: "base", family: "base", step: (d) => d.base === "four" || d.base === "splayed" ? { ...d, base: "zframe", splay: 0 } : null },
};

/** Fixes every strategy may use: they repair problems without changing the look or feel much. */
const COMMON = ["joint", "stretchers", "thicker", "wood", "recline", "seatInRange", "shallower", "lessSplay"];
export const STRATEGIES: { id: string; title: string; idea: string; levers: string[] }[] = [
  { id: "look", title: "Keep the look", idea: "Same shape and feel; the legs stand wider and the build gets sturdier.", levers: [...COMMON, "splay", "deeper"] },
  { id: "feel", title: "Change the feel", idea: "Sit a little more upright with a shorter back, so your weight stays over the legs.", levers: [...COMMON, "upright", "shorterBack"] },
  { id: "stance", title: "Change the stance", idea: "A kicked-back Z-frame base that's hard to tip, like the Kangaroo.", levers: [...COMMON, "zframe", "upright"] },
];

const bad = (rs: LabResult[]) => rs.filter((r) => r.level === "bad");
/**
 * Lower is better. Every failing test costs 100. Then, smoothly, how far the chair is from holding the full
 * 250 N lean and how hard its joints work, so each small step that helps is rewarded and the search aims for
 * a properly stable chair, not one that only just scrapes out of the red.
 */
export function score(d: LabDesign, user: LabUser = {}) {
  const rs = evaluateLab(d, user);
  const thr = labTipping(d).result.thresholdF ?? 0;
  const js = labJointStress(d);
  // Screwed joints aren't calculated (screw grip isn't modelled), so they count as worse than any calculated joint.
  const joint = js ? Math.max(0, js.utilisation - 0.6) * 20 : 60;
  return bad(rs).length * 100 + Math.max(0, DEFAULT_LOADS.leanN - thr) / 10 + joint;
}
/** How big a change is, so small changes win ties. */
function distance(a: LabDesign, b: LabDesign) {
  let n = 0;
  for (const k of ["seatHeight", "seatDepth", "seatWidth", "backAngle", "backHeight", "splay"] as const) n += Math.abs(a[k] - b[k]) / 10;
  n += Math.abs(a.legThickness - b.legThickness) * 2;
  for (const k of ["base", "back", "joint", "wood", "stretchers"] as const) if (a[k] !== b[k]) n += k === "base" ? 6 : 1;
  return n;
}

export interface Change { what: string; from: string; to: string }
export interface Fix { id: string; title: string; idea: string; design: LabDesign; changes: Change[]; tradeoff: string; tipsAt: number; problemsLeft: LabResult[] }

const unit = (k: string) => (k === "splay" || k === "backAngle" ? "°" : " cm");
const NAMES: Partial<Record<keyof LabDesign, string>> = { splay: "Leg spread", seatDepth: "Seat depth", legThickness: "Leg thickness", stretchers: "Stretchers", joint: "Joints", wood: "Wood", backAngle: "Back angle", backHeight: "Back height", seatHeight: "Seat height", base: "Base" };
const BASE_NAMES: Record<LabDesign["base"], string> = { four: "4 straight legs", splayed: "4 splayed legs", sled: "Sled", zframe: "Z-frame" };
const show = (k: keyof LabDesign, v: LabDesign[keyof LabDesign]) =>
  k === "wood" ? WOODS[v as LabDesign["wood"]].name : k === "joint" ? JOINT_TYPES[v as LabDesign["joint"]].name : k === "stretchers" ? (v ? "yes" : "none") : k === "base" ? BASE_NAMES[v as LabDesign["base"]] : `${v}${unit(k)}`;

export function changesBetween(a: LabDesign, b: LabDesign): Change[] {
  return (Object.keys(NAMES) as (keyof LabDesign)[]).filter((k) => a[k] !== b[k]).map((k) => ({ what: NAMES[k]!, from: show(k, a[k]), to: show(k, b[k]) }));
}

/** One plain sentence on what you give up. */
function tradeoff(a: LabDesign, b: LabDesign): string {
  const out: string[] = [];
  if (b.splay > a.splay) out.push(`feet stick out ${Math.round(Math.tan((b.splay * Math.PI) / 180) * (b.seatHeight - 3) - Math.tan((a.splay * Math.PI) / 180) * (a.seatHeight - 3))} cm further each side`);
  if (b.backAngle < a.backAngle) out.push(`sits ${a.backAngle - b.backAngle}° more upright`);
  if (b.backHeight < a.backHeight) out.push(`back ${a.backHeight - b.backHeight} cm shorter`);
  if (b.seatDepth > a.seatDepth) out.push(`seat ${b.seatDepth - a.seatDepth} cm deeper`);
  if (b.base !== a.base) out.push("a different-looking base");
  if (b.wood !== a.wood) out.push("a harder wood that costs more");
  if (b.legThickness > a.legThickness) out.push("slightly chunkier legs");
  if (b.stretchers && !a.stretchers) out.push("low bars between the legs");
  if (a.joint === "screw" && b.joint !== "screw") out.push("more work: cut real joints instead of screwing");
  return out.length ? `You give up: ${out.join(", ")}.` : "Nothing you'd notice.";
}

/** Greedy search inside one strategy: take the single small step that helps most, until nothing fails. */
function search(start: LabDesign, user: LabUser, levers: Lever[], maxSteps = 24): LabDesign {
  let d = start;
  let s = score(d, user);
  for (let i = 0; i < maxSteps && s > 0.01; i++) {
    let best: { d: LabDesign; s: number; dist: number } | null = null;
    for (const l of levers) {
      const n = l.step(d);
      if (!n) continue;
      const ns = score(n, user);
      const dist = distance(start, n);
      if (!best || ns < best.s || (ns === best.s && dist < best.dist)) best = { d: n, s: ns, dist };
    }
    if (!best || best.s >= s - 1e-6) break;
    d = best.d;
    s = best.s;
  }
  return d;
}

/** Which locked settings stop every fix (so the app can say "your 92° back is itself the problem"). */
export function blockingLocks(d: LabDesign, user: LabUser, locked: Lockable[]): Lockable[] {
  return locked.filter((k) => findFixes(d, user, locked.filter((x) => x !== k)).length > 0);
}

/** Up to two passing versions of a failing chair, different from each other, smallest change first. */
export function findFixes(d: LabDesign, user: LabUser = {}, locked: Lockable[] = []): Fix[] {
  if (!bad(evaluateLab(d, user)).length) return [];
  const out: Fix[] = [];
  for (const st of STRATEGIES) {
    const levers = st.levers.map((id) => LEVERS[id]!).filter((l) => !locked.includes(l.family as Lockable));
    const fixed = search(d, user, levers);
    const left = bad(evaluateLab(fixed, user));
    if (left.length || fixed === d) continue;
    if (out.some((f) => JSON.stringify(f.design) === JSON.stringify(fixed))) continue;
    out.push({ id: st.id, title: st.title, idea: st.idea, design: fixed, changes: changesBetween(d, fixed), tradeoff: tradeoff(d, fixed), tipsAt: Math.round(labTipping(fixed).result.thresholdF ?? 0), problemsLeft: left });
  }
  return out.sort((a, b) => distance(d, a.design) - distance(d, b.design)).slice(0, 2);
}
