# Lumber Studio: shared multi-board cutting layout

## Goal
Replace per-part matching (which promises the same wood to several parts) with one allocation across all your boards, so every piece gets its own spot on a board, or is clearly listed as "not allocated".

## What you will see
- A list of your boards (add/remove; presets still available). Each board has an ID, L × W × T and grain slope.
- One combined cutting diagram per board, each part type in its own colour, with a legend. Rotated cross-sections are marked.
- Totals per board: used area, kerf loss, remaining area (these always add up to the board area).
- An "Unallocated" list naming every piece that did not fit and why: too thick, too wide, too long, out of room, grain too steep for a structural part, or invalid dimensions.
- Structural pieces placed on a board with unknown grain show a warning ("grain slope unknown: check runout before trusting it structurally"), as today.
- Tapping a part still lights it up on the 3D chair; photo inspection still feeds the grain slope of the selected board. Existing visual design unchanged.
- Labels: "Heuristic layout (best-fit), not a guaranteed optimum" and "Conceptual cutting layout, not a guaranteed saw-cut sequence (some layouts may need non-through cuts)."

## Algorithm (pure TypeScript, `src/lib/chair/allocate.ts`)
1. Validate inputs: any board or piece dimension that is zero, negative or non-finite is rejected (board ignored with an error entry; piece unallocated with reason "invalid dimensions").
2. Expand the cut list into individual pieces (`Leg#1..#4`), using existing rough sizes.
3. Sort pieces deterministically: area desc, then length desc, then name, then index.
4. Per board keep a list of free rectangles (MaxRects). Each piece is inflated by 0.3 cm kerf on length and width; the board is treated as (L+kerf) × (W+kerf) so pieces may sit flush on the far edges.
5. Orientation: length always runs along the board length (grain preserved). Two cross-section orientations are tried: normal (face width = w, thickness = t) and rotated (face width = t, thickness = w). An orientation is allowed only if its thickness ≤ board thickness and its face width ≤ board width. No resawing. Each placement records `rotated: boolean`.
6. Grain: grain steeper than 1:12 refuses structural pieces on that board. Grain unknown (null) allows placement but sets `warning` on every structural placement.
7. Placement: Best Short Side Fit across all boards and free rectangles; ties broken by board order, then y, then x, then non-rotated first. Place, split intersecting free rectangles, prune contained ones.
8. Unallocated reason: decided from the best board attempt in order: invalid dimensions → too thick (no orientation fits any board thickness) → too long → too wide → grain too steep → out of room.
9. Output: placements `{boardId, pieceId, part, x, y, l, w, t, rotated, warning}`, unallocated `{pieceId, part, reason}`, and per board `usedArea`, `kerfArea`, `remainingArea`, `totalArea`.

### Area accounting
- usedArea = Σ l·w of placed pieces.
- kerfArea = Σ of each piece's kerf strip (0.3 cm along its right and bottom sides), clipped to the board: strips beyond the board edge are not counted.
- remainingArea = totalArea − usedArea − kerfArea, so the three always sum to L·W (tested within 1e-6).
- Kerf is an estimate: one strip per piece side that faces other material, not a simulated cut sequence.

Complexity: roughly O(n · F²) where n = pieces and F = free rectangles (F grows about linearly with placements), so about O(n³) worst case; trivial for chair cut lists (under 40 pieces).

Limitations: greedy heuristic, may miss layouts a person would find; non-guillotine layouts possible; rectangles only (curved parts need a template); no knot or defect avoidance; kerf is an estimate.

## Tests (`src/lib/chair/allocate.test.ts`)
- 100 × 20 × 2 board fits four 45 × 8 × 2 pieces, not five.
- Two categories asking for 3 each of that piece: 4 placed, 2 unallocated ("out of room").
- No overlaps including kerf gap; all pieces inside board bounds.
- Thicker-than-board piece unallocated "too thick"; wider-than-board piece unallocated "too wide".
- Zero, negative, NaN or Infinity dimensions rejected.
- Cross-section rotation: a 45 × 2 × 8 piece on a 100 × 20 × 2 board places with `rotated: true`; a piece that fits neither orientation is refused.
- Unknown grain: structural pieces placed with a warning; non-structural without.
- Steep grain refuses structural pieces only.
- Area accounting: used + kerf + remaining = board area, including pieces flush with the edge.
- Multiple boards of different sizes: a long part goes to the only long-enough board; short parts fill the other; every placement within its own board.
- Same input twice gives identical output.

## Files
- New `src/lib/chair/allocate.ts`, `src/lib/chair/allocate.test.ts`.
- `src/lib/chair/stock.ts`: remove thickness resawing from `yieldOf`; keep `partIdFor`, `RUNOUT_LIMIT`, `KERF`, load-bearing regex; update `stock.test.ts` for the no-resaw rule.
- `src/components/workshop/LumberStudio.tsx`: board inventory, shared layout drawing, totals, unallocated list, warnings and labels; same styling tokens.
- `docs/ENGINEERING_RULES.md`, `docs/FEATURES.md`: document the allocator, area accounting and limits.
- `roadmap.md`: add this task.
