// Shared multi-board lumber allocation. Pure + deterministic.
// MaxRects with Best Short Side Fit — a heuristic, NOT a guaranteed optimum,
// and layouts may be non-guillotine (conceptual, not a saw-cut sequence).
// Grain always runs along the board length; the cross-section may swap w/t (tracked as `rotated`). No resawing.
import type { CutRow } from "./shop";
import { KERF, RUNOUT_LIMIT, isLoadBearing } from "./stock";

export interface StockBoard { id: string; l: number; w: number; t: number; grainSlope: number | null }
export type UnallocReason = "invalid dimensions" | "too thick" | "too long" | "too wide" | "grain too steep" | "out of room";
export interface Piece { pieceId: string; part: string; l: number; w: number; t: number; structural: boolean }
export interface CutPlacement {
  boardId: string; pieceId: string; part: string;
  x: number; y: number; l: number; w: number; t: number; // w = face width on the board, t = thickness used
  rotated: boolean; warning: string | null;
}
export interface Unallocated { pieceId: string; part: string; reason: UnallocReason }
export interface BoardUsage { boardId: string; totalArea: number; usedArea: number; kerfArea: number; remainingArea: number }
export interface Allocation { placements: CutPlacement[]; unallocated: Unallocated[]; boards: BoardUsage[]; invalidBoards: string[] }

interface Rect { x: number; y: number; w: number; h: number } // w along board length, h across width
const EPS = 1e-9;
const ok = (n: number) => Number.isFinite(n) && n > 0;

export function expandPieces(cuts: CutRow[]): Piece[] {
  const out: Piece[] = [];
  for (const c of cuts) {
    const n = Number.isFinite(c.qty) ? Math.max(0, Math.floor(c.qty)) : 0;
    for (let i = 1; i <= n; i++) out.push({ pieceId: `${c.part}#${i}`, part: c.part, l: c.rough.l, w: c.rough.w, t: c.rough.t, structural: isLoadBearing(c.part) });
  }
  return out;
}

function orientations(p: Piece) {
  const o = [{ fw: p.w, th: p.t, rotated: false }];
  if (p.w !== p.t) o.push({ fw: p.t, th: p.w, rotated: true });
  return o;
}

