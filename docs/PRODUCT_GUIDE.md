# FORM & GRAIN — Product guide

This guide explains what the app does in plain language, for someone who has never built a chair. The same text appears in the app under **How it works** (sidebar); the feature sections below mirror `src/lib/explainers.ts`.

## What the product is

FORM & GRAIN teaches *why chairs look the way they do*. You take two real chair designs (a Kangaroo-inspired lounge chair and a Japanese-inspired spindle-back armchair), change them with sliders, and the app shows what that does to the forces inside the chair: which joints work harder, whether it tips when you lean back, how much the seat swells and shrinks, and what you'd need to cut. The Component Lab lets you build your own chair from parts and test it the same way. An AI mentor explains the results in conversation, but only from numbers the app has calculated and a curated library.

It is a teaching tool. Nothing in it certifies that a chair is safe.

## The core idea in three steps

1. **Forces.** A sitter (900 N) and a hard lean back (250 N) push on the chair. Because the chair is standing still, the floor pushes back at the feet so everything balances. From that balance we get the turning effect (moment) at each joint.
2. **Stress.** The moment has to pass through the joint's tenon — usually the thinnest wood. Stress = moment ÷ section modulus, so a thinner tenon or a longer lever means more stress.
3. **Compare to the wood.** The USDA Wood Handbook gives how strong each species is. We reduce that to a cautious reference stress, and show each joint as a % of it.

## How to read the badges

- **Calculated** — Worked out from the chair's geometry and published wood data. Change a slider and it recomputes.
- **Calculated from assumption** — The arithmetic is real, but it starts from an assumed load (how hard someone leans, how heavy they are). Different assumptions give different numbers.
- **Rule of thumb** — Shop experience written down as a guideline (e.g. 'a tenon is about ⅓ of the wood it enters'). Useful, but not derived from physics in this app.
- **AI estimate** — An AI model looked at your photo. Treat it as a second opinion to check by eye, never a measurement.

## Woodworking in one minute

- **Grain** — Wood is a bundle of long fibres running along the tree. Along the grain it is very strong; across the grain it splits easily. Every part is cut so the grain runs along its length.
- **Joint** — Where two parts meet. A chair's weak points are almost always its joints, not the middle of a leg.
- **Mortise & tenon** — A tongue (tenon) on one part fits a matching hole (mortise) in the other, then is glued. The classic chair joint.
- **Wedged round tenon** — A round peg on the end of a leg goes through a hole in a thick seat and is split and wedged from above so it can't pull out (Windsor and Japanese chairs).
- **Racking** — The chair being pushed sideways or rocked so it tries to fold into a parallelogram. It bends every leg-to-seat joint.
- **Splay** — Legs angled outward from the seat to the floor. Feet further apart make the chair harder to tip.
- **Moisture content (MC)** — How much water is in the wood, as a % of its dry weight. Indoors it drifts with the seasons, and wood swells and shrinks with it.
- **Runout** — When the grain doesn't run parallel to the part's length but slopes out of its side. The part can split along that slope.
- **Moment (N·m)** — A turning effect: force × distance. Pushing on a long lever makes a bigger moment, which is why tall chairs and long legs put more strain on joints.
- **Stress (MPa)** — Force spread over material. A bigger cross-section spreads the same moment over more wood, so stress drops fast as parts get thicker.

## Every feature

### The assumed loads

*Where:* Used by joint stress, tipping and the Component Lab. *Badges:* Calculated from assumption.

**What it is.** Every strength and tipping number starts from how hard the chair is pushed. The app uses one set of named loads everywhere, so numbers are comparable between panels and between your design and the original.

**The physics.**

- Forces on a still chair must balance: what pushes down and back is resisted by the floor at the feet. From those balanced forces we get the turning effect (moment) at each joint.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Sitter weight | 900 N (~90 kg) | A heavy adult. Weight on the seat is what the legs and joints carry all day. | Teaching assumption |
| Backward lean | 250 N at the top of the back | Someone leaning back hard. This is what bends the back and tries to tip the chair. | Teaching assumption |
| Sideways shove | 150 N at seat height | Rocking or dragging the chair sideways. This racks the leg joints. | Teaching assumption |
| Push on one arm | 300 N | Pushing up off an arm to stand. | Teaching assumption |
| Where the sitter's weight sits | 35% of seat depth forward of the seat back | Most body weight is over the hips, near the back of the seat. | Teaching assumption |

