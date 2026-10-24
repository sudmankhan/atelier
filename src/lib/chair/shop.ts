// Pure shop output: cut list (rough vs finished stock) and saw/drill angle schedule.
// Derived from the same geometry as the 3D model. Units cm / degrees.
import type { ChairParams } from "./params";
import { computeGeometry, BACK_LENGTH, FRONT_RAKE, SEAT_TILT_DEG } from "./geometry";
import type { JapaneseParams } from "./japanese/params";
import { computeJapanese, CREST_BOW, POST_LEAN, SLAB_T } from "./japanese/geometry";

// Allowances added to finished size to get rough (sawn) stock.
export const ALLOW = { length: 2.5, width: 0.6, thickness: 0.6 } as const;
export const TENON = 3; // tenon length added to members that enter a mortise, each end

export interface Dim { l: number; w: number; t: number }
export interface CutRow { part: string; qty: number; finished: Dim; rough: Dim; note: string }
export interface AngleRow { op: string; angle: number; setting: string; why: string }
export interface ShopSheet { cuts: CutRow[]; angles: AngleRow[]; boardFeet: number }

const r1 = (n: number) => Math.round(n * 10) / 10;
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

export function roughOf(f: Dim): Dim {
  return { l: r1(f.l + ALLOW.length), w: r1(f.w + ALLOW.width), t: r1(f.t + ALLOW.thickness) };
}
const row = (part: string, qty: number, f: Dim, note: string): CutRow => {
  const finished = { l: r1(f.l), w: r1(f.w), t: r1(f.t) };
  return { part, qty, finished, rough: roughOf(finished), note };
};
/** Volume of rough stock in board feet (1 bf = 2359.7 cm³) — how timber is sold. */
function bf(cuts: CutRow[]) {
  const cm3 = cuts.reduce((s, c) => s + c.qty * c.rough.l * c.rough.w * c.rough.t, 0);
  return r1(cm3 / 2359.7);
}

/** Compound angle for a leg splayed `a` sideways and `b` front/back: resultant tilt and sightline. */
export function compound(aDeg: number, bDeg: number) {
  const ta = Math.tan(rad(aDeg));
  const tb = Math.tan(rad(bDeg));
  return { resultant: r1(deg(Math.atan(Math.hypot(ta, tb)))), sightline: r1(tb === 0 && ta === 0 ? 0 : deg(Math.atan2(tb, ta))) };
}

