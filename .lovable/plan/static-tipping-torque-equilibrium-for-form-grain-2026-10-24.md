# Static tipping (torque equilibrium) for FORM & GRAIN

## Goal
Keep the old cm "tip margin" only as a clearly labeled heuristic, and add a real idealized 2D statics calculation around the rear support pivot, with editable assumptions and honest wording.

## Verified coordinate conventions
- Kangaroo (`geometry.ts`): +z is forward. `seatFront.z = +seatDepth/2`, and `rearFoot.z = seatRear.z - supportSpacing` sits behind it. All values are in cm.
- Component Lab 3D (`LabModel.tsx`): +z is also forward. The front legs are at `+D/2 - T` and the rear pivot is `rearZ` (four/splayed: `rz - sp`; sled: `rz - 6`; zframe: `rz - 16`).
- The old `tipMargin` uses a different frame: distance measured backward from the seat front, with base offsets (+4 sled, +14 zframe) that do not match `rearZ` in the 3D model. A shared Lab pivot helper is added, and both the 3D tilt pivot and the calculation read from it, so they cannot disagree.
- In both frames, d = (comZ − pivotZ) / 100 in meters, so d > 0 means the center of mass is forward of the rear pivot. A test locks this sign.

## 1. New pure module `src/lib/statics.ts`
- `tippingStatics({ W, d, F, h })` returns gravityMoment, pushMoment, net, thresholdF and status, or `{ ok:false, error }`.
- Sign convention: moments are positive when they rotate the chair forward, onto its feet. `gravityMoment = W·d` keeps its sign (negative d is not clamped). `pushMoment = F·h`. `net = W·d − F·h`, reported the same way in every case.
- d < 0: gravity itself overturns, so `net` is negative even when F = 0, and there is no threshold force (the chair is already past the pivot).
- d = 0: gravity provides no restoring moment, so the threshold force is 0.
- h = 0: the push has no overturning moment, and the threshold is `null` with a note.
- Validation: reject non-finite inputs, W ≤ 0, F < 0 and h < 0.
- Status labels describe an idealized static tendency, never a guaranteed outcome: "Static model: tends to stay on its feet", "Static model: at the balance point", "Static model: tends to tip backward".
- `EXAMPLE_LOADS = { W: 900, F: 250 }`, with the label "example loads, not safety standards".
- Geometry helpers: `kangarooPivot(geom)` uses the existing `rearFoot.z`. `labRearPivotZ(design)` is shared with `LabModel`.
- The editable center of mass is for the combined chair + occupant system. Its default (a fraction of seat depth, set forward of the seat rear) is labeled as an illustrative assumption, not a measurement inferred from the chair geometry or the user. Force height h is also an editable assumption.

## 2. `lab.ts` wording changes
- Rename `tipMargin` to `tipHeuristicCm` (keep a `tipMargin` alias). Label its results "Heuristic lean-back estimate".
- Change titles to estimates:
  - "Will rack loose" becomes "Racking risk high (rule-of-thumb index …)"
  - "Will loosen over years" becomes "Racking risk moderate"
  - "Holds" becomes "Racking risk low"
  - "Tips backward" and "Stable" become "Heuristic …" wording
- Detail text uses "suggests" or "may" instead of definite outcomes.

## 3. UI: "Static tipping check" panel
- Add the panel to Component Lab and to the Kangaroo stability area. Japanese is included only if its geometry exposes a rear foot.
- Inputs: W, F, h, and the CoM position, with "Load 900 N / 250 N example" and "Reset" buttons.
- SVG diagram: pivot at the rear foot, a W arrow at the CoM with signed lever d, an F arrow at height h, and two moment bars with N·m values, plus the net value, threshold and tendency label.
- A step-by-step explanation of the formulas.
- Fixed disclaimer: idealized static 2D model; excludes movement, impact, sliding, uneven ground, flex and joint failure; does not certify stability.

## 4. Tests in `src/lib/statics.test.ts`
- Acceptance case: W=900, d=0.15, F=250, h=0.8 gives 135, 200, −65 and 168.75.
- d < 0 with F = 0 gives a negative net restoring moment and the "tends to tip" status.
- d = 0 gives a restoring moment of 0 and a threshold of 0.
- Moving the rear foot further back, with everything else fixed, increases the restoring moment. Tested for both Kangaroo and the Lab.
- Sign check: default Kangaroo and Lab designs give d > 0.
- Invalid inputs (NaN, Infinity, negative W, negative h) and h = 0.
- Existing tests that use `tipMargin` must still pass.

## 5. Docs
Update `docs/ENGINEERING_RULES.md`, `docs/FEATURES.md` and `roadmap.md` with the formulas, sign convention, assumptions and limits.

Existing 3D models, Lumber Studio and the other features stay unchanged.
