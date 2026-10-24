# Deterministic engine — formulas, constants, thresholds

Units: cm and degrees unless stated. All functions are pure and covered by Vitest.

## Geometry
- Kangaroo: `computeGeometry(ChairParams)` in `chair/geometry.ts` → 2D side points (seatFront, rearJoint, backTop, frontFoot…, lengths). 3D extrudes two side frames by seatWidth.
- Japanese: `computeJapanese(JapaneseParams)` in `chair/japanese/geometry.ts`. Constants: `POST_LEAN=6°`, `SLAB_T=3.5`, `LEG_INSET=4`, `CREST_BOW=4`, `CREST_RISE=2.5`.

## Consequences (`consequences.ts`, `japanese/consequences.ts`)
Compare current params vs baseline → `Observation[]` (plain facts used by UI and mentor). Japanese tolerances: `J_SPLAY_TOLERANCE_DEG=8`, `J_ARM_TOLERANCE_DEG=6` (model thresholds, not validated limits).

## Wood data (`chair/woodProperties.ts`) — USDA Wood Handbook FPL-GTR-282 (2021)
- MOR / E at 12% MC: Table 5–3b (domestic) or 5–4b (teak, imported), cross-checked against metric 5–3a / 5–4a. Specific gravity from the same tables.
- Density at 12% MC ≈ SG × 1000 × 1.12 kg/m³ (`density12`).
- `referenceStressMPa(id)` = MOR × (1 − 1.645 × 0.16) ÷ 2.1. 0.16 = MOR coefficient of variation (Table 5–6); 1.645 = 5th percentile; 2.1 = duration-of-load + safety factor for clear wood (Ch. 7 p. 7–10). White oak ≈ 36.9 MPa.
- Dimensional change coefficients C_R / C_T: Table 13–5. Teak is not listed, so `dccFromShrinkage(S) = S / (30·100 − S·(30 − 10))` (Eq. 13–2, fsp 30%) from Table 4–4 shrinkage (2.5% R, 5.8% T).
- `woodForChoice`: teak/walnut/oak map directly; keyaki and lacquer use white oak as a flagged stand-in (`proxy: true`).

## Loads (`chair/loads.ts`)
`DEFAULT_LOADS = { seatN 900, leanN 250 (top of back), rackN 150 (sideways at seat height), armN 300, comFraction 0.35 }`. Teaching assumptions, not a furniture standard; every stress and tipping result uses them.

## Free-body joint moments (`chair/freeBody.ts`)
- Kangaroo, one side frame (half of every load): front feet frictionless, rear feet take the horizontal lean. Rf = (W·(comZ − z_rf) − F·y_backTop) / span; Rr = W − Rf; H = F.
  - frontJoint = Rf × 5 cm rake; rearJoint = moment of (H, Rr) at the rear foot about the rear joint; backPost = F/2 × post height; backTopJoint = leanN × seatWidth / 12 (fixed-end rail, uniform load); railJoints = rackN/4 × seatHeight (portal method).
- Japanese: legs = max(most-loaded leg reaction × √2·run, rackN/4 × seatHeight); arms = armN × arm length / 8; posts = leanN × share × back height, share = 1 / (2 + spindles·(2/3.5)⁴) (stiffness ∝ d⁴).
- Sitter CoM (`statics.defaultComZ`) moves back with recline by 0.678 × 0.626 × 50 cm × sin(recline) (head-arms-trunk mass and CoM fractions, Winter 2009; 50 cm hip-to-shoulder assumed).

## Joint stress (`chair/jointStress.ts`, `chair/stress.ts`)
- σ (MPa) = M (N·m) ÷ S (cm³). Rectangular tenon S = b·h²/6 ("edge" bends about the wide face: t·w²/6; "flat": w·t²/6). Round tenon S = π d³ / 32. Tenon sizes in `joinery.ts` (`tenonT`, `tenonW`, `bend`).
- Utilisation u = σ / reference stress: < 0.5 ok, ≤ 1 watch, > 1 high. Moment ratio vs the original design is kept as secondary information.
- Grain runout of curved part: atan(4·sagitta/length); limit `MAX_RUNOUT_DEG` = atan(1/12) ≈ 4.8°.
- Seat/panel movement (`chair/movement.ts`): ΔW (mm) = width (cm) × 10 × C × ΔMC, ΔMC = 4 (Table 13–2: interior 6–10%), flatsawn C_T by default.

## Chair self-weight (`chair/chairMass.ts`)
Finished part volumes from the shop cut list (Lab: part sizes as LabModel draws them) × `density12`, with each part's z position → mass and CoM. `combineWeights` merges sitter and chair for tipping.

