// Turns any FurnitureSpec into what the hand-built chairs have: cut list, chair weight, the lean-back
// test, joint/comfort checks, lumber fit and an assembly game. It reuses the same physics as the rest
// of the app (statics.ts, lab.ts, allocate.ts, woodProperties.ts) — nothing here is a new formula.
import type { FurnitureSpec, PartSpec } from "./spec";
import { roughOf, type CutRow } from "@/lib/chair/shop";
import { density12 } from "@/lib/chair/woodProperties";
import { DEFAULT_LOADS } from "@/lib/chair/loads";
import { combineWeights, defaultComZ, leverArm, tippingStatics, type StaticsResult } from "@/lib/statics";
import { BLANK, evaluateLab, type LabDesign, type LabResult } from "@/lib/lab";
import { allocate, type StockBoard } from "@/lib/chair/allocate";

type V3 = [number, number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;
const G = 9.81;
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const count = (p: PartSpec) => (p.sticks?.length ?? 0) + (p.boards?.length ?? 0);

/** Cut list: one row per part, finished size from the file, rough size with the shop allowances. */
export function specCutList(s: FurnitureSpec): CutRow[] {
  return s.parts.map((p) => {
    const finished = { l: p.size[0], w: p.size[1], t: p.size[2] };
    return { part: p.name, qty: count(p), finished, rough: roughOf(finished), note: p.note };
  });
}
export function specBoardFeet(s: FurnitureSpec) {
  return r1(specCutList(s).reduce((sum, c) => sum + c.qty * c.rough.l * c.rough.w * c.rough.t, 0) / 2359.7);
}

/** Every drawn piece with its centre, so weight and balance come from where the parts really are. */
function pieces(s: FurnitureSpec) {
  const out: { part: PartSpec; cm3: number; centre: V3 }[] = [];
  for (const p of s.parts) {
    const cm3 = p.size[0] * p.size[1] * p.size[2];
    for (const [a, b] of p.sticks ?? []) out.push({ part: p, cm3, centre: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] });
    for (const bd of p.boards ?? []) out.push({ part: p, cm3, centre: bd.at });
  }
  return out;
}

/** Overall measurements read off the file's own coordinates. */
export function specGeometry(s: FurnitureSpec) {
  const seat = s.parts.find((p) => p.role === "seat")!;
  const seatAt = seat.boards?.[0]?.at ?? seat.sticks![0]![0];
  const seatTop = seatAt[1] + seat.size[2] / 2;
  const seatDepth = seat.size[1], seatWidth = seat.size[0];
  const ends = s.parts.flatMap((p) => (p.sticks ?? []).flatMap(([a, b]) => [a, b]));
  const feet = s.parts.filter((p) => p.role === "leg" || p.role === "post").flatMap((p) => (p.sticks ?? []).map(([a, b]) => (a[1] < b[1] ? a : b)));
  const legT = Math.min(...s.parts.filter((p) => p.role === "leg" || p.role === "post").map((p) => Math.min(p.size[1], p.size[2])));
  // Rear pivot: the back edge of the rearmost foot.
  const rearFootZ = Math.min(...feet.map((f) => f[2])) - legT / 2;
  const top = Math.max(...ends.map((e) => e[1]), seatTop);
  const posts = s.parts.filter((p) => p.role === "post").flatMap((p) => p.sticks ?? []);
  const recline = posts.length ? (Math.atan2(Math.abs(posts[0]![1][2] - posts[0]![0][2]), Math.abs(posts[0]![1][1] - posts[0]![0][1])) * 180) / Math.PI : 0;
  const hasBack = s.parts.some((p) => p.role === "back");
  const hasStretchers = s.parts.some((p) => p.role === "stretcher");
  return { seatTop: r1(seatTop), seatDepth, seatWidth, seatCentreZ: seatAt[2], rearFootZ: r1(rearFootZ), top: r1(top), legT, recline: r1(recline), hasBack, hasStretchers };
}

export function specMass(s: FurnitureSpec) {
  const rho = density12(s.wood) / 1e6; // kg per cm³
  const ps = pieces(s);
  const kg = ps.reduce((sum, q) => sum + q.cm3 * rho, 0);
  const comZ = ps.reduce((sum, q) => sum + q.cm3 * rho * q.centre[2], 0) / kg;
  return { kg: r1(kg), N: kg * G, comZ };
}

