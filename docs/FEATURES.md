# Features — what the app does, screen by screen

## Routes
| URL | File | Purpose |
|---|---|---|
| `/` | `src/routes/index.tsx` | Studio landing page (about the whole app, not one chair). |
| `/workshop?section=…` | `src/routes/workshop.tsx` | The studio. Client-only (`ssr: false`) because it hosts WebGL. |

`section` values: `discover`, `study` (Anatomy), `design` (Parametric Studio), `build` (Assembly order), `lab` (Component Lab), `projects`, `library`, `progress`.

## 1. Landing page (`/`)
- Hero "Design chairs that hold up" with a live rotatable 3D chair (`HeroChair.tsx`).
- "Four things you can do" cards linking into workshop sections.
- "Three chairs on the bench": Kangaroo, Kuro spindle-back (Japanese), your own (Lab).
- Head metadata (title/description/og) set in the route's `head()`.

## 2. Workshop shell
- **Sidebar** (`Sidebar.tsx`): left menu of sections, renamed labels (Anatomy, Parametric Studio, Assembly order, Component Lab, Projects, Library, Progress).
- **Stage** (`Stage.tsx`): the 3D canvas area. Toolbar (right side) with typology switch (Kangaroo / Japanese), camera presets (three/front/side/back/top), Explode, **Grain & stress** toggle, **Focus** mode (hides every panel → pure 3D). Floating panels can be minimized.
- **Master's Bench** (`Bench.tsx`): collapsible right panel with tabs: Mentor chat, Shop, Joints, Lumber (and part info). Collapsing it gives the model full width.
- State lives in `store.tsx` (React context; see ARCHITECTURE).

## 3. Discover
Showcase of both chairs with story, key measurements and an entry into study/design.

## 4. Anatomy (study)
- Guided walkthrough (`Walkthrough.tsx`, data `src/lib/lessons.ts` → `WALKTHROUGH`): steps move the camera, highlight parts, explain function.
- Click any part in 3D → part card (role, grain, joinery, related in-app techniques from `src/lib/techniques.ts`).
- Limit: walkthrough content exists for Kangaroo only; Japanese shows a switch prompt.

## 5. Parametric Studio (design)
- `DesignControls.tsx` sliders.
  - Kangaroo (`ChairParams`): seatHeight, seatWidth, seatDepth, backAngle, supportSpacing, backCurve, wood (teak/walnut/oak). Baseline 36/54/56/112°/22/0.35/teak.
  - Japanese (`JapaneseParams`): seat dims, back height, leg splay, spindle count, arm height, finish (black urushi lacquer / keyaki / walnut).
- 3D model regenerates from pure geometry; `SideProfile.tsx` draws the 2D side diagram from the same geometry.
- Consequence observations (deterministic) listed and fed to the mentor.
- Save design → Projects (compare snapshots).

## 6. Grain & stress overlay (`StressOverlay.tsx`, `src/lib/chair/stress.ts`)
- Arrows show grain direction per part.
- Dots on joints: green (≤10% over original), amber (10–30%), red (>30%), labelled e.g. "32 N·m · +18%".
- Short-grain flag when a curved part's runout exceeds the 1:12 rule (≈4.8°).
- Japanese seat: seasonal movement ≈1 mm per 10 cm of width; warns never to glue across grain.
- Hidden while exploded.

## 7. Shop tab (`ShopSheet.tsx`, `src/lib/chair/shop.ts`)
- Cut list: part, qty, finished size, rough size (+2.5 cm length, +0.6 width/thickness, +3 cm per tenon end), total board feet.
- Angle schedule: compound drill angle + sightline for splayed legs, foot cuts, post angles, spindle spacing, Kangaroo shoulder angles, back lean — each with "why".

## 8. Joints tab (`JointInspector.tsx`, `src/lib/chair/joinery.ts`)
- Pick a joint per typology; drag tenon thickness/length; cross-section + side drawing update.
- Four checks (good/warn/bad + advice): tenon ≈⅓ member (round tenons ½–⅔), mortise walls ≥0.6 cm, tenon long enough but not breaking through, enough long-grain glue area.

## 9. Assembly order (build) (`AssemblyPractice.tsx`, `src/lib/assembly.ts`)
- 10 shop operations per chair, shuffled. User reorders and presses **Check my order**.
- Each dependency violation explains the real shop failure. Old quiz removed.

## 10. Component Lab (`ComponentLab.tsx`, `LabModel.tsx`, `src/lib/lab.ts`)
- Start: blank pine stool with screws (`BLANK`).
- Choose base (four / splayed / sled / zframe), back (none / slats / spindles / panel), joint (M&T / dowel / wedged / screw), wood (oak/ash/walnut/pine); sliders for seat height/depth/width, back angle, back height, leg thickness, splay; stretchers toggle.
- Live 3D generated from the same `LabDesign` being tested; **X-ray joints** shows joint markers.
- **Test this chair** → score /100 and results (stability, joints/racking, parts, comfort, wood movement, craft mismatches). Failing stability tilts the 3D chair backward.
- Parts panel collapsible, results card min/max.

## 11. Lumber Studio (`LumberStudio.tsx`, `src/lib/chair/allocate.ts` — shared multi-board layout, see ENGINEERING_RULES, `src/lib/chair/stock.ts`, `src/lib/lumber.functions.ts`)
- Enter a board L × W × T (cm) and optional grain slope, or choose a sample (straight walnut, 1:7 runout oak, knotty pine), or upload a photo.
- Deterministic matcher: for every cut-list part, how many fit (kerf 0.3 cm, section can rotate, resaw counted), waste %, cut layout diagram, verdict good/warn/bad. Load-bearing parts on grain steeper than 1:12 → bad.
- Matching parts are highlighted on the 3D chair.
- Photo → Gemini Vision report (species, cut, grain slope, defects, best/avoid parts, advice, confidence). Vision slope feeds the matcher.

## 12. Mentor ("The Master")
- Chat in the Bench. Sends question + live context (typology, section, selected part, lesson, params, changed params, computed observations) to `askMaster`.
- Answers prescriptively (what the change does, good/bad, what to change next, one question back). Sources are shown as Library titles only (no external links).
- Optional voice (ElevenLabs) — silent unless the secret exists.

## 13. Library, Projects, Progress
- Library: curated entries from `src/lib/knowledge/library.ts` + in-app techniques. No Wikipedia/YouTube links (removed deliberately).
- Projects: saved designs per typology, compare.
- Progress: walkthrough/build progress from the repository.

## Static tipping check
Bench "Tipping" tab (Kangaroo + Japanese) and a Component Lab panel: editable W, F, h and combined CoM; diagram with moment bars and worked formulas. Lab racking/tipping results are worded as rule-of-thumb estimates.
