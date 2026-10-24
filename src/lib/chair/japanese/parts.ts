export type JPartId = "legs" | "seatSlab" | "spindles" | "crestRail" | "arms" | "connections";

export interface JPartInfo {
  id: JPartId;
  name: string;
  purpose: string;
  material: string;
  relationships: string;
  observations: string[];
  challenges: string[];
  measures: string[];
}

export const J_PART_ORDER: JPartId[] = ["legs", "seatSlab", "spindles", "crestRail", "arms", "connections"];

export const J_PARTS: Record<JPartId, JPartInfo> = {
  legs: {
    id: "legs",
    name: "Splayed legs",
    purpose:
      "Four turned or shaped legs, splayed outward in both directions, carry the seat slab. The splay widens the footprint so the chair resists tipping and racking, and gives the form its stance.",
    material: "Solid hardwood — keyaki (zelkova) is traditional; here shown under black urushi-style lacquer.",
    relationships:
      "Each leg is socketed into the underside of the seat slab, typically with a wedged through-tenon. The splay angle sets the footprint and the angle of every leg joint.",
    observations: [
      "Splay in two planes means each leg is a compound-angle cut — the hallmark of Windsor- and mingei-style chairmaking.",
      "More splay buys stability but the legs grow longer and the stance wider.",
    ],
    challenges: [
      "All four legs must match exactly or the chair rocks.",
      "Drilling the leg mortises at the wrong compound angle cannot be patched invisibly.",
    ],
    measures: ["legLength", "legSeatAngle", "footprintWidth", "footprintDepth"],
  },
  seatSlab: {
    id: "seatSlab",
    name: "Seat slab",
    purpose:
      "A single shaped slab of wood is the structural heart of the chair: legs socket into it from below, posts and spindles rise from it above.",
    material: "Solid slab, often left pale and oiled against a dark lacquered frame.",
    relationships:
      "Carries every other part. Its width sets the crest span; its depth sets the arm length; its edge holds the spindle mortises.",
    observations: [
      "A slab seat moves across its width with the seasons — the joints must allow it.",
      "The saddle or rounded front edge is shaped for the underside of the thigh.",
    ],
    challenges: [
      "Many mortises near the back edge weaken it — spacing matters.",
      "A wide slab needs careful drying or it will cup.",
    ],
    measures: ["seatWidth", "seatDepth", "seatHeight"],
  },
  spindles: {
    id: "spindles",
    name: "Spindles & back posts",
    purpose:
      "Slender spindles between two stouter back posts carry the crest rail and support the sitter's upper back while keeping the chair visually light.",
    material: "Straight-grained hardwood, shaved or turned so the grain runs unbroken end to end.",
    relationships:
      "Socketed into the seat slab below and the crest rail above. Their number sets the spacing — and how much of the back each one carries.",
    observations: [
      "Spindles work in compression and bending; slenderness is possible because the crest ties their tops together.",
      "Fewer, wider-spaced spindles read more austere; more spindles read more traditional.",
    ],
    challenges: [
      "Each spindle is a different length where the crest curves.",
      "Thin mortises in the slab edge must not break out.",
    ],
    measures: ["spindleSpacing", "spindleLength", "backHeight"],
  },
  crestRail: {
    id: "crestRail",
    name: "Crest rail",
    purpose:
      "The curved top rail ties the back posts together, stiffens the whole back, and is the part the eye reads first.",
    material: "Hardwood, bent or sawn to the curve; under lacquer the curve is the only ornament.",
    relationships:
      "Joins the tops of the back posts and receives the spindle tenons. Its span equals the seat width.",
    observations: [
      "The gentle bow follows the shoulders; the rise at the centre keeps the curve alive rather than sagging.",
      "A longer span (wider seat) bends more under the same lean.",
    ],
    challenges: [
      "A sawn curve creates short grain at the ends; a bent curve needs steam or lamination.",
      "The end joints meet the posts at a compound angle.",
    ],
    measures: ["crestSpan", "overallHeight", "backHeight"],
  },
  arms: {
    id: "arms",
    name: "Armrests",
    purpose:
      "Shaped arms run from above the front legs back to the rear posts, supporting the forearms and bracing the back posts against racking.",
    material: "Same stock as the frame, shaped by spokeshave and rasp.",
    relationships:
      "The arm's slope is set by its height at the back post; its front lands over the front leg so load passes straight down.",
    observations: [
      "An arm that lands directly over a leg turns elbow load into compression in the leg — the efficient path.",
      "The arms triangulate the back posts, so the back resists side-to-side racking better than spindles alone.",
    ],
    challenges: [
      "The joint at the back post meets a leaning post at a sloping arm — a compound angle.",
      "Arms must be shaped before final assembly or the spokeshave has no room.",
    ],
    measures: ["armHeight", "armSlope", "seatDepth"],
  },
  connections: {
    id: "connections",
    name: "Structural connections",
    purpose:
      "Wedged through-tenons where the legs meet the slab, and small mortise-and-tenon or dowel joints at the spindles, crest and arms.",
    material: "Same wood, glued and wedged; no metal fasteners in the traditional form.",
    relationships:
      "Every joint angle is inherited from the leg splay, the post lean and the arm slope. Change the geometry and every joint must be re-laid out.",
    observations: [
      "The wedged leg joint is self-tightening: sitting drives the tenon home.",
      "In this educational model the joints are shown as small caps; it does not document a specific historical chair.",
    ],
    challenges: [
      "Compound-angle mortises must be drilled or chopped from a full-size drawing.",
      "A chair is racked every time someone sits — fit matters more than in casework.",
    ],
    measures: ["legSeatAngle", "armSlope"],
  },
};