/** The lean-back test, same model as everywhere else in the app. */
export function specTipping(s: FurnitureSpec): { result: StaticsResult; pushHeightCm: number; occupantZ: number; chairKg: number } {
  const g = specGeometry(s);
  const m = specMass(s);
  const seatRear = g.seatCentreZ - g.seatDepth / 2, seatFront = g.seatCentreZ + g.seatDepth / 2;
  const occupantZ = defaultComZ(seatRear, seatFront, DEFAULT_LOADS.comFraction, g.recline);
  const both = combineWeights({ W: DEFAULT_LOADS.seatN, z: occupantZ }, { W: m.N, z: m.comZ });
  const r = tippingStatics({ W: both.W, d: leverArm(both.z, g.rearFootZ), F: DEFAULT_LOADS.leanN, h: g.top / 100 });
  if (!r.ok) throw new Error(r.error);
  return { result: r, pushHeightCm: g.top, occupantZ, chairKg: m.kg };
}

/** The file read as a Component Lab design, so joint, part and comfort checks reuse the Lab's rules. */
export function specAsLab(s: FurnitureSpec): LabDesign {
  const g = specGeometry(s);
  return {
    ...BLANK,
    base: "four",
    back: g.hasBack ? "slats" : "none",
    joint: s.joint,
    wood: s.wood,
    seatHeight: g.seatTop,
    seatDepth: g.seatDepth,
    seatWidth: g.seatWidth,
    backAngle: r1(90 + g.recline),
    backHeight: r1(g.top - g.seatTop),
    legThickness: g.legT,
    splay: 0,
    stretchers: g.hasStretchers,
  };
}

/** Test results: stability from this file's own weight and feet; joints, parts and comfort by the Lab's rules. */
export function specResults(s: FurnitureSpec, user: { poplitealHeight?: number } = {}): LabResult[] {
  const tip = specTipping(s);
  const thr = tip.result.thresholdF ?? 0;
  const L = DEFAULT_LOADS.leanN;
  const why = `Sitter + ${tip.chairKg} kg chair (parts × ${s.wood} density), push ${Math.round(tip.pushHeightCm)} cm up at the top of the back.`;
  const stability: LabResult =
    thr < L / 2
      ? { area: "Stability", level: "bad", basis: "assumption", title: thr <= 0 ? "Tips with no push at all" : `Tips at only ${Math.round(thr)} N of lean`, detail: `${why} A gentle lean tips it.` }
      : thr < L
        ? { area: "Stability", level: "warn", basis: "assumption", title: `Tips at ${Math.round(thr)} N of lean`, detail: `${why} Fine for normal sitting; a hard lean (the ${L} N reference) would tip it. Raking the back legs back adds margin.` }
        : { area: "Stability", level: "good", basis: "assumption", title: `Tips only past ${Math.round(thr)} N of lean`, detail: `${why} Holds the ${L} N reference lean. Static model; not a proof of stability.` };
  const rest = evaluateLab(specAsLab(s), user).filter((r) => r.area !== "Stability");
  return [stability, ...rest];
}

export const SAMPLE_BOARDS: StockBoard[] = [
  { id: "B1", l: 240, w: 20, t: 4.5, grainSlope: 25 },
  { id: "B2", l: 120, w: 45, t: 2.6, grainSlope: 20 },
];

export function specLumber(s: FurnitureSpec, boards: StockBoard[] = SAMPLE_BOARDS) {
  return allocate(boards, specCutList(s));
}

/** Sanity checks a maker would make on the file itself (shown in the app, and run in tests). */
export function specIssues(s: FurnitureSpec): string[] {
  const out: string[] = [];
  for (const p of s.parts) {
    for (const [a, b] of p.sticks ?? []) {
      const drawn = dist(a, b);
      if (drawn > p.size[0] + 0.5) out.push(`${p.name}: drawn ${r1(drawn)} cm long but cut at ${p.size[0]} cm`);
      if (p.size[0] - drawn > 4) out.push(`${p.name}: cut ${r1(p.size[0] - drawn)} cm longer than drawn — more than two tenons' worth`);
    }
  }
  return out;
}