export function allocate(boardsIn: StockBoard[], cuts: CutRow[], kerf = KERF): Allocation {
  const invalidBoards: string[] = [];
  const boards = boardsIn.filter((b) => {
    const v = ok(b.l) && ok(b.w) && ok(b.t);
    if (!v) invalidBoards.push(b.id);
    return v;
  });
  const free = new Map<string, Rect[]>(boards.map((b) => [b.id, [{ x: 0, y: 0, w: b.l + kerf, h: b.w + kerf }]]));
  const pieces = expandPieces(cuts)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.l * b.p.w - a.p.l * a.p.w || b.p.l - a.p.l || (a.p.part < b.p.part ? -1 : a.p.part > b.p.part ? 1 : 0) || a.i - b.i)
    .map((x) => x.p);

  const placements: CutPlacement[] = [];
  const unallocated: Unallocated[] = [];

  for (const p of pieces) {
    if (!ok(p.l) || !ok(p.w) || !ok(p.t)) { unallocated.push({ pieceId: p.pieceId, part: p.part, reason: "invalid dimensions" }); continue; }
    type Best = { score: [number, number, number, number, number, number]; b: StockBoard; r: Rect; o: ReturnType<typeof orientations>[number] };
    let best = null as Best | null;
    for (let bi = 0; bi < boards.length; bi++) {
      const b = boards[bi]!;
      if (p.structural && b.grainSlope !== null && b.grainSlope < RUNOUT_LIMIT) continue;
      for (const o of orientations(p)) {
        if (o.th > b.t + EPS || o.fw > b.w + EPS || p.l > b.l + EPS) continue;
        const W = p.l + kerf, H = o.fw + kerf;
        for (const r of free.get(b.id)!) {
          if (W > r.w + EPS || H > r.h + EPS) continue;
          const short = Math.min(r.w - W, r.h - H), long = Math.max(r.w - W, r.h - H);
          const score: [number, number, number, number, number, number] = [short, long, bi, r.y, r.x, o.rotated ? 1 : 0];
          if (!best || less(score, best.score)) best = { score, b, r, o };
        }
      }
    }
    if (!best) { unallocated.push({ pieceId: p.pieceId, part: p.part, reason: reasonFor(p, boards) }); continue; }
    const { b, r, o } = best;
    const used: Rect = { x: r.x, y: r.y, w: p.l + kerf, h: o.fw + kerf };
    free.set(b.id, split(free.get(b.id)!, used));
    placements.push({
      boardId: b.id, pieceId: p.pieceId, part: p.part, x: r.x, y: r.y, l: p.l, w: o.fw, t: o.th, rotated: o.rotated,
      warning: p.structural && b.grainSlope === null ? "Grain slope unknown: check runout before trusting it structurally." : null,
    });
  }

  const usage = boards.map<BoardUsage>((b) => {
    const totalArea = b.l * b.w;
    let usedArea = 0, kerfArea = 0;
    for (const pl of placements) {
      if (pl.boardId !== b.id) continue;
      const a = pl.l * pl.w;
      // inflated rect clipped to the board: kerf beyond the board edge is not counted
      const clipped = Math.max(0, Math.min(pl.x + pl.l + kerf, b.l) - pl.x) * Math.max(0, Math.min(pl.y + pl.w + kerf, b.w) - pl.y);
      usedArea += a; kerfArea += clipped - a;
    }
    return { boardId: b.id, totalArea, usedArea, kerfArea, remainingArea: totalArea - usedArea - kerfArea };
  });
  return { placements, unallocated, boards: usage, invalidBoards };
}

function less(a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i]! - b[i]!) > EPS) return a[i]! < b[i]!;
  }
  return false;
}

function reasonFor(p: Piece, boards: StockBoard[]): UnallocReason {
  const os = orientations(p);
  const thick = boards.filter((b) => os.some((o) => o.th <= b.t + EPS));
  if (!thick.length) return "too thick";
  const long = thick.filter((b) => p.l <= b.l + EPS);
  if (!long.length) return "too long";
  const wide = long.filter((b) => os.some((o) => o.th <= b.t + EPS && o.fw <= b.w + EPS));
  if (!wide.length) return "too wide";
  if (p.structural && wide.every((b) => b.grainSlope !== null && b.grainSlope < RUNOUT_LIMIT)) return "grain too steep";
  return "out of room";
}

function split(rects: Rect[], u: Rect): Rect[] {
  const out: Rect[] = [];
  for (const f of rects) {
    if (u.x >= f.x + f.w - EPS || u.x + u.w <= f.x + EPS || u.y >= f.y + f.h - EPS || u.y + u.h <= f.y + EPS) { out.push(f); continue; }
    if (u.x > f.x + EPS) out.push({ x: f.x, y: f.y, w: u.x - f.x, h: f.h });
    if (u.x + u.w < f.x + f.w - EPS) out.push({ x: u.x + u.w, y: f.y, w: f.x + f.w - (u.x + u.w), h: f.h });
    if (u.y > f.y + EPS) out.push({ x: f.x, y: f.y, w: f.w, h: u.y - f.y });
    if (u.y + u.h < f.y + f.h - EPS) out.push({ x: f.x, y: u.y + u.h, w: f.w, h: f.y + f.h - (u.y + u.h) });
  }
  // prune rectangles contained in another (keep first of exact duplicates)
  return out.filter((a, i) => !out.some((b, j) => j !== i && a.x >= b.x - EPS && a.y >= b.y - EPS && a.x + a.w <= b.x + b.w + EPS && a.y + a.h <= b.y + b.h + EPS && (j < i || !(Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS && Math.abs(a.w - b.w) < EPS && Math.abs(a.h - b.h) < EPS))));
}