## Shop (`chair/shop.ts`)
- Rough = finished + `ALLOW {length 2.5, width 0.6, thickness 0.6}`; +`TENON=3` per tenoned end.
- Board feet = Σ qty·l·w·t (cm³) / 2359.7.
- Compound angle for splay a (side) and b (front/back): resultant = atan(√(tan²a+tan²b)), sightline = atan2(tan b, tan a). E.g. 8°/8° → 11.2° on 45°.

## Joinery (`chair/joinery.ts`)
`checkJoint(spec, tenonT, tenonL)`: rectangular tenon ≈⅓ member thickness; round tenon ½–⅔; mortise walls ≥0.6 cm; length adequate without breaking through; long-grain glue area check. `jointGrade` = worst level.

## Assembly (`assembly.ts`)
`OPS[typology]`: 10 operations each with `needs[{id, why}]`. `evaluateOrder` returns every op placed before a prerequisite with the `why`. `shuffled` seeds a random start order.

## Component Lab (`lab.ts`)
- Stability (`labTipping`): sitter (recline = backAngle − 90, 0 without a back) + `labMass` chair about `labRearPivotZ`; push `leanN` at the back top (seatHeight + cos(recline)·backHeight) or 80 cm without a back. Threshold F = W·d/h: < leanN/2 bad, < leanN warn, else good. Failing stability tilts the 3D chair.
- Joints (`labJointStress`): racking moment per leg = rackN/4 × lever, lever = seat height; × 0.65 with stretchers (stretchers at 0.35 H); H/2 for sled; H − 8 cm for z-frame. Section from `labJointSize` (shared with LabModel): M&T t = T/3, w = 0.8T (flat axis); wedged round d = 0.6T; dowel d = 0.9 cm. Utilisation vs `referenceStressMPa(wood)`. Screws: not calculated (withdrawal, Wood Handbook Ch. 8) → rule-of-thumb bad.
- Rules of thumb (badged): legs < 2.8 warn, < 2.4 bad; seat height 40–47 good, 36–50 warn, else bad — replaced by a personal check if knee (popliteal) height is entered (seat above knee → warn; > 10 cm below → warn); depth > 48 warn; no back warn; back angle 95–120 good else bad; craft mismatches.
- Panel back movement: `movementMm(seatWidth − 7, wood)`.
- Every `LabResult` carries `basis: calculated | assumption | rule` for the provenance badge.

## Stock matcher (`chair/stock.ts`)
`KERF=0.3`; `yieldOf` = floor((L+k)/(l+k))·floor((W+k)/(w+k))·floor((T+k)/(t+k)), trying both section orientations. Load-bearing regex `/leg|post|support|rail|crest|spindle|arm/i`. Verdict: no fit → bad; load-bearing and grainSlope < `RUNOUT_LIMIT=12` → bad; fits fewer than qty → warn; else good. Waste % from placed layout area. `partIdFor` maps cut names to 3D part ids for highlighting.

## Shared lumber allocation (`chair/allocate.ts`)
`allocate(boards, cuts)` expands the cut list into pieces (`Leg#1…`), sorts them (area ↓, length ↓, name, index) and places each with MaxRects + Best Short Side Fit across all boards (ties: board order, y, x, unrotated first). Heuristic, not a global optimum; layouts may be non-guillotine (conceptual, not a saw-cut sequence).
- Grain always runs along board length. Cross-section may swap w/t (`rotated: true`) only if face width ≤ board width and thickness ≤ board thickness. No resawing.
- Kerf: pieces inflated by `KERF` on length and width inside a (L+kerf)×(W+kerf) bin, so pieces may sit flush on far edges. kerfArea = Σ(inflated rect ∩ board) − piece area (off-board kerf not counted). remaining = total − used − kerf.
- Grain steeper than 1:12 refuses structural parts; unknown grain places them with a warning.
- Unallocated reasons: invalid dimensions, too thick, too long, too wide, grain too steep, out of room. Invalid boards (≤0 or non-finite) are ignored and listed.
- Complexity ≈ O(n·F²), F = free rects (≈O(n³) worst case). Limits: greedy, rectangles only, no defect avoidance, kerf estimated.

## Static tipping (torque model) — `src/lib/statics.ts`
- Convention: +z forward (cm). d = (comZ − pivotZ)/100 m, positive when the combined chair + occupant CoM is forward of the rear support pivot. Negative d is kept.
- Gravity moment W·d (signed), overturning F·h, net = W·d − F·h, threshold F = W·d/h (h > 0, d ≥ 0; otherwise n/a).
- Status is an idealized static tendency ("tends to stay / balance / tends to tip"), not a real-world outcome.
- 900 N / 250 N are the `DEFAULT_LOADS` assumptions, not standards. CoM default (35% of seat depth forward of the seat rear) and 80 cm push height are illustrative assumptions.
- Excludes motion, impact, sliding, uneven ground, flex and joint failure. Does not certify stability.
- W includes the chair's own weight (`chairMass.ts`) and the recline-shifted sitter; Bench pushes at the actual back-top height.
