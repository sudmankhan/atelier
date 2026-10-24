## Architecture

- Chair geometry (`src/lib/chair/geometry.ts`) and rules (`consequences.ts`) are pure functions; 3D, 2D diagrams and the mentor all consume them so numbers never diverge.
- Mentor answers only from `src/lib/knowledge` entries plus computed geometry; never let the model invent sources.
- Persistence goes through the `StudioRepository` interface (localStorage now) so a cloud backend can swap in.
- `/workshop` is client-only (`ssr: false`) because it hosts the WebGL canvas.
- tsconfig has `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` off: R3F/drei props are incompatible with them.

- Two chair typologies live side by side: kangaroo (`src/lib/chair/*`) and japanese (`src/lib/chair/japanese/*`), each with its own params/geometry/parts/consequences; the workshop store holds both param sets and a typology switch. Shared types (AnyPartId, Observation) live in chair/parts.ts and chair/consequences.ts.
- Instruction is in-app in src/lib/techniques.ts; resources.ts holds readings only (no YouTube search links).
- Component Lab 3D (src/components/three/LabModel.tsx) is generated from the same LabDesign that src/lib/lab.ts tests, so the model and the test results never disagree.
