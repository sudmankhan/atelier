import { describe, expect, it } from "vitest";
import { BASELINE } from "./params";
import { J_BASELINE } from "./japanese/params";
import { computeGeometry } from "./geometry";
import { PAGE_MARGIN, PAGE_OVERLAP, PAPER, angleCards, fullSvg, inkedTiles, pageSvg, printHtml, templatesFor, tilePages } from "./templates";
import { kangarooShop } from "./shop";

describe("templates", () => {
  it("Kangaroo side frame is drawn at real size from the geometry", () => {
    const [side] = templatesFor("kangaroo", BASELINE);
    const g = computeGeometry(BASELINE);
    // drawing height = tallest point + margins; the back top is the tallest point of the frame
    expect(side!.id).toBe("k-side");
    expect(side!.heightCm).toBeGreaterThan(g.overallHeight);
    expect(side!.widthCm).toBeGreaterThan(g.footprintDepth);
  });

  it("follows the sliders", () => {
    const a = templatesFor("kangaroo", BASELINE)[0]!;
    const b = templatesFor("kangaroo", { ...BASELINE, seatHeight: BASELINE.seatHeight + 6 })[0]!;
    expect(b.heightCm).toBeCloseTo(a.heightCm + 6, 1);
  });

  it("Kuro gets side view, crest rail, seat drilling layout and angle cards", () => {
    const ids = templatesFor("japanese", J_BASELINE).map((t) => t.id);
    expect(ids).toEqual(["j-side", "j-crest", "j-seat", "angles"]);
    const seat = templatesFor("japanese", J_BASELINE).find((t) => t.id === "j-seat")!;
    expect(seat.widthCm).toBeCloseTo(J_BASELINE.seatWidth + 6, 5);
  });

  it("pages overlap and together cover the whole drawing", () => {
    for (const paper of ["letter", "a4"] as const) {
      const W = 97.3, H = 88.1;
      const { tiles, rows, cols } = tilePages(W, H, paper);
      expect(tiles.length).toBe(rows * cols);
      const last = tiles[tiles.length - 1]!;
      expect(last.x + last.w).toBeGreaterThanOrEqual(W);
      expect(last.y + last.h).toBeGreaterThanOrEqual(H);
      const pw = PAPER[paper].w - 2 * PAGE_MARGIN;
      if (cols > 1) expect(tiles[1]!.x).toBeCloseTo(pw - PAGE_OVERLAP, 5);
    }
    expect(tilePages(10, 10, "letter").tiles.length).toBe(1);
  });

  it("pages and the full SVG are sized in real centimetres", () => {
    const t = templatesFor("kangaroo", BASELINE)[0]!;
    const g = tilePages(t.widthCm, t.heightCm, "a4");
    const page = pageSvg(t, g.tiles[0]!, g, "a4", "Kangaroo");
    expect(page).toContain('width="21cm" height="29.7cm"');
    expect(page).toContain("must measure exactly 10 cm");
    expect(fullSvg(t)).toContain(`width="${t.widthCm}cm"`);
    const { html, pages } = printHtml([t], "letter", "Kangaroo");
    const all = tilePages(t.widthCm, t.heightCm, "letter").tiles;
    expect(pages).toBe(inkedTiles(t, all).length);
    expect(pages).toBeLessThan(all.length); // blank pages around the Z-shaped frame are skipped
    expect(pages).toBeGreaterThan(0);
    expect(html).toContain("@page{size:21.59cm 27.94cm;margin:0}");
  });

  it("angle cards fit on one page", () => {
    for (const ty of ["kangaroo", "japanese"] as const) {
      const card = templatesFor(ty, ty === "kangaroo" ? BASELINE : J_BASELINE).find((t) => t.id === "angles")!;
      expect(tilePages(card.widthCm, card.heightCm, "letter").tiles.length).toBe(1);
    }
  });

  it("angle cards come from the shop angle schedule", () => {
    const card = angleCards(kangarooShop(BASELINE).angles)!;
    expect(card.body).toContain("108°");
    expect(card.body).toContain("91.9°");
    expect(angleCards([])).toBeNull();
  });
});
