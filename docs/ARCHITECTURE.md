# Architecture

## Stack
- TanStack Start v1 (React 19, SSR + server functions), Vite 7, target Cloudflare Workers (workerd — no Node-only APIs server-side).
- Tailwind CSS v4 via `src/styles.css` (semantic tokens; no hardcoded colors in components).
- Three.js via `@react-three/fiber` + `@react-three/drei`; Framer Motion; Sonner toasts; shadcn/ui in `src/components/ui`.
- AI: `@lovable.dev/ai-gateway` (Gemini). No database yet — localStorage.
- Tests: Vitest (`src/lib/chair/*.test.ts`, `src/test/`).

## Folder map
```text
src/
  routes/           __root.tsx (shell, head), index.tsx (landing), workshop.tsx (studio, ssr:false)
  components/
    workshop/       store.tsx, Sidebar, Stage, Bench, DesignControls, Walkthrough, Pages,
                    ShopSheet, JointInspector, AssemblyPractice, ComponentLab, LumberStudio
    three/          ChairModel (Kangaroo), JapaneseChairModel, StudioCanvas, JapaneseCanvas,
                    HeroChair, StressOverlay, LabModel, textures.ts
    SideProfile.tsx 2D side diagram
  lib/
    chair/          params, geometry, parts, consequences (Kangaroo)
                    japanese/ params, geometry, parts, consequences
                    stress, shop, joinery, stock  (shared engines, both typologies)
    lab.ts          Component Lab model + tests
    assembly.ts     operation dependency graph
    lessons.ts      walkthrough + build steps
    techniques.ts   in-app technique guides
    knowledge/      library.ts (corpus), retrieve.ts (keyword RAG)
    storage/        repository.ts (StudioRepository, localRepository)
    mentor.functions.ts  askMaster, voiceStatus, speakMaster (server fns)
    lumber.functions.ts  inspectLumber (server fn, vision)
docs/               this documentation
AGENTS.md           architecture rules; roadmap.md task list
```

## Core principle: one source of truth
Pure functions compute everything from parameters:
```text
params ──> geometry ──> 3D mesh (R3F)
                   ├──> 2D SideProfile
                   ├──> consequences (observations) ──> UI + mentor context
                   ├──> stress / shop / joinery / stock
LabDesign ──> LabModel 3D  and  evaluateLab()  (same object → never disagree)
```
Never compute a number in a component that the engine should own.

## Two typologies
`Typology = "kangaroo" | "japanese"`. Each has its own params/geometry/parts/consequences. Shared types (`AnyPartId`, `Observation`) live in `chair/parts.ts` and `chair/consequences.ts`. The store holds both param sets plus the active typology.

## State (`components/workshop/store.tsx`)
React context (`useWorkshop`) holding: section, bench tab, typology, both param sets, selected part, camera preset, explode, overlays, chat history, progress. The context object is stashed on `globalThis` so HMR of `store.tsx` does not create a second context (this fixed a "useWorkshop outside provider" crash). Section is mirrored to the `?section=` search param.

## Persistence
`StudioRepository` interface (`lib/storage/repository.ts`): saved designs (`SavedDesign` with typology + params), progress (`Progress`). `localRepository` implements it with localStorage. To add a cloud backend, implement the same interface and swap it in — UI must not call localStorage directly.

## Server boundary
Only `*.functions.ts` (`createServerFn`) run on the server: `askMaster`, `voiceStatus`, `speakMaster`, `inspectLumber`. They read `process.env` inside handlers and dynamically import heavy modules. See AI_AND_APIS.md.

## tsconfig note
`exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are OFF because R3F/drei prop types break under them.
