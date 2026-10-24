// In-app technique guides — the workshop's own instruction, step by step.
// These replace external video links: the teaching happens here, interactively.
import type { AnyPartId } from "@/components/workshop/store";

export interface TechniqueStep {
  title: string;
  body: string;
}

export interface Technique {
  id: string;
  title: string;
  summary: string;
  chairs: ("kangaroo" | "japanese")[];
  parts: AnyPartId[];
  steps: TechniqueStep[];
}

export const TECHNIQUES: Technique[] = [
  {
    id: "angled-mortise-tenon",
    title: "Laying out an angled mortise and tenon",
    summary: "How to lay out a tenon whose shoulder meets a sloping part — the joint that fails first when you change a chair's angles.",
    chairs: ["kangaroo", "japanese"],
    parts: ["connections", "rails"],
    steps: [
      { title: "Draw it full-size", body: "Every angled joint starts as a full-size drawing on a board or paper. You cannot measure an angle you haven't drawn. Mark the centreline of both parts and the exact angle between them." },
      { title: "Size the tenon", body: "A common rule of thumb: the tenon is about one third of the stock's thickness, centred. Thinner and it snaps; thicker and the mortise walls get weak." },
      { title: "Lay out the shoulder angle", body: "The shoulder is cut to the angle the two parts meet at — not square. Transfer it directly from the drawing with a bevel gauge, never from a number alone." },
      { title: "Chop the mortise first", body: "Cut the mortise, then fit the tenon to it. The mortise walls must be parallel and clean; the tenon can always be shaved." },
      { title: "Test dry, then glue", body: "Assemble dry. The shoulders should close with hand pressure. Glue, clamp along the tenon's axis, and check the angle against the drawing before the glue sets." },
    ],
  },
  {
    id: "sawing-the-z-frame",
    title: "Sawing a curved side frame from solid stock",
    summary: "The Kangaroo's Z-frame is sawn from a wide board. Where the curve is tight, the grain runs out — that is the weak point.",
    chairs: ["kangaroo"],
    parts: ["sideFrame"],
    steps: [
      { title: "Make one full-size template", body: "Draw the whole side profile — front leg, seat line, back post, rear support — on thin plywood or hardboard. Both side frames come from this one template, so they stay mirror-identical." },
      { title: "Choose the board for the curve", body: "Orient the template so the grain runs as far into each curve as possible. The tightest bend decides the board width you need." },
      { title: "Watch for short grain", body: "Where the curve crosses the grain, the wood is weak across its width. If the bend is tight, consider laminating or bending instead of sawing." },
      { title: "Saw proud, then fair", body: "Bandsaw 2–3 mm outside the line, then fair the curve to the template with a spokeshave, rasp and scraper. Fairing is where the curve becomes alive." },
      { title: "Pair the frames", body: "Clamp the two frames together and plane them as one so they match exactly. Any difference twists the finished chair." },
    ],
  },
  {
    id: "hand-caning",
    title: "Hand caning a seat",
    summary: "The seven-step weave: verticals, horizontals, then the diagonals that lock the sheet together.",
    chairs: ["kangaroo"],
    parts: ["cane", "seat", "backrest"],
    steps: [
      { title: "Soak the cane", body: "Cane is worked damp so it bends without cracking. It shrinks as it dries, which is what pulls the sheet tight." },
      { title: "Set the verticals", body: "First pass: strands run front to back through the holes, kept evenly tensioned. This is the foundation layer." },
      { title: "Add the horizontals", body: "Second pass: side to side, laying over the verticals. Keep strands parallel — crossings at this stage show forever." },
      { title: "Weave the locking diagonals", body: "The diagonal passes weave over and under, locking the grid. This is where the pattern and the strength come from." },
      { title: "Finish the edge", body: "A binder cord covers the holes around the perimeter. Let the seat dry fully before anyone sits on it — drying is what sets the tension." },
    ],
  },
  {
    id: "wedged-leg-tenon",
    title: "Wedging a leg into a slab seat",
    summary: "The self-tightening joint under every spindle-chair seat: a through-tenon, split and wedged so sitting only drives it tighter.",
    chairs: ["japanese"],
    parts: ["legs", "seatSlab", "connections"],
    steps: [
      { title: "Bore at the compound angle", body: "The leg splays in two directions, so the mortise is bored at a compound angle. Set two bevel gauges from the full-size drawing and sight both while drilling." },
      { title: "Turn or taper the tenon", body: "The leg's top is a round tenon sized to the mortise. It passes right through the slab." },
      { title: "Saw the kerf and make wedges", body: "Saw a kerf across the tenon end — across the slab's grain, so the wedge doesn't split the slab — and cut a slim hardwood wedge." },
      { title: "Drive, wedge, flush", body: "Glue, drive the leg home, then drive the wedge to expand the tenon inside the mortise. Saw flush and pare smooth. The joint is now mechanical, not just glued." },
    ],
  },
  {
    id: "crest-rail",
    title: "Shaping a curved crest rail",
    summary: "Three ways to get the curve — sawn, steam-bent, laminated — and what each costs you.",
    chairs: ["japanese", "kangaroo"],
    parts: ["crestRail", "sideFrame", "backrest"],
    steps: [
      { title: "Sawn from wide stock", body: "Fastest, but the curve cuts across the grain and the ends become short-grained and weak. Fine for gentle curves in strong wood." },
      { title: "Steam-bent", body: "Steam softens the lignin so the whole piece bends with the grain intact. Needs a form, a strap, and over-bending to allow for springback." },
      { title: "Laminated", body: "Thin strips bent over a form and glued. No short grain, very stable, but the glue lines show unless the piece is painted or lacquered." },
      { title: "Fair the curve", body: "However it was made, the curve is finished with spokeshave and scraper. The eye detects a flat spot instantly — fair by eye, not by measurement." },
    ],
  },
  {
    id: "urushi-finish",
    title: "Building a black lacquer finish",
    summary: "The deep black of the Japanese chair is not paint: it is many thin, hardened layers over a sealed surface.",
    chairs: ["japanese"],
    parts: ["legs", "crestRail", "arms", "spindles"],
    steps: [
      { title: "Surface first", body: "Lacquer magnifies defects. Scrape and sand to a uniform surface; any tear-out will show through every coat." },
      { title: "Seal the grain", body: "A sealing coat soaks in and hardens the surface. Open grain may be filled or left to show as texture — decide before the first coat." },
      { title: "Many thin coats", body: "Each coat is thin, cured in humidity, then rubbed back. Traditional urushi cures by moisture, not by drying — rushing it ruins it." },
      { title: "Final rubbing", body: "The last coats are rubbed to the desired sheen. The depth comes from the layers, not from a single thick coat." },
    ],
  },
  {
    id: "reading-grain",
    title: "Reading grain direction",
    summary: "Strength in wood runs along the fibres. Every layout decision starts with reading which way they go.",
    chairs: ["kangaroo", "japanese"],
    parts: ["sideFrame", "legs", "spindles"],
    steps: [
      { title: "Find the fibre direction", body: "Look at the side of the board, not the face. The long lines are the fibres; planing or bending with them is easy, against them tears." },
      { title: "Strength follows the fibre", body: "Wood is many times stronger along the grain than across it. A part that must carry bending — a leg, a spindle, a rail — needs unbroken grain end to end." },
      { title: "Short grain is the failure line", body: "Where a curve or a taper cuts across fibres, the short-grained section can shear off. Recognise it before you cut, not after it breaks." },
      { title: "Movement is across the grain", body: "Boards shrink and swell across their width, almost not at all along their length. Joints and wide slabs must be designed around this." },
    ],
  },
];

export const techniquesFor = (part: AnyPartId | null, chair?: "kangaroo" | "japanese") =>
  TECHNIQUES.filter((t) => (!part || t.parts.includes(part)) && (!chair || t.chairs.includes(chair)));
