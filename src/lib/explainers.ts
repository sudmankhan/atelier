// Plain-language explanations of every feature: what it shows, the physics, why each number is there,
// how it helps, and what it cannot tell you. Rendered in-app ("How it works") and mirrored in docs/PRODUCT_GUIDE.md.
import { DEFAULT_LOADS } from "./chair/loads";
import { DEFAULT_DELTA_MC } from "./chair/movement";
import { DURATION_SAFETY_FACTOR, HANDBOOK, MOR_COV, Z_5PCT, referenceStressMPa, woodValue } from "./chair/woodProperties";
import { HAT_COM_FRACTION, HAT_MASS_FRACTION, HIP_TO_SHOULDER_CM } from "./statics";

export type Provenance = "calculated" | "assumption" | "rule" | "ai";

export const PROVENANCE: Record<Provenance, { label: string; meaning: string }> = {
  calculated: { label: "Calculated", meaning: "Worked out from the chair's geometry and published wood data. Change a slider and it recomputes." },
  assumption: { label: "Calculated from assumption", meaning: "The arithmetic is real, but it starts from an assumed load (how hard someone leans, how heavy they are). Different assumptions give different numbers." },
  rule: { label: "Rule of thumb", meaning: "Shop experience written down as a guideline (e.g. 'a tenon is about ⅓ of the wood it enters'). Useful, but not derived from physics in this app." },
  ai: { label: "AI estimate", meaning: "An AI model looked at your photo. Treat it as a second opinion to check by eye, never a measurement." },
};