**How it helps.** One honest, visible starting point instead of hidden multipliers. If you think someone leans harder, the numbers scale in proportion.

**What it can't tell you.** These are not a furniture test standard (such as EN 12520 or BIFMA). They are chosen to be realistic for teaching.

### Wood data and the reference stress

*Where:* Behind every 'σ … % of ref' number. *Badges:* Calculated.

**What it is.** How strong is the wood? We use measured averages from the USDA Wood Handbook, then make them cautious so a percentage under 100% means the joint has margin.

**The physics.**

- MOR (modulus of rupture) is the bending stress at which a small, perfect, knot-free test stick breaks. It's an average of many sticks.
- Real boards vary. With a 16% spread, about 1 in 20 boards is weaker than the mean × (1 − 1.645 × 0.16) ≈ 74% of the mean.
- Wood also gets weaker under load that stays for years (it creeps). The Handbook's factor of 2.1 covers ~10-year load duration plus safety.
- Reference stress = MOR × (1 − 1.645 × 0.16) ÷ 2.1. For white oak that is 36.8 MPa; for teak 35.3 MPa.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| MOR, 12% MC | per species (teak 100.7 MPa, white oak 104.8 MPa, pine 59.3 MPa) | Starting strength of clear wood. | USDA FPL-GTR-282 (2021), Wood Handbook Tables 5–3b/5–4b (metric 5–3a/5–4a) |
| Coefficient of variation | 16% | How much boards differ from the average. | USDA FPL-GTR-282 (2021), Wood Handbook Table 5–6 |
| 5th-percentile factor | 1.645 | Picks the board that's weaker than 95% of boards. | Normal distribution |
| Duration & safety factor | 2.1 | Long-term load and safety, as the Handbook applies for clear wood. | USDA FPL-GTR-282 (2021), Wood Handbook Ch. 7, p. 7–10 |
| Keyaki / lacquered wood | white oak stand-in | The Handbook has no keyaki data; a ring-porous hardwood of similar density is used and flagged. | Stated assumption |

**How it helps.** Turns 'is this joint OK?' into one comparable number: stress as a % of a cautious, sourced reference.

**What it can't tell you.** Clear-wood data: knots, checks, runout and bad glue all make real wood weaker. This is a teaching reference, not a design allowable for a code.

### Joint stress pins (3D overlay)

*Where:* Parametric Studio → Grain & joint stress. *Badges:* Calculated from assumption, Calculated.

**What it is.** Coloured pins on the 3D chair show how hard each key joint is working. Each pin gives a stress in MPa and that stress as a % of the wood's reference stress.

**The physics.**

- 1. Free-body diagram: with the sitter and lean on the chair, find the floor forces at each foot (forces and moments balance).
- 2. Moment at the joint = force × lever arm (e.g. foot force × the distance from foot to joint, or sideways shove ÷ 4 legs × seat height for racking — the 'portal method').
- 3. The joint's tenon is a small beam. Its section modulus S = width × thickness² ÷ 6 (rectangular) or π d³ ÷ 32 (round) says how well it resists bending.
- 4. Stress σ = M ÷ S. In app units, N·m ÷ cm³ gives MPa directly.
- 5. Utilisation = σ ÷ reference stress. Under 50% is green, up to 100% amber, over 100% red.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Tenon size | from the joint table (e.g. Kangaroo rails 1.3 × 3.8 cm) | The tenon is the thinnest wood the moment passes through, so it governs. | Chair drawings / joint table |
| Japanese back posts | share the lean with the spindles by stiffness (d⁴) | Posts and spindles both run seat to crest; stiffer members take more. | Beam stiffness ∝ d⁴ |
| Grain runout | limit 1:12 (≈ 4.8°) | Steeper grain slope in a curved part can split. | Shop rule / Wood Handbook Ch. 5 slope-of-grain |

