# Deterministic engine — formulas, constants, thresholds

Units: cm and degrees unless stated. All functions are pure and covered by Vitest.

## Geometry
- Kangaroo: `computeGeometry(ChairParams)` in `chair/geometry.ts` → 2D side points (seatFront, rearJoint, backTop, frontFoot…, lengths). 3D extrudes two side frames by seatWidth.
- Japanese: `computeJapanese(JapaneseParams)` in `chair/japanese/geometry.ts`. Constants: `POST_LEAN=6°`, `SLAB_T=3.5`, `LEG_INSET=4`, `CREST_BOW=4`, `CREST_RISE=2.5`.

## Consequences (`consequences.ts`, `japanese/consequences.ts`)
Compare current params vs baseline → `Observation[]` (plain facts used by UI and mentor). Japanese tolerances: `J_SPLAY_TOLERANCE_DEG=8`, `J_ARM_TOLERANCE_DEG=6` (model thresholds, not validated limits).

## Stress (`chair/stress.ts`)
- Loads: `SEAT_LOAD_N=900` (~90 kg), `LEAN_LOAD_N=250` at back top.
- Kangaroo moments (N·m): rear = 250·(backTop.y−rearJoint.y)/100; front = 900·0.5·|seatFront.z−frontFoot.z+4|/100 + 900·0.05·frontLegLength/100; rails = 900·0.1·seatFront.y/100; backTop = 250·0.5·backrestLength·0.1/100.
- Ratio vs baseline → `levelOf`: <1.1 ok, <1.3 watch, else high.
- Grain runout of curved part: atan(4·sagitta/length); limit `MAX_RUNOUT_DEG` = atan(1/12) ≈ 4.8°.
- Seat movement: `MOVEMENT_PER_CM=0.1` mm per cm width.

## Shop (`chair/shop.ts`)
- Rough = finished + `ALLOW {length 2.5, width 0.6, thickness 0.6}`; +`TENON=3` per tenoned end.
- Board feet = Σ qty·l·w·t (cm³) / 2359.7.
- Compound angle for splay a (side) and b (front/back): resultant = atan(√(tan²a+tan²b)), sightline = atan2(tan b, tan a). E.g. 8°/8° → 11.2° on 45°.

## Joinery (`chair/joinery.ts`)
`checkJoint(spec, tenonT, tenonL)`: rectangular tenon ≈⅓ member thickness; round tenon ½–⅔; mortise walls ≥0.6 cm; length adequate without breaking through; long-grain glue area check. `jointGrade` = worst level.

## Assembly (`assembly.ts`)
`OPS[typology]`: 10 operations each with `needs[{id, why}]`. `evaluateOrder` returns every op placed before a prerequisite with the `why`. `shuffled` seeds a random start order.

## Component Lab (`lab.ts`)
- Wood strength: oak 1.0, ash 1.0, walnut 0.8, pine 0.5. Joint factor: M&T 1.0, wedged 0.95, dowel 0.6, screw 0.3.
- `tipMargin`: recline = max(0, backAngle−95) (0 if no back); comX = 0.65·seatDepth + 0.6·recline + (back?3:0); footSpread = tan(splay)·seatHeight; baseRear = sled: depth+4, zframe: depth+14, else depth+footSpread; margin = baseRear − comX. <0 bad (tips), <4 warn.
- `rackingIndex` = (seatHeight/45 · legs[0.6 sled/zframe, else 1] · stretch[0.55 if stretchers] · (3.5/legThickness)² · 0.6) / (jointFactor·woodStrength). >1 bad, >0.7 warn.
- Other checks: legs <2.8 warn, <2.4 bad; seat height 40–47 good, 36–50 warn, else bad; depth >48 warn; no back warn; back angle 95–120 good else bad; panel back → wood-movement warn; spindles+four legs+screw → craft warn; wedged without splayed base → warn; splay >14 → warn.
- `labScore` = Σ(good 2, warn 1, bad 0)/(2·n)·100.

## Stock matcher (`chair/stock.ts`)
`KERF=0.3`; `yieldOf` = floor((L+k)/(l+k))·floor((W+k)/(w+k))·floor((T+k)/(t+k)), trying both section orientations. Load-bearing regex `/leg|post|support|rail|crest|spindle|arm/i`. Verdict: no fit → bad; load-bearing and grainSlope < `RUNOUT_LIMIT=12` → bad; fits fewer than qty → warn; else good. Waste % from placed layout area. `partIdFor` maps cut names to 3D part ids for highlighting.
