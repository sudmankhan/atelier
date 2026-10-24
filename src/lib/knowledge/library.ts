import type { AnyPartId } from "@/components/workshop/store";
import { HANDBOOK_URL } from "@/lib/chair/woodProperties";

export interface KnowledgeEntry {
  id: string;
  topic: string;
  principle: string;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
  parts: AnyPartId[];
  params: string[];
  keywords: string[];
  chairs?: ("kangaroo" | "japanese")[];
}

const WORKSHOP = "Traditional workshop practice (educational summary)";
const HANDBOOK_TITLE = "Wood Handbook (USDA Forest Products Laboratory, FPL-GTR-282, 2021)";

// Curated seed library. Only these source titles may be cited by the mentor.
export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "kangaroo",
    topic: "The Kangaroo Chair",
    principle: "A low lounge chair whose side frames carry the whole form.",
    explanation:
      "The Kangaroo chair is one of the pieces associated with Pierre Jeanneret's furniture for Chandigarh in the 1950s–60s, where he worked alongside Le Corbusier on the new capital. The Chandigarh furniture was made in local teak and cane, and favoured simple, repeatable construction. The Kangaroo is a low lounge chair whose angled side frames give it its name and character.",
    sourceTitle: "Pierre Jeanneret — Wikipedia",
    sourceUrl: "",
    parts: ["sideFrame", "seat", "backrest"],
    params: ["seatHeight", "backAngle"],
    keywords: ["kangaroo", "jeanneret", "chandigarh", "history", "lounge", "low", "teak", "design", "why"],
    chairs: ["kangaroo"],
  },
  {
    id: "chandigarh",
    topic: "Chandigarh modernism",
    principle: "Furniture designed alongside a modernist city plan.",
    explanation:
      "Chandigarh was planned as the new capital of Punjab after 1947, with Le Corbusier leading the master plan and Pierre Jeanneret heavily involved in building and furnishing it. Its furniture belongs to this mid-century modernist context.",
    sourceTitle: "Chandigarh Capitol Complex — Wikipedia",
    sourceUrl: "",
    parts: ["sideFrame"],
    params: [],
    keywords: ["chandigarh", "modernism", "le corbusier", "history", "city", "mid-century"],
    chairs: ["kangaroo"],
  },
  {
    id: "ergonomics",
    topic: "Basic seating ergonomics",
    principle: "Seat height, depth and back angle should relate to the sitter's body and the activity.",
    explanation:
      "Ergonomics studies how designs fit human bodies and tasks. For chairs, the relationship between seat height and lower-leg length, seat depth and thigh length, and backrest angle and the intended activity (working versus lounging) are central. Individual bodies vary widely, so no single dimension suits everyone.",
    sourceTitle: "Human factors and ergonomics — Wikipedia",
    sourceUrl: "",
    parts: ["seat", "backrest", "seatSlab"],
    params: ["seatHeight", "seatDepth", "backAngle", "seatWidth"],
    keywords: ["ergonomic", "comfort", "height", "depth", "angle", "recline", "posture", "body", "sit", "low", "knee"],
  },
  {
    id: "popliteal",
    topic: "Popliteal height and the seat front edge",
    principle: "The seat front should not press into the underside of the thigh.",
    explanation:
      "Popliteal height is the distance from the floor to the back of the knee when seated. A seat front above it presses on the soft underside of the thigh; far below it, the knees rise and standing takes more effort. Cushioning, shoes and posture all shift the real experience, so any number is a starting point, not a guarantee.",
    sourceTitle: WORKSHOP,
    sourceUrl: "",
    parts: ["seat", "seatSlab"],
    params: ["seatHeight"],
    keywords: ["popliteal", "knee", "thigh", "seat height", "pressure", "legs", "circulation", "stand"],
  },
  {
    id: "recline-weight",
    topic: "Recline and weight distribution",
    principle: "The more a chair reclines, the more body weight the backrest carries.",
    explanation:
      "In an upright chair the sit bones carry most of the load. As the back reclines, weight transfers onto the backrest, which is why reclined chairs feel restful but are harder to rise from, and why their back joints work much harder than an upright chair's. The backrest becomes a structural part, not just a surface.",
    sourceTitle: WORKSHOP,
    sourceUrl: "",
    parts: ["backrest", "seat", "sideFrame"],
    params: ["backAngle", "backHeight"],
    keywords: ["recline", "weight", "lean", "back", "load", "relax", "rise", "lounge"],
  },
  {
    id: "lever-arm",
    topic: "The backrest as a lever",
    principle: "A leaning sitter loads the top of the back; the joints at its base feel a multiple of that load.",
    explanation:
      "Force applied at the top of a backrest acts through a lever arm down to the joints where the back meets the seat or frame. The longer the back, the greater the moment at those joints for the same lean. This is why tall-backed chairs need deeper mortises, stouter posts, or bracing — and why shortening a back stiffens it.",
    sourceTitle: WORKSHOP,
    sourceUrl: "",
    parts: ["backrest", "sideFrame", "connections", "spindles", "crestRail"],
    params: ["backAngle", "backHeight", "backCurve"],
    keywords: ["lever", "moment", "backrest", "force", "joint", "tall", "flex", "bend", "stress"],
  },
  {
    id: "racking",
    topic: "Racking and triangulation",
    principle: "A chair is racked every time someone sits down sideways or leans; rails, stretchers and splay resist it.",
    explanation:
      "Racking is the side-to-side twisting that loosens chairs over time. Frames resist it with triangulation: rails tying the sides together, legs splayed to widen the base, arms bracing back posts. A chair with parallel, unsplayed legs and no low stretchers relies entirely on its joint glue lines — and they eventually lose.",
    sourceTitle: WORKSHOP,
    sourceUrl: "",
    parts: ["rails", "connections", "legs", "arms", "sideFrame"],
    params: ["seatWidth", "supportSpacing", "legSplay"],
    keywords: ["racking", "wobble", "twist", "triangulation", "stretcher", "rail", "splay", "stable", "loose"],
  },
  {
    id: "short-grain",
    topic: "Short grain",
    principle: "Where a curve or taper cuts across the fibres, the wood is weak.",
    explanation:
      "Wood is strong along its fibres and weak across them. A curved part sawn from a straight board always has regions where the grain runs out of the part — short grain — and those are the failure lines. Steam bending and lamination keep the grain following the curve; sawing is faster but spends strength.",
    sourceTitle: "Bentwood — Wikipedia",
    sourceUrl: "",
    parts: ["sideFrame", "backrest", "crestRail"],
    params: ["backCurve", "legSplay"],
    keywords: ["short grain", "grain", "curve", "bend", "steam", "laminate", "weak", "shear", "sawn"],
  },
  {
    id: "tenon-proportion",
    topic: "Proportioning a mortise and tenon",
    principle: "A tenon is commonly about one third of the stock thickness, with shoulders that register the angle.",
    explanation:
      "Workshop rule of thumb: tenon thickness near one third of the rail's thickness keeps both the tenon and the mortise walls strong. The shoulders do the aligning — when parts meet at an angle, the shoulders are cut to that angle and the joint only seats if both were laid out from the same drawing.",
    sourceTitle: "Mortise and tenon — Wikipedia",
    sourceUrl: "",
    parts: ["connections", "rails"],
    params: ["backAngle", "supportSpacing", "legSplay"],
    keywords: ["mortise", "tenon", "proportion", "third", "shoulder", "joint", "fit", "layout"],
  },
  {
    id: "wedged-tenon",
    topic: "Wedged through-tenons for legs",
    principle: "A leg tenon driven through the seat and wedged is self-tightening under load.",
    explanation:
      "In Windsor- and mingei-style chairs the leg tenon passes through the seat slab and is split and wedged, so it expands inside the mortise. Sitting drives the joint tighter rather than looser. The price is precision: the mortise must be bored at the leg's compound splay angle, and a wrong angle cannot be patched invisibly.",
    sourceTitle: WORKSHOP,
    sourceUrl: "",
    parts: ["legs", "seatSlab", "connections"],
    params: ["legSplay", "seatHeight"],
    keywords: ["wedge", "wedged", "through tenon", "leg", "socket", "windsor", "compound angle", "drill"],
    chairs: ["japanese"],
  },
  {
    id: "sashimono",
    topic: "Sashimono and Japanese joinery",
    principle: "A tradition of joining wood to wood with precision-cut joints and no metal fasteners.",
    explanation:
      "Sashimono is the Japanese tradition of fine joinery for furniture and interiors, developed in a culture that built without nails. Joints are cut so the parts lock mechanically and the joinery itself becomes the ornament. The discipline is in the layout: every shoulder and mortise is cut to lines, not fitted by force.",
    sourceTitle: "Sashimono — Wikipedia",
    sourceUrl: "",
    parts: ["connections", "legs", "spindles", "crestRail"],
    params: [],
    keywords: ["sashimono", "japanese", "joinery", "kumiki", "no nails", "precision", "tradition"],
    chairs: ["japanese"],
  },
  {
    id: "mingei",
    topic: "Mingei and the beauty of utility",
    principle: "The Japanese folk-craft movement valued honest, useful, anonymously made things.",
    explanation:
      "Mingei, articulated by Yanagi Sōetsu in the 1920s, found beauty in everyday objects made by hand for use, rather than in signed art pieces. Chairs in this spirit — dark lacquered frames, pale seats, spare spindle backs — show structure as decoration and let proportion and craft carry the design.",
    sourceTitle: "Mingei — Wikipedia",
    sourceUrl: "",
    parts: ["legs", "seatSlab", "crestRail", "spindles"],
    params: [],
    keywords: ["mingei", "yanagi", "folk", "japanese", "utility", "beauty", "craft", "philosophy"],
    chairs: ["japanese"],
  },
  {
    id: "urushi",
    topic: "Urushi lacquer",
    principle: "A deep black finish built from many thin cured layers, not a coat of paint.",
    explanation:
      "Urushi is the sap of the lacquer tree, applied in thin layers that cure by absorbing moisture. Each layer is rubbed back before the next. The result is hard, deep and chemical-resistant, but the process is slow and the raw sap can cause severe skin reactions — historically a specialist's trade.",
    sourceTitle: "Urushi — Wikipedia",
    sourceUrl: "",
    parts: ["legs", "crestRail", "arms", "spindles"],
    params: [],
    keywords: ["urushi", "lacquer", "black", "finish", "japan", "coating"],
    chairs: ["japanese"],
  },
  {
    id: "chair-form",
    topic: "Chair proportions and types",
    principle: "The proportions of a chair signal its use.",
    explanation:
      "Chairs range from upright dining and work chairs to low, reclined lounge chairs. Lower seats and more reclined backs are characteristic of lounging, while upright backs and higher seats suit tables and tasks.",
    sourceTitle: "Chair — Wikipedia",
    sourceUrl: "",
    parts: ["seat", "backrest", "sideFrame", "seatSlab"],
    params: ["seatHeight", "backAngle", "seatDepth"],
    keywords: ["proportion", "lounge", "dining", "type", "form", "low", "seat", "back"],
  },
  {
    id: "wood-movement",
    topic: "Wood movement",
    principle: "Wood shrinks and swells with moisture, mostly across the grain.",
    explanation:
      "Wood changes dimension as its moisture content changes, with far more movement across the grain than along it. Furniture joints and panels must be designed so this movement doesn't crack parts or break glue lines. Wide slab seats and wide side frames are where this bites first.",
    sourceTitle: HANDBOOK_TITLE,
    sourceUrl: HANDBOOK_URL,
    parts: ["sideFrame", "connections", "rails", "seatSlab"],
    params: ["seatWidth"],
    keywords: ["movement", "moisture", "shrink", "swell", "grain", "season", "crack", "wood", "slab"],
  },
  {
    id: "teak",
    topic: "Teak",
    principle: "A dense, durable tropical hardwood.",
    explanation:
      "Teak is a tropical hardwood valued for durability and stability, widely used in furniture and boat building. It is naturally oily, which affects gluing and finishing.",
    sourceTitle: "Teak — Wikipedia",
    sourceUrl: "",
    parts: ["sideFrame", "rails", "seat"],
    params: [],
    keywords: ["teak", "material", "wood", "hardwood", "durable", "oil", "species"],
    chairs: ["kangaroo"],
  },
  {
    id: "frames",
    topic: "Rails and structural frames",
    principle: "Rails tie legs together into a rigid frame.",
    explanation:
      "Furniture frames are assembled from legs and rails joined with woodworking joints. Rails between the sides keep them parallel and resist racking; the joint type and fit determine how well the frame holds up to repeated loads.",
    sourceTitle: "Woodworking joints — Wikipedia",
    sourceUrl: "",
    parts: ["rails", "connections", "sideFrame"],
    params: ["seatWidth", "supportSpacing"],
    keywords: ["rail", "stretcher", "frame", "rack", "joint", "structure", "connect", "width", "support"],
    chairs: ["kangaroo"],
  },
  {
    id: "cane",
    topic: "Cane and woven seating",
    principle: "Rattan cane gives a light, flexible, breathable surface.",
    explanation:
      "Cane is made from the outer skin of rattan, a climbing palm. It is woven through holes drilled around a seat frame or pressed in as pre-woven sheet held by a spline. It is worked damp and tightens as it dries, so the frame must be stiff and square before weaving begins.",
    sourceTitle: "Rattan — Wikipedia",
    sourceUrl: "",
    parts: ["cane", "seat", "backrest"],
    params: ["seatWidth", "seatDepth"],
    keywords: ["cane", "rattan", "weave", "woven", "seat", "back", "spline", "breathable"],
    chairs: ["kangaroo"],
  },
  {
    id: "clear-wood-strength",
    topic: "Clear-wood strength and reference stress",
    principle: "Handbook strength values are averages from small defect-free samples, not safe working stresses.",
    explanation:
      "The Wood Handbook tabulates modulus of rupture (bending strength) and modulus of elasticity (stiffness) as means from small clear specimens. Strength varies piece to piece (coefficient of variation about 16% for bending strength, Table 5–6), so engineers start from the 5th percentile and then divide by about 2.1 for an assumed 10-year load duration and safety (Chapter 7). Knots and sloping grain lower real lumber further.",
    sourceTitle: HANDBOOK_TITLE,
    sourceUrl: HANDBOOK_URL,
    parts: ["connections", "sideFrame", "legs", "rails"],
    params: [],
    keywords: ["strength", "stress", "mor", "rupture", "stiff", "modulus", "safe", "load", "break", "fail", "bend", "variation"],
  },
];