**How it helps.** Shows where a design change actually hurts. Raise the seat and the rail joints go amber because the racking lever got longer — you see why, not just that.

**What it can't tell you.** Bending only. Glue-line failure, shear, splitting at the mortise wall and fatigue from years of rocking aren't modelled.

### Tipping check

*Where:* Bench → Tipping, and Component Lab. *Badges:* Calculated from assumption, Calculated.

**What it is.** Will the chair go over backwards when someone leans back? It compares the weight holding it down with the lean trying to rotate it about the rear feet.

**The physics.**

- The chair pivots about its rear feet. Weight in front of the feet pushes it back down: restoring moment = W × d.
- A backward push high on the back rotates it over: overturning moment = F × h.
- It tips when F × h > W × d. The push it can take is W × d ÷ h.
- W includes the chair itself: part volumes from the cut list × wood density from the Handbook.
- When the back reclines, the sitter's upper body leans with it. Head, arms and trunk are 67.80000000000001% of body mass with their centre 62.6% of the way up the trunk, so the combined centre moves back by 0.678 × 0.626 × 50 cm × sin(recline).

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Push | 250 N at the top of the back | A hard lean (assumption). | Teaching assumption |
| Chair weight | parts × specific gravity × 1000 × 1.12 kg/m³ | A heavy chair is harder to tip; 1.12 converts oven-dry to 12% MC weight. | USDA FPL-GTR-282 (2021), Wood Handbook Table 5–4b specific gravity |
| Body segment data | 0.678, 0.626 | Where the upper body's weight is. | Winter, Biomechanics and Motor Control of Human Movement (2009) |
| Hip-to-shoulder length | 50 cm | Adult trunk length. | Stated assumption |

**How it helps.** Explains why the Kangaroo's rear foot reaches back so far, and why splaying legs or reducing recline makes a chair safer.

**What it can't tell you.** Static 2D: no sliding, bouncing, soft floors or a sitter rocking dynamically.

### Wood movement

*Where:* Stress panel (Japanese seat) and Lab solid back panel. *Badges:* Calculated.

**What it is.** Wood swells in humid summers and shrinks in dry winters — across its width, almost never along its length. A wide glued-up seat or panel moves by millimetres.

**The physics.**

- Change in width = width × C × change in moisture content.
- C is the dimensional change coefficient: how much width changes per 1% moisture. It's bigger tangentially (flatsawn boards) than radially (quartersawn).

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Moisture swing | 4 percentage points | Indoor furniture drifts between about 6% and 10% MC across the year. | USDA FPL-GTR-282 (2021), Wood Handbook Table 13–2 |
| C (tangential), white oak | 0.00376 per %MC | How much oak moves. | USDA FPL-GTR-282 (2021), Wood Handbook Table 13–5 |
| C for teak | derived from shrinkage 2.5% R / 5.8% T | Teak isn't in Table 13–5, so we derive it with the Handbook's own equation. | USDA FPL-GTR-282 (2021), Wood Handbook Table 4–4, Eq. 13–2 |

**How it helps.** Explains why seats are built to float and panels sit loose in grooves: glue them tight and they crack.

**What it can't tell you.** Assumes a flatsawn board and the full seasonal swing; quartersawn or well-finished wood moves less.

### Component Lab

*Where:* Sidebar → Component Lab. *Badges:* Calculated from assumption, Calculated, Rule of thumb.

**What it is.** Build a chair from blocks: base, back, joint type, wood and sizes. 'Test this chair' runs the same physics as the Studio on your design.

**The physics.**

- Stability: the tipping check above, with your chair's own weight. Graded by the push it can take: under half the 250 N reference is a problem, under 250 N is 'to watch'.
- Joints: racking moment from the portal method (shove ÷ 4 legs × lever height), applied to the joint as the 3D model draws it: a ⅓-thick, 0.8-wide tenon; a round tenon 0.6 × leg; or one 9 mm dowel. Stretchers shorten the lever to the part above them.
- Screws: not calculated. Their strength depends on how well threads grip the wood (withdrawal), which the app doesn't model, so the result is labelled as a rule of thumb.
- Comfort: seat height and back angle are ergonomic rules of thumb unless you enter your knee height, which gives a personal check.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Stretcher height | 35% of leg height | Matches the 3D model; the leg only bends above the stretcher. | Model geometry |
| Seat height range | 40–47 cm | Fits most adults at a table. | Rule of thumb |
| Back angle | 95–120° | Upright dining to lounge. | Rule of thumb |

