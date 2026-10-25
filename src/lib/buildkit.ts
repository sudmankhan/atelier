// Build kit: everything a carpenter (or you) needs to make the chair on the bench.
// - blueprintDims: the overall measurements, from the same geometry the 3D model draws (LabModel.tsx).
// - shoppingList: which standard lumber-yard boards to buy, found by packing every rough part onto
//   candidate boards with the app's own packer (allocate.ts) and keeping the cheapest set.
// - cost: board feet × a price per board foot. Prices are an editable ASSUMPTION, never a quote.
import type { LabDesign } from "./lab";
import { labToSpec } from "./furniture/fromLab";
import { specCutList } from "./furniture/engine";
import { allocate, type StockBoard } from "./chair/allocate";
import type { CutRow } from "./chair/shop";

const r1 = (n: number) => Math.round(n * 10) / 10;
const rad = (d: number) => (d * Math.PI) / 180;

/** Overall measurements (cm, degrees), matching the 3D model. */
export function blueprintDims(d: LabDesign) {
  const W = d.seatWidth, D = d.seatDepth, H = d.seatHeight, T = d.legThickness;
  const top = H - 3;
  const sp = d.base === "four" || d.base === "splayed" ? Math.tan(rad(d.splay)) * top : 0;
  const rec = rad(d.backAngle - 90);
  const hasBack = d.back !== "none";
  const backTopY = hasBack ? H + Math.cos(rec) * d.backHeight : H;
  const backTopZ = hasBack ? -D / 2 + 1.5 - Math.sin(rec) * d.backHeight : -D / 2;
  let frontZ: number, rearZ: number, halfW: number;
  if (d.base === "sled") { frontZ = D / 2 - T + 2 + T / 2; rearZ = -D / 2 + T - 6 - T / 2; halfW = W / 2; }
  else if (d.base === "zframe") { frontZ = D / 2 - T + 2 + 1.9; rearZ = -D / 2 + T - 16 - 1.9; halfW = W / 2; }
  else { frontZ = D / 2 - T + sp + T / 2; rearZ = -D / 2 + T - sp - T / 2; halfW = Math.max(W / 2, W / 2 - T + sp + T / 2); }
  const front = Math.max(frontZ, D / 2), rear = Math.min(rearZ, backTopZ - 1.5, -D / 2);
  return {
    seatHeight: r1(H), seatWidth: r1(W), seatDepth: r1(D),
    overallHeight: r1(backTopY + (d.back === "none" ? 0 : 2.5)),
    footprintWidth: r1(2 * halfW), footprintDepth: r1(front - rear),
    backAngle: hasBack ? d.backAngle : null, backHeight: hasBack ? r1(d.backHeight) : null,
    legThickness: T, splay: sp ? d.splay : 0, legSpread: r1(sp),
  };
}

/** Rough lumber as US yards sell it: thickness in quarters of an inch, nominal (sawn) size. */
export const THICKNESSES = [
  { label: "4/4 (1 in)", t: 2.5 },
  { label: "5/4 (1¼ in)", t: 3.2 },
  { label: "6/4 (1½ in)", t: 3.8 },
  { label: "8/4 (2 in)", t: 5.1 },
] as const;
export const WIDTHS = [10, 15, 20] as const; // cm, about 4, 6 and 8 in
export const LENGTHS = [{ cm: 183, ft: 6 }, { cm: 244, ft: 8 }] as const;

/** Typical US lumberyard price per board foot, rough hardwood. An assumption the person can edit. */
export const PRICE_PER_BF: Record<LabDesign["wood"], number> = { oak: 9, ash: 7, walnut: 15, pine: 4 };

export interface BuyLine { thickness: string; widthCm: number; lengthCm: number; lengthFt: number; count: number; boardFeet: number; parts: string[] }
export interface GlueUp { part: string; strips: number; stripWidth: number }
export interface ShoppingList { lines: BuyLine[]; boardFeet: number; partsBoardFeet: number; glueUps: GlueUp[]; unplaced: string[] }

const bf = (l: number, w: number, t: number) => (l * w * t) / 2359.7;

/** Parts wider than the widest board are glued up from strips, as makers do for seats and panels. */
function splitWide(c: CutRow): { row: CutRow; glue?: GlueUp } {
  const thin = Math.min(c.rough.w, c.rough.t), face = Math.max(c.rough.w, c.rough.t);
  const maxW = WIDTHS[WIDTHS.length - 1]!;
  if (face <= maxW) return { row: c };
  const strips = Math.ceil(face / (maxW - 1));
  const stripWidth = r1(face / strips + 0.6);
  return { row: { ...c, qty: c.qty * strips, rough: { l: c.rough.l, w: stripWidth, t: thin } }, glue: { part: c.part, strips, stripWidth } };
}

/** Which standard boards to buy for this chair. */
export function shoppingList(d: LabDesign): ShoppingList {
  const cuts = specCutList(labToSpec(d, "kit"));
  const glueUps: GlueUp[] = [];
  const rows = cuts.map((c) => { const s = splitWide(c); if (s.glue) glueUps.push(s.glue); return s.row; });
  const groups = new Map<number, CutRow[]>();
  for (const c of rows) {
    const need = Math.min(c.rough.w, c.rough.t);
    const cls = THICKNESSES.findIndex((x) => x.t >= need);
    const k = cls === -1 ? THICKNESSES.length - 1 : cls;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  const lines: BuyLine[] = [];
  const unplaced: string[] = [];
  for (const [k, group] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const th = THICKNESSES[k]!;
    let best: BuyLine | null = null;
    for (const w of WIDTHS) for (const len of LENGTHS) {
      for (let n = 1; n <= 12; n++) {
        const boards: StockBoard[] = Array.from({ length: n }, (_, i) => ({ id: `${i}`, l: len.cm, w, t: th.t, grainSlope: null }));
        const a = allocate(boards, group);
        if (a.unallocated.some((u) => u.reason !== "out of room")) break; // too long/wide/thick for this size
        if (a.unallocated.length) continue;
        const used = new Set(a.placements.map((p) => p.boardId)).size;
        const line: BuyLine = { thickness: th.label, widthCm: w, lengthCm: len.cm, lengthFt: len.ft, count: used, boardFeet: r1(used * bf(len.cm, w, th.t)), parts: [...new Set(group.map((c) => c.part))] };
        if (!best || line.boardFeet < best.boardFeet || (line.boardFeet === best.boardFeet && line.count < best.count)) best = line;
        break;
      }
    }
    if (best) lines.push(best);
    else unplaced.push(...group.map((c) => c.part));
  }
  return {
    lines,
    boardFeet: r1(lines.reduce((s, l) => s + l.boardFeet, 0)),
    partsBoardFeet: r1(rows.reduce((s, c) => s + c.qty * bf(c.rough.l, c.rough.w, c.rough.t), 0)),
    glueUps,
    unplaced,
  };
}

export const cost = (list: ShoppingList, pricePerBf: number) => Math.round(list.boardFeet * pricePerBf);
