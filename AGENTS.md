<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Chair geometry (`src/lib/chair/geometry.ts`) and rules (`consequences.ts`) are pure functions; 3D, 2D diagrams and the mentor all consume them so numbers never diverge.
- Mentor answers only from `src/lib/knowledge` entries plus computed results (`src/lib/chair/calculated.ts`); never let the model invent sources or numbers.
- Persistence goes through the `StudioRepository` interface (localStorage now) so a cloud backend can swap in.
- `/workshop` is client-only (`ssr: false`) because it hosts the WebGL canvas.
- tsconfig has `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` off: R3F/drei props are incompatible with them.

- Two chair typologies live side by side: kangaroo (src/lib/chair/*) and japanese (src/lib/chair/japanese/*), each with its own params/geometry/parts/consequences; the workshop store holds both param sets and a typology switch. Shared types (AnyPartId, Observation) live in chair/parts.ts and chair/consequences.ts.
- Instruction is in-app in src/lib/techniques.ts; resources.ts holds readings only (no YouTube search links).
- Component Lab 3D (src/components/three/LabModel.tsx) is generated from the same LabDesign that src/lib/lab.ts tests, so the model and the test results never disagree.
- Strength numbers come from free-body moments (`chair/freeBody.ts`) under `chair/loads.ts` assumptions, σ = M/S on the joint section (`chair/jointStress.ts`), compared with `referenceStressMPa` from USDA Wood Handbook FPL-GTR-282 data (`chair/woodProperties.ts`). Add wood values only from the Handbook, with table and page.
- Lab joints are sized once in `labJointSize` (lab.ts) and drawn by LabModel from it.
- Every numeric panel shows a `ProvenanceBadge` linking to an entry in `src/lib/explainers.ts` (rendered by the "How it works" page; long form in docs/PRODUCT_GUIDE.md). New numbers need a badge and an explainer.