**How it helps.** Lets you discover why chairs look the way they do: try screws in pine without stretchers, then add stretchers and switch to mortise & tenon.

**What it can't tell you.** Simplified parts; joints are tested for racking only.

### Bending analysis (straight member)

*Where:* Component Lab → Bending analysis. *Badges:* Calculated from assumption, Calculated.

**What it is.** A single straight stick fixed at one end with a weight on the other — how much does it bend, and how stressed is it?

**The physics.**

- Stress at the fixed end = F × L ÷ S with S = b h² ÷ 6.
- Deflection = F L³ ÷ (3 E I), with I = b h³ ÷ 12 and E the wood's stiffness from the Handbook.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| E (stiffness) | per species, 12% MC | Stiffer wood bends less. | USDA FPL-GTR-282 (2021), Wood Handbook Tables 5–3a/5–4a |

**How it helps.** Builds intuition: doubling thickness cuts stress to ¼ and deflection to ⅛.

**What it can't tell you.** Straight, uniform parts only; the force is whatever you type in.

### Joint inspector

*Where:* Bench → Joints. *Badges:* Rule of thumb, Calculated from assumption.

**What it is.** Cross-section and side view of each joint. Drag the tenon size and see shop rules and the calculated stress change together.

**The physics.**

- Rules: tenon ≈ ⅓ of the member, at least ~4.5 mm of wall left each side, tenon no longer than the mortise is deep.
- Stress: the same σ = M ÷ S as the stress pins, at the size you've dialled in.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| ⅓ rule | tenon ≈ member ÷ 3 | Balances tenon strength against mortise wall strength. | Rule of thumb |
| Minimum wall | 0.45 cm (bad), 0.6 cm (watch) | Thin walls split when the joint is levered. | Rule of thumb |

**How it helps.** Shows the trade-off: a fatter tenon is stronger in bending but leaves thinner, weaker mortise walls.

**What it can't tell you.** The wall rule isn't calculated; only tenon bending is.

### Shop sheet (cut list & angles)

*Where:* Bench → Shop. *Badges:* Calculated.

**What it is.** Every part with its finished size, the rough size to buy, and the saw/drill angles — all from the same geometry as the 3D model.

**The physics.**

- Rough size = finished + allowance for planing and trimming.
- Compound angles for splayed legs come from combining the two tilt angles.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Allowance | +2.5 cm length, +0.6 cm width and thickness | Wood is sawn oversize, then planed to final size. | Shop practice |
| Tenon length | 3 cm each end | Parts that go into a mortise need extra length. | Joint table |

**How it helps.** Turns the design into something you could actually buy wood for and cut.

**What it can't tell you.** Doesn't plan for defects in your boards — use the lumber studio for that.

### Lumber studio

*Where:* Bench → Lumber. *Badges:* Calculated, Rule of thumb, AI estimate.

**What it is.** Enter your boards; the app packs the parts onto them, keeping grain along each part. Optionally, a photo gives an AI read of the grain.

**The physics.**

- Packing: parts are placed rectangle by rectangle (MaxRects, best short-side fit) with 3 mm lost per saw cut.
- Load-bearing parts aren't placed on boards whose grain runs out steeper than 1:12.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Kerf | 0.3 cm | Width of wood a saw blade turns into dust. | Typical blade |
| Runout limit | 1:12 | Steeper grain slope makes a loaded part likely to split. | Wood Handbook Ch. 5 (slope of grain) / shop rule |

**How it helps.** Answers 'can I build this from the wood I have?'

**What it can't tell you.** Packing is a good heuristic, not a proven optimum. The photo read is descriptive only (straight / moderate / steep) and never a measurement.

### Parametric Studio feedback

