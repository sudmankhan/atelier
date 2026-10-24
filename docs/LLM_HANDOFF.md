# Handoff guide for another developer / LLM

## Run locally
```bash
bun install
bun dev                 # http://localhost:8080 (or Vite default)
bunx vitest run         # all tests (chair engine, lab, stock, routing)
bunx tsgo --noEmit      # typecheck (or tsc)
```
AI features need a Lovable AI Gateway key (`LOVABLE_API_KEY`) — automatic on Lovable. Voice needs `ELEVENLABS_API_KEY`. Without keys, everything except Mentor/Lumber photo still works.

## Invariants (do not break)
1. Numbers come only from pure modules in `src/lib/chair/*`, `lab.ts`, `assembly.ts`. 3D, 2D, UI and mentor all consume them.
2. Component Lab 3D (`LabModel.tsx`) is generated from the exact `LabDesign` passed to `evaluateLab`.
3. Mentor answers only from `src/lib/knowledge` + computed observations; never invent sources; no external links (Wikipedia/YouTube removed on purpose).
4. Instruction is in-app (`techniques.ts`), not links.
5. Persistence only through `StudioRepository`.
6. `/workshop` stays `ssr: false`; never statically import WebGL modules into SSR routes.
7. Routing is TanStack Router file routes; never edit `routeTree.gen.ts`; never add react-router-dom.
8. Styling via semantic tokens in `src/styles.css`.
9. Store context stays stashed on `globalThis` (HMR safety). React effects must not return non-functions (caused "destroy is not a function").
10. Never claim strength/safety/comfort guarantees; label all results as teaching estimates.

## How to extend
- New chair typology: add `src/lib/chair/<name>/{params,geometry,parts,consequences}.ts`, a 3D model + canvas in `components/three`, extend `Typology`, store, controls, `stress.ts`, `shop.ts`, `joinery.ts`, `assembly.ts` OPS, knowledge entries, tests.
- Better mentor: add knowledge entries; add observations; optionally implement `Retriever` with embeddings.
- Cloud save: implement `StudioRepository` against a backend.

## Tests that exist
`consequences.test.ts`, `japanese/consequences.test.ts`, `stress.test.ts`, `shop.test.ts`, `steps456.test.ts` (joinery, assembly, lab), `stock.test.ts`, `woodProperties.test.ts`, `freeBody.test.ts` (hand-calculated moments), `chairMass.test.ts`, `calculated.test.ts`, `regressions.test.ts`, `src/lib/explainers.test.ts` (every badge topic has an explainer), `src/test/app-routing.test.tsx`.

## Known limits
- No FEA. Joint stress = free-body bending moment ÷ tenon section vs a USDA clear-wood reference stress, under assumed loads; bending only (no glue line, shear, splitting, fatigue). Screws not calculated. Keyaki uses a white-oak stand-in. Statics are 2D.
- Lab 3D uses straight parts only (no carved seats, bent rails).
- Anatomy walkthrough only for Kangaroo.
- Keyword RAG, small corpus.
- Part thicknesses in cut lists are standard assumptions (e.g. 3.8 cm side frames, 4 cm legs).

## Open work (hackathon list)
- Animated "sit & stress" test (load animation, joint shear / tipping).
- Printable shop pack (1:1 drilling template PDF, cut sheet, STL/DXF export).
- Guided judge tour (scripted 60 s walkthrough).
- Done: Lumber Studio (stock matcher + Gemini Vision inspector).