export function kangarooShop(p: ChairParams): ShopSheet {
  const g = computeGeometry(p);
  const frontLegLean = deg(Math.atan2(FRONT_RAKE, g.seatFront.y));
  const cuts = [
    row("Front leg", 2, { l: g.frontLegLength + TENON, w: 5, t: 3.8 }, "Grain straight along the length; tenon into the seat rail."),
    row("Seat rail (side)", 2, { l: p.seatDepth, w: 5, t: 3.8 }, "Mortised for front leg and back post."),
    row("Back post", 2, { l: BACK_LENGTH + TENON, w: 5 + p.backCurve * 3, t: 3.8 }, p.backCurve > 0 ? "Rough width includes the bow — pick stock whose grain follows the curve." : "Straight post."),
    row("Rear support", 2, { l: g.rearLegLength + TENON, w: 5, t: 3.8 }, "Tenons into the back post."),
    row("Stretcher rail", 3, { l: g.railLength + 2 * TENON, w: 2.8, t: 2.8 }, "Length includes a tenon at each end; turn or round after cutting joints."),
    row("Seat frame side", 2, { l: p.seatDepth - 2, w: 3, t: 3.2 }, "Groove for cane after assembly."),
    row("Seat frame end", 2, { l: p.seatWidth - 0.4, w: 3.2, t: 3 }, ""),
    row("Back frame side", 2, { l: g.backrestLength, w: 3, t: 3.2 }, ""),
    row("Back frame end", 2, { l: p.seatWidth - 0.4, w: 3.2, t: 3 }, ""),
  ];
  const angles: AngleRow[] = [
    { op: "Front leg ↔ seat rail shoulder", angle: r1(g.frontJointAngle), setting: `Mitre ${r1(Math.abs(90 - g.frontJointAngle))}° off square`, why: "Tenon shoulders must sit tight on the rail at this angle or the joint racks." },
    { op: "Back post ↔ rear support shoulder", angle: r1(g.rearJointAngle), setting: `Bevel gauge to ${r1(g.rearJointAngle)}°; mitre ${r1(Math.abs(90 - (g.rearJointAngle % 90)))}° off square`, why: "The most loaded joint — set a bevel gauge from the full-size drawing, not by eye." },
    { op: "Rear support foot", angle: r1(g.rearLegAngle), setting: `Mitre ${r1(g.rearLegAngle)}°`, why: "Cut parallel to the floor so the foot bears on its whole face." },
    { op: "Front leg foot", angle: r1(frontLegLean), setting: `Mitre ${r1(frontLegLean)}°`, why: "Same: level foot, no rocking edge." },
    { op: "Seat rail tilt", angle: SEAT_TILT_DEG, setting: `Mark ${SEAT_TILT_DEG}° slope from front to back`, why: "Tilts the sitter back into the backrest." },
    { op: "Back recline", angle: r1(g.backRecline), setting: `Back post leans ${r1(g.backRecline)}° from vertical`, why: "Check with a bevel gauge at dry-fit." },
  ];
  return { cuts, angles, boardFeet: bf(cuts) };
}

export function japaneseShop(p: JapaneseParams): ShopSheet {
  const g = computeJapanese(p);
  const c = compound(p.legSplay, p.legSplay);
  const cuts = [
    row("Leg", 4, { l: g.legLength + SLAB_T, w: 4, t: 4 }, "Through-tenon into the seat, wedged across the seat grain."),
    row("Seat slab", 1, { l: p.seatWidth, w: p.seatDepth, t: SLAB_T + 0.5 }, "Glue up from 2–3 boards if needed; grain runs side to side. Extra thickness for saddling."),
    row("Back post", 2, { l: p.backHeight + SLAB_T, w: 3.5, t: 3.5 }, "Enters the seat through a socket."),
    row("Spindle", p.spindles, { l: g.spindleLength + 4, w: 2, t: 2 }, "Riven stock if possible — grain must run dead straight."),
    row("Crest rail", 1, { l: p.seatWidth + 4, w: 5 + CREST_BOW, t: 3 }, `Sawn from flat stock the rough width must include the ${CREST_BOW} cm bow; or steam-bend a 5 cm blank.`),
    row("Arm", 2, { l: p.seatDepth, w: 5, t: 2.5 }, "Bow follows the grain."),
  ];
  const angles: AngleRow[] = [
    { op: "Leg sockets in seat (drill)", angle: c.resultant, setting: `Tilt the bit ${c.resultant}° along a sightline ${c.sightline}° to the seat's side edge`, why: `Legs splay ${p.legSplay}° in both directions — a single drill tilt along the sightline gives both at once.` },
    { op: "Leg foot cut", angle: c.resultant, setting: `Stand the chair on a flat surface, scribe the feet level, cut ≈${c.resultant}° off square`, why: "Scribing beats calculating: floors and drilling are never perfect." },
    { op: "Back post sockets", angle: POST_LEAN, setting: `Drill ${POST_LEAN}° back from vertical`, why: "Sets the back lean." },
    { op: "Arm slope", angle: r1(g.armSlope), setting: `Arm rises ${r1(g.armSlope)}° front to back`, why: "Front arm post shoulder is cut to this angle." },
    { op: "Spindle spacing", angle: 0, setting: `${r1(g.spindleSpacing)} cm centres along the crest`, why: "Mark from the centre outward so spacing stays symmetric." },
  ];
  return { cuts, angles, boardFeet: bf(cuts) };
}
