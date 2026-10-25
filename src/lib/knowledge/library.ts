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
      "The Kangaroo is associated with Pierre Jeanneret's Chandigarh furniture. Its low seat and Z-shaped side frames give the lounge chair its character. Cassina documents the historic teak frame and woven cane seat and back, alongside later oak versions of the design.",
    sourceTitle: "Cassina — Kangaroo (Hommage à Pierre Jeanneret)",
    sourceUrl: "https://www.cassina.com/gb/en/products/kangaroo.html",
    parts: ["sideFrame", "seat", "backrest"],
    params: ["seatHeight", "backAngle"],
    keywords: [
      "kangaroo",
      "jeanneret",
      "chandigarh",
      "history",
      "lounge",
      "low",
      "teak",
      "design",
      "why",
    ],
    chairs: ["kangaroo"],
  },
  {
    id: "chandigarh",
    topic: "Chandigarh modernism",
    principle: "Furniture designed alongside a modernist city plan.",
    explanation:
      "Chandigarh was planned as the new capital of Punjab after 1947, with Le Corbusier leading the master plan and Pierre Jeanneret heavily involved in building and furnishing it. Its furniture belongs to this mid-century modernist context.",
    sourceTitle: "Chandigarh Administration — Historical Background",
    sourceUrl: "https://chandigarh.gov.in/historical-background",
    parts: ["sideFrame"],
    params: [],
    keywords: ["chandigarh", "modernism", "le corbusier", "history", "city", "mid-century"],
    chairs: ["kangaroo"],
  },
  {
    id: "ergonomics",
    topic: "Basic seating ergonomics",
    principle:
      "Seat height, depth and back angle should relate to the sitter's body and the activity.",
    explanation:
      "Seating should support the sitter and the task. HSE's workstation guidance relates seat height to thigh support, calls for support at the lower back, and leaves clearance between the seat front and the back of the knee. Adjust the chair to the person rather than assuming one set of dimensions fits everyone.",
    sourceTitle: "Health and Safety Executive — Good posture when using display screen equipment",
    sourceUrl: "https://www.hse.gov.uk/msd/dse/good-posture.htm",
    parts: ["seat", "backrest", "seatSlab"],
    params: ["seatHeight", "seatDepth", "backAngle", "seatWidth"],
    keywords: [
      "ergonomic",
      "comfort",
      "height",
      "depth",
      "angle",
      "recline",
      "posture",
      "body",
      "sit",
      "low",
      "knee",
    ],
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
    keywords: [
      "popliteal",
      "knee",
      "thigh",
      "seat height",
      "pressure",
      "legs",
      "circulation",
      "stand",
    ],
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
    principle:
      "A leaning sitter loads the top of the back; the joints at its base feel a multiple of that load.",
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
    principle:
      "A chair is racked every time someone sits down sideways or leans; rails, stretchers and splay resist it.",
    explanation:
      "Racking is the side-to-side twisting that loosens chairs over time. Frames resist it with triangulation: rails tying the sides together, legs splayed to widen the base, arms bracing back posts. A chair with parallel, unsplayed legs and no low stretchers relies entirely on its joint glue lines — and they eventually lose.",
    sourceTitle: WORKSHOP,
    sourceUrl: "",
    parts: ["rails", "connections", "legs", "arms", "sideFrame"],
    params: ["seatWidth", "supportSpacing", "legSplay"],
    keywords: [
      "racking",
      "wobble",
      "twist",
      "triangulation",
      "stretcher",
      "rail",
      "splay",
      "stable",
      "loose",
    ],
  },
  {
    id: "short-grain",
    topic: "Short grain",
    principle: "Where a curve or taper cuts across the fibres, the wood is weak.",
    explanation:
      "Grain that runs across a narrow section or out of a curved part creates a weak region. The USDA's bending handbook identifies cross grain and distorted grain as causes of bending failure and calls for straight-grained bending stock. Bending suitable stock into a curve avoids cutting that curve across the fibres of a straight board.",
    sourceTitle:
      "USDA Forest Products Laboratory — Bending Solid Wood to Form (Agriculture Handbook 125)",
    sourceUrl:
      "https://www.govinfo.gov/content/pkg/GOVPUB-A-PURL-gpo19467/pdf/GOVPUB-A-PURL-gpo19467.pdf",
    parts: ["sideFrame", "backrest", "crestRail"],
    params: ["backCurve", "legSplay"],
    keywords: [
      "short grain",
      "grain",
      "curve",
      "bend",
      "steam",
      "laminate",
      "weak",
      "shear",
      "sawn",
    ],
  },
  {
    id: "tenon-proportion",
    topic: "Proportioning a mortise and tenon",
    principle:
      "A tenon is commonly about one third of the stock thickness, with shoulders that register the angle.",
    explanation:
      "Workshop rule of thumb: tenon thickness near one third of the rail's thickness keeps both the tenon and the mortise walls strong. The shoulders do the aligning — when parts meet at an angle, the shoulders are cut to that angle and the joint only seats if both were laid out from the same drawing.",
    sourceTitle: "Tage Frid — Mortise and tenon (Fine Woodworking)",
    sourceUrl: "https://www.finewoodworking.com/project-guides/joinery/mortise-and-tenon.",
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
    keywords: [
      "wedge",
      "wedged",
      "through tenon",
      "leg",
      "socket",
      "windsor",
      "compound angle",
      "drill",
    ],
    chairs: ["japanese"],
  },
  {
    id: "sashimono",
    topic: "Sashimono and Japanese joinery",
    principle: "Precision-cut wooden joints let furniture fit together without nails.",
    explanation:
      "Edo sashimono uses carefully fitted wooden joints to assemble furniture without nails and with minimal metal fittings. Natural wood grain and restrained surfaces are central to the craft; much of the intricate joinery is hidden. Careful measurement, drying and fitting matter as much as the visible form.",
    sourceTitle: "Tokyo Metropolitan Government — Edo Sashimono (Wood Joinery)",
    sourceUrl: "https://www.dento-tokyo.metro.tokyo.lg.jp/english/items/16.html",
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
      "Mingei developed around Yanagi Sōetsu and fellow craftspeople in the 1920s. The movement recognized beauty in ordinary, useful objects made by often unnamed craftspeople. It encourages attention to material, proportion and workmanship in things made for daily life, rather than judging them only as signed art pieces.",
    sourceTitle: "The Japan Folk Crafts Museum — History of the Museum and Founder Soetsu Yanagi",
    sourceUrl: "https://mingeikan.or.jp/about/history/?lang=en",
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
      "Urushi is a natural lacquer made from tree sap. Thin coats cure in warm, humid conditions, building a durable surface resistant to water and acids. Black is one traditional colour. The process takes time, and the raw sap is toxic and related to poison ivy, so it belongs to a specialist finishing practice rather than ordinary painting.",
    sourceTitle: "The Metropolitan Museum of Art — Lacquerware of East Asia",
    sourceUrl: "https://www.metmuseum.org/essays/lacquerware-of-east-asia",
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
      "Dining and lounge chairs serve different activities, so they should not be treated as one fixed shape. The Design Museum documents the Eames DCW (Dining Chair Wood) and LCW (Lounge Chair Wood) as related designs for different uses. In this studio, seat height and back angle are choices to explore against the intended activity.",
    sourceTitle: "Design Museum — Chairs: 1940s",
    sourceUrl: "https://designmuseum.org/design/chairs-1940s",
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
    keywords: [
      "movement",
      "moisture",
      "shrink",
      "swell",
      "grain",
      "season",
      "crack",
      "wood",
      "slab",
    ],
  },
  {
    id: "teak",
    topic: "Teak",
    principle: "A dense, durable tropical hardwood.",
    explanation:
      "Teak is a tropical hardwood valued for durability and stability, widely used in furniture and boat building. It is naturally oily, which affects gluing and finishing.",
    sourceTitle: "USDA Wood Handbook — Commercially Important Woods, Chapter 2: Teak",
    sourceUrl: "https://www.fpl.fs.usda.gov/documnts/fplgtr/fplgtr282/chapter_02_fpl_gtr282.pdf",
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
      "Mortise-and-tenon joints are fundamental to frame construction in chairs and tables. A tenon's cheeks provide bonding surfaces, while its shoulders help locate the parts and resist twisting. Rails connect the frame members; sound joint proportions and fit matter to the resulting structure.",
    sourceTitle: "Tage Frid — Mortise and tenon (Fine Woodworking)",
    sourceUrl: "https://www.finewoodworking.com/project-guides/joinery/mortise-and-tenon.",
    parts: ["rails", "connections", "sideFrame"],
    params: ["seatWidth", "supportSpacing"],
    keywords: [
      "rail",
      "stretcher",
      "frame",
      "rack",
      "joint",
      "structure",
      "connect",
      "width",
      "support",
    ],
    chairs: ["kangaroo"],
  },
  {
    id: "cane",
    topic: "Cane and woven seating",
    principle: "Rattan cane gives a light, flexible, breathable surface.",
    explanation:
      "Chair cane is the outer skin of the rattan palm. Traditional hand caning threads individual strands through holes in the frame; pre-woven cane webbing fits into a groove and is secured with a spline. These are different seating methods, so the frame must be prepared for the method being used.",
    sourceTitle: "Cathryn Peters, The Wicker Woman — Chair Caning: History and Craft",
    sourceUrl: "https://www.wickerwoman.com/chair-caning",
    parts: ["cane", "seat", "backrest"],
    params: ["seatWidth", "seatDepth"],
    keywords: ["cane", "rattan", "weave", "woven", "seat", "back", "spline", "breathable"],
    chairs: ["kangaroo"],
  },
  {
    id: "clear-wood-strength",
    topic: "Clear-wood strength and reference stress",
    principle:
      "Handbook strength values are averages from small defect-free samples, not safe working stresses.",
    explanation:
      "The Wood Handbook tabulates modulus of rupture (bending strength) and modulus of elasticity (stiffness) as means from small clear specimens. Strength varies piece to piece (coefficient of variation about 16% for bending strength, Table 5–6), so engineers start from the 5th percentile and then divide by about 2.1 for an assumed 10-year load duration and safety (Chapter 7). Knots and sloping grain lower real lumber further.",
    sourceTitle: HANDBOOK_TITLE,
    sourceUrl: HANDBOOK_URL,
    parts: ["connections", "sideFrame", "legs", "rails"],
    params: [],
    keywords: [
      "strength",
      "stress",
      "mor",
      "rupture",
      "stiff",
      "modulus",
      "safe",
      "load",
      "break",
      "fail",
      "bend",
      "variation",
    ],
  },
];
