// Stock-to-part matcher: which cut-list parts can come out of one real board.
// Pure, deterministic. Rule-of-thumb shop logic, not an optimiser.
import type { CutRow, Dim } from "./shop";

export const KERF = 0.3; // cm lost per saw cut
export interface Board { l: number; w: number; t: number; grainSlope: number | null } // grainSlope = N in "1 in N"; null = unknown
export type Verdict = "good" | "warn" | "bad";
export interface Placement { x: number; y: number; l: number; w: number }
export interface StockMatch {
  part: string; qty: number; yieldCount: number; covers: boolean; verdict: Verdict; reason: string;
  rough: Dim; placements: Placement[]; wastePct: number; loadBearing: boolean;
}

const LOAD_BEARING = /leg|post|support|rail|crest|spindle|arm/i;
export const RUNOUT_LIMIT = 12; // 1:12 rule

/** How many pieces of `rough` fit in the board, grain along the board length. Resawing in thickness counted. */
export function yieldOf(b: Board, r: Dim) {
  // allow the part's width/thickness to swap (rotate the section 90°)
  const opts = [
    { w: r.w, t: r.t },
    { w: r.t, t: r.w },
  ];
  let best = { n: 0, cols: 0, rows: 0, layers: 0, w: r.w };
  for (const o of opts) {
    const cols = Math.floor((b.l + KERF) / (r.l + KERF));
    const rows = Math.floor((b.w + KERF) / (o.w + KERF));
    const layers = Math.floor((b.t + KERF) / (o.t + KERF));
    const n = Math.max(0, cols) * Math.max(0, rows) * Math.max(0, layers);
    if (n > best.n) best = { n, cols, rows, layers, w: o.w };
  }
  return best;
}

export function matchStock(b: Board, cuts: CutRow[]): StockMatch[] {
  const boardArea = b.l * b.w;
  return cuts
    .map((c) => {
      const y = yieldOf(b, c.rough);
      const loadBearing = LOAD_BEARING.test(c.part);
      const placements: Placement[] = [];
      const show = Math.min(c.qty, y.cols * y.rows);
      for (let i = 0; i < show; i++) {
        const col = i % y.cols, row = Math.floor(i / y.cols);
        placements.push({ x: col * (c.rough.l + KERF), y: row * (y.w + KERF), l: c.rough.l, w: y.w });
      }
      const used = placements.reduce((s, p) => s + p.l * p.w, 0);
      const wastePct = boardArea > 0 ? Math.round((1 - used / boardArea) * 100) : 100;
      const covers = y.n >= c.qty;
      let verdict: Verdict = "good";
      let reason: string;
      if (y.n === 0) {
        verdict = "bad";
        const short = c.rough.l > b.l ? `too short (needs ${c.rough.l.toFixed(1)} cm rough length)` : Math.min(c.rough.w, c.rough.t) > Math.min(b.w, b.t) || Math.max(c.rough.w, c.rough.t) > Math.max(b.w, b.t) ? `too thin/narrow (needs ${c.rough.w.toFixed(1)} × ${c.rough.t.toFixed(1)} cm rough)` : "doesn't fit";
        reason = `Board is ${short}.`;
      } else if (b.grainSlope !== null && b.grainSlope < RUNOUT_LIMIT && loadBearing) {
        verdict = "bad";
        reason = `Fits, but grain runs out 1 in ${b.grainSlope} — steeper than 1:12. A loaded ${c.part.toLowerCase()} can split along that slope. Use this board for non-structural parts.`;
      } else if (!covers) {
        verdict = "warn";
        reason = `Fits ${y.n} of the ${c.qty} you need — find another board for the rest.`;
      } else {
        reason = `Yields ${y.n} (need ${c.qty})${y.layers > 1 ? ` — requires resawing into ${y.layers} layers` : ""}.`;
        if (b.grainSlope === null && loadBearing) { verdict = "warn"; reason += " Grain slope unknown: check runout before trusting it as a structural part."; }
      }
      return { part: c.part, qty: c.qty, yieldCount: y.n, covers, verdict, reason, rough: c.rough, placements, wastePct, loadBearing };
    })
    .sort((a, b2) => rank(a) - rank(b2));
}

function rank(m: StockMatch) { return m.verdict === "good" ? (m.covers ? 0 : 1) : m.verdict === "warn" ? 2 : 3; }

/** Maps cut-list part names to the 3D part ids so a match can highlight on the chair. */
export function partIdFor(name: string, typology: "kangaroo" | "japanese"): string | null {
  const n = name.toLowerCase();
  if (typology === "kangaroo") {
    if (/front leg|rear support|back post|seat rail/.test(n)) return "sideFrame";
    if (/stretcher/.test(n)) return "rails";
    if (/seat frame/.test(n)) return "seat";
    if (/back frame/.test(n)) return "backrest";
    return null;
  }
  if (/leg/.test(n)) return "legs";
  if (/seat/.test(n)) return "seatSlab";
  if (/spindle|back post/.test(n)) return "spindles";
  if (/crest/.test(n)) return "crestRail";
  if (/arm/.test(n)) return "arms";
  return null;
}
