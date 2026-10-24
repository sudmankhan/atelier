import { describe, it, expect } from "vitest";
import { allocate, type StockBoard } from "./allocate";
import { KERF } from "./stock";

const row = (part: string, qty: number, l: number, w: number, t: number) => ({ part, qty, finished: { l, w, t }, rough: { l, w, t }, note: "" });
const B = (id: string, l: number, w: number, t: number, grainSlope: number | null = 20): StockBoard => ({ id, l, w, t, grainSlope });
const b100 = B("A", 100, 20, 2);

function noOverlap(a: ReturnType<typeof allocate>, boards: StockBoard[]) {
  for (const p of a.placements) {
    const b = boards.find((x) => x.id === p.boardId)!;
    expect(p.x).toBeGreaterThanOrEqual(0); expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.x + p.l).toBeLessThanOrEqual(b.l + 1e-9); expect(p.y + p.w).toBeLessThanOrEqual(b.w + 1e-9);
    for (const q of a.placements) {
      if (q === p || q.boardId !== p.boardId) continue;
      const sep = p.x + p.l + KERF <= q.x + 1e-9 || q.x + q.l + KERF <= p.x + 1e-9 || p.y + p.w + KERF <= q.y + 1e-9 || q.y + q.w + KERF <= p.y + 1e-9;
      expect(sep).toBe(true);
    }
  }
}

describe("shared lumber allocation", () => {
  it("fits four 45×8×2 on a 100×20×2 board but not five", () => {
    expect(allocate([b100], [row("Seat slat", 4, 45, 8, 2)]).placements).toHaveLength(4);
    const five = allocate([b100], [row("Seat slat", 5, 45, 8, 2)]);
    expect(five.placements).toHaveLength(4);
    expect(five.unallocated).toEqual([expect.objectContaining({ reason: "out of room" })]);
  });
  it("two categories of three never share material: 4 placed, 2 unallocated", () => {
    const a = allocate([b100], [row("Slat A", 3, 45, 8, 2), row("Slat B", 3, 45, 8, 2)]);
    expect(a.placements).toHaveLength(4);
    expect(a.unallocated).toHaveLength(2);
    noOverlap(a, [b100]);
  });
  it("too thick and too wide are reported", () => {
    expect(allocate([b100], [row("Slat", 1, 45, 3, 3)]).unallocated[0]!.reason).toBe("too thick");
    expect(allocate([b100], [row("Slat", 1, 45, 25, 2)]).unallocated[0]!.reason).toBe("too wide");
    expect(allocate([b100], [row("Slat", 1, 120, 5, 2)]).unallocated[0]!.reason).toBe("too long");
  });
  it("rejects zero, negative and non-finite dimensions", () => {
    for (const v of [0, -5, NaN, Infinity]) expect(allocate([b100], [row("Slat", 1, v, 5, 2)]).unallocated[0]!.reason).toBe("invalid dimensions");
    expect(allocate([B("bad", 0, 20, 2), b100], []).invalidBoards).toEqual(["bad"]);
  });
  it("rotates the cross-section only when it physically fits", () => {
    const a = allocate([b100], [row("Slat", 1, 45, 2, 8)]);
    expect(a.placements[0]).toMatchObject({ rotated: true, w: 8, t: 2 });
    expect(allocate([b100], [row("Slat", 1, 45, 3, 25)]).placements).toHaveLength(0);
  });
  it("unknown grain warns on structural parts only", () => {
    const a = allocate([B("A", 100, 20, 5, null)], [row("Leg", 1, 45, 4, 4), row("Seat frame end", 1, 45, 4, 4)]);
    expect(a.placements.find((p) => p.part === "Leg")!.warning).toMatch(/unknown/);
    expect(a.placements.find((p) => p.part === "Seat frame end")!.warning).toBeNull();
  });
  it("steep grain refuses structural parts only", () => {
    const a = allocate([B("A", 100, 20, 5, 7)], [row("Leg", 1, 45, 4, 4), row("Seat frame end", 1, 45, 4, 4)]);
    expect(a.unallocated).toEqual([expect.objectContaining({ part: "Leg", reason: "grain too steep" })]);
    expect(a.placements.map((p) => p.part)).toEqual(["Seat frame end"]);
  });
  it("used + kerf + remaining = board area, flush pieces don't count off-board kerf", () => {
    const a = allocate([b100], [row("Slat", 1, 100, 20, 2)]);
    expect(a.boards[0]!.kerfArea).toBeCloseTo(0, 9);
    const c = allocate([b100], [row("Slat", 4, 45, 8, 2)]).boards[0]!;
    expect(c.usedArea + c.kerfArea + c.remainingArea).toBeCloseTo(c.totalArea, 6);
    expect(c.kerfArea).toBeGreaterThan(0);
  });
  it("spreads parts across boards of different sizes", () => {
    const boards = [B("short", 50, 20, 5), B("long", 130, 6, 5)];
    const a = allocate(boards, [row("Leg", 1, 120, 5, 4), row("Seat frame end", 2, 45, 8, 4)]);
    expect(a.placements.find((p) => p.part === "Leg")!.boardId).toBe("long");
    expect(a.placements.filter((p) => p.boardId === "short")).toHaveLength(2);
    noOverlap(a, boards);
  });
  it("is deterministic", () => {
    const args = [[b100, B("C", 80, 30, 4, null)], [row("Leg", 4, 45, 4, 4), row("Slat", 3, 40, 6, 2)]] as const;
    expect(allocate([...args[0]], [...args[1]])).toEqual(allocate([...args[0]], [...args[1]]));
  });
});