export interface ExplainerValue { name: string; value: string; why: string; source: string }
export interface Explainer {
  id: string;
  title: string;
  where: string;
  provenance: Provenance[];
  what: string;
  physics: string[];
  values: ExplainerValue[];
  helps: string;
  limits: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const L = DEFAULT_LOADS;

export const PRIMER: { term: string; meaning: string }[] = [
  { term: "Grain", meaning: "Wood is a bundle of long fibres running along the tree. Along the grain it is very strong; across the grain it splits easily. Every part is cut so the grain runs along its length." },
  { term: "Joint", meaning: "Where two parts meet. A chair's weak points are almost always its joints, not the middle of a leg." },
  { term: "Mortise & tenon", meaning: "A tongue (tenon) on one part fits a matching hole (mortise) in the other, then is glued. The classic chair joint." },
  { term: "Wedged round tenon", meaning: "A round peg on the end of a leg goes through a hole in a thick seat and is split and wedged from above so it can't pull out (Windsor and Japanese chairs)." },
  { term: "Racking", meaning: "The chair being pushed sideways or rocked so it tries to fold into a parallelogram. It bends every leg-to-seat joint." },
  { term: "Splay", meaning: "Legs angled outward from the seat to the floor. Feet further apart make the chair harder to tip." },
  { term: "Moisture content (MC)", meaning: "How much water is in the wood, as a % of its dry weight. Indoors it drifts with the seasons, and wood swells and shrinks with it." },
  { term: "Runout", meaning: "When the grain doesn't run parallel to the part's length but slopes out of its side. The part can split along that slope." },
  { term: "Moment (N·m)", meaning: "A turning effect: force × distance. Pushing on a long lever makes a bigger moment, which is why tall chairs and long legs put more strain on joints." },
  { term: "Stress (MPa)", meaning: "Force spread over material. A bigger cross-section spreads the same moment over more wood, so stress drops fast as parts get thicker." },
];

export const EXPLAINERS: Explainer[] = [
  {
    id: "loads",
    title: "The assumed loads",
    where: "Used by joint stress, tipping and the Component Lab",
    provenance: ["assumption"],
    what: "Every strength and tipping number starts from how hard the chair is pushed. The app uses one set of named loads everywhere, so numbers are comparable between panels and between your design and the original.",
    physics: ["Forces on a still chair must balance: what pushes down and back is resisted by the floor at the feet. From those balanced forces we get the turning effect (moment) at each joint."],
    values: [
      { name: "Sitter weight", value: `${L.seatN} N (~90 kg)`, why: "A heavy adult. Weight on the seat is what the legs and joints carry all day.", source: "Teaching assumption" },
      { name: "Backward lean", value: `${L.leanN} N at the top of the back`, why: "Someone leaning back hard. This is what bends the back and tries to tip the chair.", source: "Teaching assumption" },
      { name: "Sideways shove", value: `${L.rackN} N at seat height`, why: "Rocking or dragging the chair sideways. This racks the leg joints.", source: "Teaching assumption" },
      { name: "Push on one arm", value: `${L.armN} N`, why: "Pushing up off an arm to stand.", source: "Teaching assumption" },
      { name: "Where the sitter's weight sits", value: `${L.comFraction * 100}% of seat depth forward of the seat back`, why: "Most body weight is over the hips, near the back of the seat.", source: "Teaching assumption" },
    ],
    helps: "One honest, visible starting point instead of hidden multipliers. If you think someone leans harder, the numbers scale in proportion.",
    limits: "These are not a furniture test standard (such as EN 12520 or BIFMA). They are chosen to be realistic for teaching.",
  },
  {
    id: "wood",
    title: "Wood data and the reference stress",
    where: "Behind every 'σ … % of ref' number",
    provenance: ["calculated"],
    what: "How strong is the wood? We use measured averages from the USDA Wood Handbook, then make them cautious so a percentage under 100% means the joint has margin.",
    physics: [
      "MOR (modulus of rupture) is the bending stress at which a small, perfect, knot-free test stick breaks. It's an average of many sticks.",
      `Real boards vary. With a 16% spread, about 1 in 20 boards is weaker than the mean × (1 − ${Z_5PCT} × ${MOR_COV}) ≈ 74% of the mean.`,
      `Wood also gets weaker under load that stays for years (it creeps). The Handbook's factor of ${DURATION_SAFETY_FACTOR} covers ~10-year load duration plus safety.`,
      `Reference stress = MOR × (1 − ${Z_5PCT} × ${MOR_COV}) ÷ ${DURATION_SAFETY_FACTOR}. For white oak that is ${r1(referenceStressMPa("oak"))} MPa; for teak ${r1(referenceStressMPa("teak"))} MPa.`,
    ],
    values: [
      { name: "MOR, 12% MC", value: `per species (teak ${r1(woodValue("teak", "12pct").MOR_MPa!)} MPa, white oak ${r1(woodValue("oak", "12pct").MOR_MPa!)} MPa, pine ${r1(woodValue("pine", "12pct").MOR_MPa!)} MPa)`, why: "Starting strength of clear wood.", source: `${HANDBOOK} Tables 5–3b/5–4b (metric 5–3a/5–4a)` },
      { name: "Coefficient of variation", value: `${MOR_COV * 100}%`, why: "How much boards differ from the average.", source: `${HANDBOOK} Table 5–6` },
      { name: "5th-percentile factor", value: `${Z_5PCT}`, why: "Picks the board that's weaker than 95% of boards.", source: "Normal distribution" },
      { name: "Duration & safety factor", value: `${DURATION_SAFETY_FACTOR}`, why: "Long-term load and safety, as the Handbook applies for clear wood.", source: `${HANDBOOK} Ch. 7, p. 7–10` },
      { name: "Keyaki / lacquered wood", value: "white oak stand-in", why: "The Handbook has no keyaki data; a ring-porous hardwood of similar density is used and flagged.", source: "Stated assumption" },
    ],
    helps: "Turns 'is this joint OK?' into one comparable number: stress as a % of a cautious, sourced reference.",
    limits: "Clear-wood data: knots, checks, runout and bad glue all make real wood weaker. This is a teaching reference, not a design allowable for a code.",
  },
  {
    id: "stress",
    title: "Joint stress pins (3D overlay)",
    where: "Parametric Studio → Grain & joint stress",
    provenance: ["assumption", "calculated"],
    what: "Coloured pins on the 3D chair show how hard each key joint is working. Each pin gives a stress in MPa and that stress as a % of the wood's reference stress.",
    physics: [
      "1. Free-body diagram: with the sitter and lean on the chair, find the floor forces at each foot (forces and moments balance).",
      "2. Moment at the joint = force × lever arm (e.g. foot force × the distance from foot to joint, or sideways shove ÷ 4 legs × seat height for racking — the 'portal method').",
      "3. The joint's tenon is a small beam. Its section modulus S = width × thickness² ÷ 6 (rectangular) or π d³ ÷ 32 (round) says how well it resists bending.",
      "4. Stress σ = M ÷ S. In app units, N·m ÷ cm³ gives MPa directly.",
      "5. Utilisation = σ ÷ reference stress. Under 50% is green, up to 100% amber, over 100% red.",
    ],
    values: [
      { name: "Tenon size", value: "from the joint table (e.g. Kangaroo rails 1.3 × 3.8 cm)", why: "The tenon is the thinnest wood the moment passes through, so it governs.", source: "Chair drawings / joint table" },
      { name: "Japanese back posts", value: "share the lean with the spindles by stiffness (d⁴)", why: "Posts and spindles both run seat to crest; stiffer members take more.", source: "Beam stiffness ∝ d⁴" },
      { name: "Grain runout", value: `limit 1:12 (≈ 4.8°)`, why: "Steeper grain slope in a curved part can split.", source: "Shop rule / Wood Handbook Ch. 5 slope-of-grain" },
    ],
    helps: "Shows where a design change actually hurts. Raise the seat and the rail joints go amber because the racking lever got longer — you see why, not just that.",
    limits: "Bending only. Glue-line failure, shear, splitting at the mortise wall and fatigue from years of rocking aren't modelled.",
  },
  {
    id: "tipping",
    title: "Tipping check",
    where: "Bench → Tipping, and Component Lab",
    provenance: ["assumption", "calculated"],
    what: "Will the chair go over backwards when someone leans back? It compares the weight holding it down with the lean trying to rotate it about the rear feet.",
    physics: [
      "The chair pivots about its rear feet. Weight in front of the feet pushes it back down: restoring moment = W × d.",
      "A backward push high on the back rotates it over: overturning moment = F × h.",
      "It tips when F × h > W × d. The push it can take is W × d ÷ h.",
      "W includes the chair itself: part volumes from the cut list × wood density from the Handbook.",
      `When the back reclines, the sitter's upper body leans with it. Head, arms and trunk are ${HAT_MASS_FRACTION * 100}% of body mass with their centre ${HAT_COM_FRACTION * 100}% of the way up the trunk, so the combined centre moves back by ${HAT_MASS_FRACTION} × ${HAT_COM_FRACTION} × ${HIP_TO_SHOULDER_CM} cm × sin(recline).`,
    ],
    values: [
      { name: "Push", value: `${L.leanN} N at the top of the back`, why: "A hard lean (assumption).", source: "Teaching assumption" },
      { name: "Chair weight", value: "parts × specific gravity × 1000 × 1.12 kg/m³", why: "A heavy chair is harder to tip; 1.12 converts oven-dry to 12% MC weight.", source: `${HANDBOOK} Table 5–4b specific gravity` },
      { name: "Body segment data", value: `${HAT_MASS_FRACTION}, ${HAT_COM_FRACTION}`, why: "Where the upper body's weight is.", source: "Winter, Biomechanics and Motor Control of Human Movement (2009)" },
      { name: "Hip-to-shoulder length", value: `${HIP_TO_SHOULDER_CM} cm`, why: "Adult trunk length.", source: "Stated assumption" },
    ],
    helps: "Explains why the Kangaroo's rear foot reaches back so far, and why splaying legs or reducing recline makes a chair safer.",
    limits: "Static 2D: no sliding, bouncing, soft floors or a sitter rocking dynamically.",
  },
  {
    id: "movement",
    title: "Wood movement",
    where: "Stress panel (Japanese seat) and Lab solid back panel",
    provenance: ["calculated"],
    what: "Wood swells in humid summers and shrinks in dry winters — across its width, almost never along its length. A wide glued-up seat or panel moves by millimetres.",
    physics: [
      "Change in width = width × C × change in moisture content.",
      "C is the dimensional change coefficient: how much width changes per 1% moisture. It's bigger tangentially (flatsawn boards) than radially (quartersawn).",
    ],
    values: [
      { name: "Moisture swing", value: `${DEFAULT_DELTA_MC} percentage points`, why: "Indoor furniture drifts between about 6% and 10% MC across the year.", source: `${HANDBOOK} Table 13–2` },
      { name: "C (tangential), white oak", value: "0.00376 per %MC", why: "How much oak moves.", source: `${HANDBOOK} Table 13–5` },
      { name: "C for teak", value: "derived from shrinkage 2.5% R / 5.8% T", why: "Teak isn't in Table 13–5, so we derive it with the Handbook's own equation.", source: `${HANDBOOK} Table 4–4, Eq. 13–2` },
    ],
    helps: "Explains why seats are built to float and panels sit loose in grooves: glue them tight and they crack.",
    limits: "Assumes a flatsawn board and the full seasonal swing; quartersawn or well-finished wood moves less.",
  },
  {
    id: "lab",
    title: "Component Lab",
    where: "Sidebar → Component Lab",
    provenance: ["assumption", "calculated", "rule"],
    what: "Build a chair from blocks: base, back, joint type, wood and sizes. 'Test this chair' runs the same physics as the Studio on your design.",
    physics: [
      "Stability: the tipping check above, with your chair's own weight. Graded by the push it can take: under half the 250 N reference is a problem, under 250 N is 'to watch'.",
      "Joints: racking moment from the portal method (shove ÷ 4 legs × lever height), applied to the joint as the 3D model draws it: a ⅓-thick, 0.8-wide tenon; a round tenon 0.6 × leg; or one 9 mm dowel. Stretchers shorten the lever to the part above them.",
      "Screws: not calculated. Their strength depends on how well threads grip the wood (withdrawal), which the app doesn't model, so the result is labelled as a rule of thumb.",
      "Comfort: seat height and back angle are ergonomic rules of thumb unless you enter your knee height, which gives a personal check.",
    ],
    values: [
      { name: "Stretcher height", value: "35% of leg height", why: "Matches the 3D model; the leg only bends above the stretcher.", source: "Model geometry" },
      { name: "Seat height range", value: "40–47 cm", why: "Fits most adults at a table.", source: "Rule of thumb" },
      { name: "Back angle", value: "95–120°", why: "Upright dining to lounge.", source: "Rule of thumb" },
    ],
    helps: "Lets you discover why chairs look the way they do: try screws in pine without stretchers, then add stretchers and switch to mortise & tenon.",
    limits: "Simplified parts; joints are tested for racking only.",
  },
  {
    id: "beam",
    title: "Bending analysis (straight member)",
    where: "Component Lab → Bending analysis",
    provenance: ["assumption", "calculated"],
    what: "A single straight stick fixed at one end with a weight on the other — how much does it bend, and how stressed is it?",
    physics: ["Stress at the fixed end = F × L ÷ S with S = b h² ÷ 6.", "Deflection = F L³ ÷ (3 E I), with I = b h³ ÷ 12 and E the wood's stiffness from the Handbook."],
    values: [{ name: "E (stiffness)", value: "per species, 12% MC", why: "Stiffer wood bends less.", source: `${HANDBOOK} Tables 5–3a/5–4a` }],
    helps: "Builds intuition: doubling thickness cuts stress to ¼ and deflection to ⅛.",
    limits: "Straight, uniform parts only; the force is whatever you type in.",
  },
  {
    id: "joints",
    title: "Joint inspector",
    where: "Bench → Joints",
    provenance: ["rule", "assumption"],
    what: "Cross-section and side view of each joint. Drag the tenon size and see shop rules and the calculated stress change together.",
    physics: ["Rules: tenon ≈ ⅓ of the member, at least ~4.5 mm of wall left each side, tenon no longer than the mortise is deep.", "Stress: the same σ = M ÷ S as the stress pins, at the size you've dialled in."],
    values: [
      { name: "⅓ rule", value: "tenon ≈ member ÷ 3", why: "Balances tenon strength against mortise wall strength.", source: "Rule of thumb" },
      { name: "Minimum wall", value: "0.45 cm (bad), 0.6 cm (watch)", why: "Thin walls split when the joint is levered.", source: "Rule of thumb" },
    ],
    helps: "Shows the trade-off: a fatter tenon is stronger in bending but leaves thinner, weaker mortise walls.",
    limits: "The wall rule isn't calculated; only tenon bending is.",
  },
  {
    id: "shop",
    title: "Shop sheet (cut list & angles)",
    where: "Bench → Shop",
    provenance: ["calculated"],
    what: "Every part with its finished size, the rough size to buy, and the saw/drill angles — all from the same geometry as the 3D model.",
    physics: ["Rough size = finished + allowance for planing and trimming.", "Compound angles for splayed legs come from combining the two tilt angles."],
    values: [
      { name: "Allowance", value: "+2.5 cm length, +0.6 cm width and thickness", why: "Wood is sawn oversize, then planed to final size.", source: "Shop practice" },
      { name: "Tenon length", value: "3 cm each end", why: "Parts that go into a mortise need extra length.", source: "Joint table" },
    ],
    helps: "Turns the design into something you could actually buy wood for and cut.",
    limits: "Doesn't plan for defects in your boards — use the lumber studio for that.",
  },
  {
    id: "lumber",
    title: "Lumber studio",
    where: "Bench → Lumber",
    provenance: ["calculated", "rule", "ai"],
    what: "Enter your boards; the app packs the parts onto them, keeping grain along each part. Optionally, a photo gives an AI read of the grain.",
    physics: ["Packing: parts are placed rectangle by rectangle (MaxRects, best short-side fit) with 3 mm lost per saw cut.", "Load-bearing parts aren't placed on boards whose grain runs out steeper than 1:12."],
    values: [
      { name: "Kerf", value: "0.3 cm", why: "Width of wood a saw blade turns into dust.", source: "Typical blade" },
      { name: "Runout limit", value: "1:12", why: "Steeper grain slope makes a loaded part likely to split.", source: "Wood Handbook Ch. 5 (slope of grain) / shop rule" },
    ],
    helps: "Answers 'can I build this from the wood I have?'",
    limits: "Packing is a good heuristic, not a proven optimum. The photo read is descriptive only (straight / moderate / steep) and never a measurement.",
  },
  {
    id: "studio",
    title: "Parametric Studio feedback",
    where: "Parametric Studio and Bench → Feedback",
    provenance: ["calculated", "rule"],
    what: "Change seat height, width, depth, recline or feet and the app tells you what changed geometrically and what that means for the sitter and the maker.",
    physics: ["Geometry lines (heights, angles, positions) are calculated from the same functions as the 3D model.", "Craft and comfort notes are shop and ergonomic rules of thumb, labelled as such."],
    values: [{ name: "Your measurements", value: "optional knee height", why: "Turns 'average adult' rules into a personal check.", source: "You" }],
    helps: "Connects every slider to a consequence, so you learn why the original design looks the way it does.",
    limits: "Comfort is personal; the rules are averages.",
  },
  {
    id: "mentor",
    title: "The Master (AI mentor)",
    where: "Bench → Ask",
    provenance: ["ai"],
    what: "Ask questions in plain language. The mentor answers only from the app's knowledge library and the numbers the app has calculated for your current chair.",
    physics: ["It is sent the calculated stress, tipping and movement lines with their assumptions, and is told which things can't be computed.", "Answers that sound overconfident or contain numbers not in the context get a workshop note added."],
    values: [],
    helps: "Explains the numbers in context, in your words.",
    limits: "It's a language model: it can still phrase things badly. The panels are the source of truth.",
  },
];

export const explainerById = (id: string) => EXPLAINERS.find((e) => e.id === id);