*Where:* Parametric Studio and Bench → Feedback. *Badges:* Calculated, Rule of thumb.

**What it is.** Change seat height, width, depth, recline or feet and the app tells you what changed geometrically and what that means for the sitter and the maker.

**The physics.**

- Geometry lines (heights, angles, positions) are calculated from the same functions as the 3D model.
- Craft and comfort notes are shop and ergonomic rules of thumb, labelled as such.

**The numbers and why they're there.**

| Value | Number | Why it's needed | Source |
|---|---|---|---|
| Your measurements | optional knee height | Turns 'average adult' rules into a personal check. | You |

**How it helps.** Connects every slider to a consequence, so you learn why the original design looks the way it does.

**What it can't tell you.** Comfort is personal; the rules are averages.

### The Master (AI mentor)

*Where:* Bench → Ask. *Badges:* AI estimate.

**What it is.** Ask questions in plain language. The mentor answers only from the app's knowledge library and the numbers the app has calculated for your current chair.

**The physics.**

- It is sent the calculated stress, tipping and movement lines with their assumptions, and is told which things can't be computed.
- Answers that sound overconfident or contain numbers not in the context get a workshop note added.

**How it helps.** Explains the numbers in context, in your words.

**What it can't tell you.** It's a language model: it can still phrase things badly. The panels are the source of truth.

## Every constant in one table

| Constant | Value | Used for | Source |
|---|---|---|---|
| Sitter weight | 900 N | stress, tipping | Teaching assumption |
| Backward lean | 250 N at top of back | stress, tipping | Teaching assumption |
| Sideways shove | 150 N at seat height | racking | Teaching assumption |
| Push on one arm | 300 N | Japanese arm joints | Teaching assumption |
| Sitter centre of mass | 35% of seat depth from the back | tipping, foot reactions | Teaching assumption |
| Upper-body mass / CoM fractions | 0.678 / 0.626 | recline shifts the sitter | Winter (2009) |
| Hip-to-shoulder length | 50 cm | recline shift | Assumption |
| MOR, E, specific gravity | per species, 12% MC | reference stress, stiffness, density | Wood Handbook Tables 5–3b/5–4b (5–3a/5–4a) |
| MOR coefficient of variation | 16% | 5th-percentile strength | Wood Handbook Table 5–6 |
| 5th-percentile factor | 1.645 | 5th-percentile strength | Normal distribution |
| Duration-of-load + safety | 2.1 | reference stress | Wood Handbook Ch. 7, p. 7–10 |
| Density at 12% MC | SG × 1000 × 1.12 kg/m³ | chair self-weight | From Handbook SG |
| Dimensional change C_R / C_T | per species | wood movement | Wood Handbook Table 13–5; teak via Table 4–4 + Eq. 13–2 |
| Indoor moisture swing | 4 percentage points (6–10%) | wood movement | Wood Handbook Table 13–2 |
| Runout limit | 1:12 (≈ 4.8°) | grain check, lumber matching | Slope-of-grain rule |
| Kerf | 0.3 cm | lumber layout | Typical saw blade |
| Rough-stock allowance | +2.5 cm L, +0.6 cm W/T | cut list | Shop practice |
| Tenon ⅓ rule, 0.45/0.6 cm walls | — | joint inspector | Rule of thumb |
| Seat height 40–47 cm, back 95–120° | — | comfort | Rule of thumb |

Primary source: USDA Forest Products Laboratory, *Wood Handbook — Wood as an Engineering Material*, FPL-GTR-282 (2021), https://research.fs.usda.gov/treesearch/62200

## Known limits

- Bending only: glue-line failure, shear, splitting of mortise walls, knots and defects, creep, fatigue from years of rocking, and impact are not modelled.
- Loads are teaching assumptions, not a furniture test standard.
- Statics are 2D (side view) and static: no sliding, bouncing or soft floors.
- Keyaki and lacquered wood use white oak as a stand-in; the app says so wherever it matters.
- Screwed joints are not calculated.
- Comfort checks are averages unless you enter your knee height.
- The AI mentor and photo inspector can be wrong; the panels are the source of truth.
