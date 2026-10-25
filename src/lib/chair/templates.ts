// Real-size (1:1) templates: full-size layout drawings and part outlines, built from the same
// geometry as the 3D model, split into printable pages with alignment marks and a 10 cm check ruler.
// Pure functions that return SVG strings in centimetres, so they can be tested and printed anywhere.
import { BACK_LENGTH, computeGeometry, type V2 } from "./geometry";
import type { ChairParams } from "./params";
import { CREST_BOW, SLAB_T, computeJapanese } from "./japanese/geometry";
import type { JapaneseParams } from "./japanese/params";
import { japaneseShop, kangarooShop, type AngleRow } from "./shop";

export interface Template {
  id: string;
  title: string;
  /** what to do with it, one line */
  use: string;
  widthCm: number;
  heightCm: number;
  /** SVG content in drawing coordinates: cm, origin top-left, y down */
  body: string;
  /** points (drawing coords) where something is drawn; pages with none nearby are not printed */
  ink?: { x: number; y: number }[];
}

export type Paper = "letter" | "a4";
export const PAPER: Record<Paper, { label: string; w: number; h: number }> = {
  letter: { label: "US Letter", w: 21.59, h: 27.94 },
  a4: { label: "A4", w: 21, h: 29.7 },
};
/** Blank border every printer needs, cm. */
export const PAGE_MARGIN = 1;
/** How much neighbouring pages repeat, cm, so they can be lined up and taped. */
export const PAGE_OVERLAP = 1;

const MARGIN = 3; // drawing margin around the parts, cm
const INK = "#2b211b";
const r2 = (n: number) => Math.round(n * 100) / 100;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Maps side-view world coords (z forward, y up) into drawing coords (x right, y down). */
const TITLE_H = 4; // cm reserved above each layout drawing for its title
function frame(points: V2[], pad = MARGIN) {
  const minZ = Math.min(...points.map((p) => p.z)), maxZ = Math.max(...points.map((p) => p.z));
  const maxY = Math.max(...points.map((p) => p.y));
  const X = (v: V2) => r2(v.z - minZ + pad);
  const Y = (v: V2) => r2(maxY - v.y + pad + TITLE_H);
  return { X, Y, P: (v: V2) => `${X(v)} ${Y(v)}`, width: r2(maxZ - minZ + 2 * pad), height: r2(maxY + 2 * pad + TITLE_H) };
}

/** Points every ~2 cm along straight segments and quadratic curves, for page skipping. */
function sampleLine(a: { x: number; y: number }, b: { x: number; y: number }, c?: { x: number; y: number }) {
  const out: { x: number; y: number }[] = [];
  const end = c ?? b;
  const n = Math.max(2, Math.ceil(Math.hypot(end.x - a.x, end.y - a.y) / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(c ? { x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t * t * c.y } : { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/** Outlined bands: thick ink strokes, then slightly thinner paper strokes, so overlapping members print as one outline. */
function bands(paths: { d: string; w: number }[], clip?: string) {
  const c = clip ? ` clip-path="url(#${clip})"` : "";
  return `<g${c} fill="none" stroke-linecap="butt" stroke-linejoin="round">${paths.map((p) => `<path d="${p.d}" stroke="${INK}" stroke-width="${p.w}"/>`).join("")}${paths.map((p) => `<path d="${p.d}" stroke="#ffffff" stroke-width="${r2(p.w - 0.06)}"/>`).join("")}</g>`;
}
const centreline = (d: string) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="0.03" stroke-dasharray="0.6 0.3"/>`;
const label = (x: number, y: number, t: string, size = 0.9, anchor = "start") =>
  `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" font-family="Helvetica, Arial, sans-serif" fill="${INK}" text-anchor="${anchor}">${esc(t)}</text>`;
const hole = (x: number, y: number, d: number, t?: string, left = false) =>
  `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(d / 2)}" fill="none" stroke="${INK}" stroke-width="0.04"/><path d="M${r2(x - 0.6)} ${r2(y)}H${r2(x + 0.6)}M${r2(x)} ${r2(y - 0.6)}V${r2(y + 0.6)}" stroke="${INK}" stroke-width="0.03"/>${t ? label(left ? x - d / 2 - 0.4 : x + d / 2 + 0.4, y + 0.3, t, 0.7, left ? "end" : "start") : ""}`;
const title = (t: string, sub: string) => `${label(1, 1.6, t, 1.2)}${label(1, 2.7, sub, 0.7)}`;

export function kangarooTemplates(p: ChairParams): Template[] {
  const g = computeGeometry(p);
  const f = frame([g.frontFoot, g.seatFront, g.seatRear, g.backTop, g.backMid, g.rearJoint, g.rearFoot, { z: g.frontFoot.z, y: 0 }]);
  const W = 5; // finished width of the side-frame members (cut list)
  const floorY = f.Y({ z: 0, y: 0 });
  const members = [
    { d: `M${f.P(g.frontFoot)}L${f.P(g.seatFront)}`, w: W },
    { d: `M${f.P(g.seatFront)}L${f.P(g.seatRear)}`, w: W },
    { d: `M${f.P(g.seatRear)}Q${f.P(g.backMid)} ${f.P(g.backTop)}`, w: W },
    { d: `M${f.P(g.rearJoint)}L${f.P(g.rearFoot)}`, w: W },
  ];
  // Members are drawn a little past the floor and clipped, so the feet come out cut level.
  const ext = (a: V2, b: V2) => ({ z: b.z + (b.z - a.z) * (4 / Math.max(1, a.y - b.y)), y: -4 });
  members[0]!.d = `M${f.P(ext(g.seatFront, g.frontFoot))}L${f.P(g.seatFront)}`;
  members[3]!.d = `M${f.P(g.rearJoint)}L${f.P(ext(g.rearJoint, g.rearFoot))}`;
  const clip = `<defs><clipPath id="kfloor"><rect x="0" y="0" width="${f.width}" height="${floorY}"/></clipPath></defs>`;
  const joint = (v: V2, t: string, left = false) => `<circle cx="${f.X(v)}" cy="${f.Y(v)}" r="0.35" fill="${INK}"/>${label(f.X(v) + (left ? -3 : 3), f.Y(v) - 3.2, t, 0.8, left ? "end" : "start")}`;
  const body =
    clip +
    title("Kangaroo side frame — full size", `Seat ${p.seatHeight} cm high, back angle ${p.backAngle}°, back post ${BACK_LENGTH} cm leaning ${g.backRecline.toFixed(1)}°. Trace once on plywood; both side frames come from it.`) +
    bands(members, "kfloor") +
    `<g clip-path="url(#kfloor)">${members.map((m) => centreline(m.d)).join("")}</g>` +
    [g.frontFoot, g.rearFoot].map((ft) => `<path d="M${r2(f.X(ft) - 8)} ${floorY}H${r2(f.X(ft) + 8)}" stroke="${INK}" stroke-width="0.05"/>`).join("") +
    label(f.X(g.rearFoot) - 7, floorY + 1.2, "Floor line: cut the feet level with it", 0.7) +
    joint(g.seatFront, `Front leg ↔ seat rail ${g.frontJointAngle.toFixed(1)}°`, true) +
    joint(g.rearJoint, `Back post ↔ rear support ${g.rearJointAngle.toFixed(1)}°`) +
    hole(f.X(g.frontRail), f.Y(g.frontRail), 1.6, "Stretcher hole ⌀1.6", true) +
    hole(f.X(g.rearRail), f.Y(g.rearRail), 1.6, "Stretcher hole ⌀1.6");
  const pt = (v: V2) => ({ x: f.X(v), y: f.Y(v) });
  const ink = [
    { x: 1, y: 1.6 }, { x: 20, y: 2.7 },
    ...sampleLine(pt(g.frontFoot), pt(g.seatFront)), ...sampleLine(pt(g.seatFront), pt(g.seatRear)),
    ...sampleLine(pt(g.seatRear), pt(g.backMid), pt(g.backTop)), ...sampleLine(pt(g.rearJoint), pt(g.rearFoot)),
    { x: f.X(g.rearJoint) + 12, y: f.Y(g.rearJoint) - 2.6 }, { x: f.X(g.seatFront) - 12, y: f.Y(g.seatFront) - 3.2 },
  ];
  return [
    {
      id: "k-side",
      title: "Side frame (full-size layout)",
      use: "Trace onto thin plywood to make one master template, then trace that onto both side-frame boards. Joint centres and stretcher holes are marked.",
      widthCm: f.width,
      heightCm: r2(floorY + 4),
      body,
      ink,
    },
  ];
}

export function japaneseTemplates(p: JapaneseParams): Template[] {
  const g = computeJapanese(p);
  const halfW = p.seatWidth / 2, halfD = p.seatDepth / 2;
  // 1. Side elevation
  const f = frame([g.frontFoot, g.rearFoot, g.postTop, g.crestMid, { z: halfD, y: p.seatHeight }, { z: -halfD, y: p.seatHeight }, g.armFront, g.armBack]);
  const floorY = f.Y({ z: 0, y: 0 });
  const ext = (top: V2, foot: V2) => ({ z: foot.z + (foot.z - top.z) * (4 / top.y), y: -4 });
  const armMid = { z: (g.armFront.z + g.armBack.z) / 2, y: (g.armFront.y + g.armBack.y) / 2 + 1.5 };
  const legs = [
    { d: `M${f.P(g.frontLegTop)}L${f.P(ext(g.frontLegTop, g.frontFoot))}`, w: 4 },
    { d: `M${f.P(g.rearLegTop)}L${f.P(ext(g.rearLegTop, g.rearFoot))}`, w: 4 },
    { d: `M${f.P(g.postBase)}L${f.P(g.postTop)}`, w: 3.5 },
    { d: `M${f.P(g.armFront)}Q${f.P(armMid)} ${f.P(g.armBack)}`, w: 2.5 },
  ];
  const slabX = f.X({ z: -halfD, y: 0 }), slabY = f.Y({ z: 0, y: p.seatHeight });
  const side =
    `<defs><clipPath id="jfloor"><rect x="0" y="0" width="${f.width}" height="${floorY}"/></clipPath></defs>` +
    title("Kuro side view — full size", `Seat ${p.seatHeight} cm high, legs splayed ${p.legSplay}° each way. Use it to check angles at dry-fit.`) +
    bands(legs, "jfloor") +
    `<rect x="${slabX}" y="${slabY}" width="${r2(p.seatDepth)}" height="${SLAB_T}" fill="#fff" stroke="${INK}" stroke-width="0.06"/>` +
    `<g clip-path="url(#jfloor)">${legs.map((m) => centreline(m.d)).join("")}</g>` +
    `<circle cx="${f.X(g.crestMid)}" cy="${f.Y(g.crestMid)}" r="1.5" fill="none" stroke="${INK}" stroke-width="0.06"/>` +
    label(f.X(g.crestMid) + 2, f.Y(g.crestMid) + 0.3, "Crest rail (seen end-on)", 0.75) +
    [g.frontFoot, g.rearFoot].map((ft) => `<path d="M${r2(f.X(ft) - 8)} ${floorY}H${r2(f.X(ft) + 8)}" stroke="${INK}" stroke-width="0.05"/>`).join("") +
    label(f.X(g.rearFoot) - 7, floorY + 1.2, "Floor line: scribe the feet level with it", 0.7) +
    label(slabX + 1, slabY - 0.8, `Seat slab ${p.seatDepth} × ${SLAB_T} cm`, 0.75);

  // 2. Crest rail, top view: a parabola bowing CREST_BOW back at the middle.
  const span = p.seatWidth + 4, cw = 3, n = 24, cx0 = MARGIN, cy0 = MARGIN + 2;
  const zAt = (x: number) => CREST_BOW * (1 - (x / (span / 2)) ** 2);
  const pts = Array.from({ length: n + 1 }, (_, i) => -span / 2 + (span * i) / n).map((x) => ({ x: r2(cx0 + x + span / 2), y: r2(cy0 + zAt(x)) }));
  const crestPath = `M${pts.map((q) => `${q.x} ${q.y}`).join("L")}`;
  const postX = halfW - 6;
  const holes = [-postX, ...Array.from({ length: p.spindles }, (_, i) => -postX + g.spindleSpacing * (i + 1)), postX];
  const crest =
    title("Crest rail — top view, full size", `Bows ${CREST_BOW} cm back at the middle. Steam-bend or laminate; sawing it leaves short grain.`) +
    bands([{ d: crestPath, w: cw }]) +
    centreline(crestPath) +
    holes.map((x, i) => hole(cx0 + x + span / 2, cy0 + zAt(x), i === 0 || i === holes.length - 1 ? 2.3 : 1.3, i === 0 ? "Post" : i === 1 ? "Spindle" : undefined)).join("") +
    label(cx0, cy0 + CREST_BOW + 4.5, `${span} cm long rough. Holes on ${g.spindleSpacing.toFixed(1)} cm centres, marked from the middle out.`, 0.75);

  // 3. Seat slab, top view: drilling layout.
  const sx = MARGIN, sy = MARGIN + 2;
  const X = (x: number) => r2(sx + x + halfW), Y = (z: number) => r2(sy + halfD - z);
  const sight = (x: number, z: number) => {
    const dx = Math.sign(x) * 4, dz = Math.sign(z) * 4;
    return `<path d="M${X(x)} ${Y(z)}L${r2(X(x) + dx)} ${r2(Y(z) - dz)}" stroke="${INK}" stroke-width="0.05" marker-end="url(#arr)"/>`;
  };
  const legPts = [[-g.legTopX, g.frontLegTop.z], [g.legTopX, g.frontLegTop.z], [-g.legTopX, g.rearLegTop.z], [g.legTopX, g.rearLegTop.z]] as const;
  const seat =
    `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs>` +
    title("Seat slab — top view, drilling layout", "Front of the chair at the bottom. Arrows show which way each leg leans: drill along them.") +
    `<rect x="${X(-halfW)}" y="${Y(halfD)}" width="${p.seatWidth}" height="${p.seatDepth}" fill="#fff" stroke="${INK}" stroke-width="0.08"/>` +
    legPts.map(([x, z]) => hole(X(x), Y(z), 2.5) + sight(x, z)).join("") +
    holes.map((x, i) => hole(X(x), Y(g.postBase.z), i === 0 || i === holes.length - 1 ? 2.3 : 1.3)).join("") +
    label(X(0), Y(-halfD) + 2.2, `${p.seatWidth} × ${p.seatDepth} cm. Leg sockets ⌀2.5, post sockets ⌀2.3, spindles ⌀1.3. Grain runs side to side.`, 0.75, "middle");

  return [
    {
      id: "j-side", title: "Side view (full-size layout)", use: "Lay it on the bench at dry-fit and sight the legs, posts and arm against it.", widthCm: f.width, heightCm: r2(floorY + 4), body: side,
      ink: (() => { const pt = (v: V2) => ({ x: f.X(v), y: f.Y(v) }); return [{ x: 1, y: 1.6 }, { x: 20, y: 2.7 }, ...sampleLine(pt(g.frontLegTop), pt(g.frontFoot)), ...sampleLine(pt(g.rearLegTop), pt(g.rearFoot)), ...sampleLine(pt(g.postBase), pt(g.postTop)), ...sampleLine(pt(g.armFront), pt(armMid), pt(g.armBack)), ...sampleLine({ x: slabX, y: slabY }, { x: slabX + p.seatDepth, y: slabY }), pt(g.crestMid)]; })(),
    },
    { id: "j-crest", title: "Crest rail (top view)", use: "Make a bending form or lamination former to this curve; mark the post and spindle holes from it.", widthCm: r2(span + 2 * MARGIN), heightCm: r2(CREST_BOW + 2 * MARGIN + 6), body: crest },
    { id: "j-seat", title: "Seat slab (drilling layout)", use: "Tape it to the glued-up slab and drill every socket through the paper. Arrows give each leg's lean.", widthCm: r2(p.seatWidth + 2 * MARGIN), heightCm: r2(p.seatDepth + 2 * MARGIN + 4), body: seat },
  ];
}

/** Which way each angle is measured, so the printed gauge can be held against the work. */
function gaugeKind(a: AngleRow): "included" | "vertical" | "horizontal" | null {
  const o = a.op.toLowerCase();
  if (a.angle <= 0) return null;
  if (o.includes("shoulder")) return "included";
  if (o.includes("tilt") || o.includes("slope")) return "horizontal";
  return "vertical";
}

/** Printable angle gauges: cut out and hold against the drill, saw or bevel gauge. */
export function angleCards(angles: AngleRow[]): Template | null {
  const list = angles.filter((a) => gaugeKind(a));
  if (!list.length) return null;
  const M = 1, CW = 8, CH = 6.5, cols = 2, L = 3.6, arcR = 1.6, top = 2.4, gap = 0.6;
  const cards = list.map((a, i) => {
    const kind = gaugeKind(a)!;
    const ox = M + (i % cols) * (CW + 1), oy = M + top + Math.floor(i / cols) * (CH + gap);
    const px = ox + CW / 2 - 1, py = oy + CH - 0.5; // pivot
    const th = (a.angle * Math.PI) / 180;
    // second line: measured from vertical (up) or from level (right); first line is the reference
    const dir = (t: number) => (kind === "vertical" ? { x: Math.sin(t), y: -Math.cos(t) } : { x: Math.cos(t), y: -Math.sin(t) });
    const ref = dir(0), arm = dir(th);
    const pt = (d: { x: number; y: number }, r: number) => `${r2(px + d.x * r)} ${r2(py + d.y * r)}`;
    const sweep = kind === "vertical" ? 1 : 0;
    return (
      `<rect x="${ox}" y="${oy}" width="${CW}" height="${CH}" fill="none" stroke="${INK}" stroke-width="0.03" stroke-dasharray="0.3 0.2"/>` +
      `<path d="M${pt(ref, L)}L${r2(px)} ${r2(py)}L${pt(arm, L)}" fill="none" stroke="${INK}" stroke-width="0.06"/>` +
      `<path d="M${pt(ref, arcR)}A${arcR} ${arcR} 0 0 ${sweep} ${pt(arm, arcR)}" fill="none" stroke="${INK}" stroke-width="0.04"/>` +
      label(ox + 0.4, oy + 1.0, `${a.angle}°`, 0.9) +
      label(ox + 0.4, oy + 1.6, a.op.length > 36 ? `${a.op.slice(0, 35)}…` : a.op, 0.38) +
      label(ox + 0.4, oy + 2.1, kind === "vertical" ? "Reference line = vertical" : kind === "horizontal" ? "Reference line = level" : "Angle between the two parts", 0.34)
    );
  });
  const rows = Math.ceil(list.length / cols);
  return {
    id: "angles",
    title: "Angle cards",
    use: "Cut out each card along the dashed line. Hold the reference edge against the work and line the drill, saw or bevel gauge up with the angled line.",
    widthCm: r2(M * 2 + cols * CW + (cols - 1)),
    heightCm: r2(M * 2 + top + rows * CH + (rows - 1) * gap),
    body: `${label(M, 1.4, "Angle cards — full size", 0.8)}${label(M, 2.2, "Cut out along the dashed lines.", 0.4)}${cards.join("")}`,
  };
}

export function templatesFor(typology: "kangaroo" | "japanese", params: ChairParams | JapaneseParams): Template[] {
  const base = typology === "kangaroo" ? kangarooTemplates(params as ChairParams) : japaneseTemplates(params as JapaneseParams);
  const angles = typology === "kangaroo" ? kangarooShop(params as ChairParams).angles : japaneseShop(params as JapaneseParams).angles;
  const card = angleCards(angles);
  return card ? [...base, card] : base;
}

// ---------------------------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------------------------
export interface Tile { row: number; col: number; x: number; y: number; w: number; h: number }

/** Pages worth printing: those with something drawn on (or near) them. */
export function inkedTiles(t: Template, tiles: Tile[]): Tile[] {
  if (!t.ink?.length) return tiles;
  const pad = 3; // members are up to 5 cm wide; their centreline may sit just off the page
  return tiles.filter((tile) => t.ink!.some((q) => q.x >= tile.x - pad && q.x <= tile.x + tile.w + pad && q.y >= tile.y - pad && q.y <= tile.y + tile.h + pad));
}

/** Splits a drawing into overlapping page tiles (drawing coordinates, cm). */
export function tilePages(widthCm: number, heightCm: number, paper: Paper): { tiles: Tile[]; rows: number; cols: number } {
  const pw = PAPER[paper].w - 2 * PAGE_MARGIN, ph = PAPER[paper].h - 2 * PAGE_MARGIN;
  const sx = pw - PAGE_OVERLAP, sy = ph - PAGE_OVERLAP;
  const cols = Math.max(1, Math.ceil((widthCm - PAGE_OVERLAP) / sx));
  const rows = Math.max(1, Math.ceil((heightCm - PAGE_OVERLAP) / sy));
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tiles.push({ row: r, col: c, x: r2(c * sx), y: r2(r * sy), w: pw, h: ph });
  return { tiles, rows, cols };
}

/** One printable page as a standalone SVG at real size. */
export function pageSvg(t: Template, tile: Tile, grid: { rows: number; cols: number }, paper: Paper, chairName: string): string {
  const P = PAPER[paper];
  const m = PAGE_MARGIN, o = PAGE_OVERLAP;
  const clipId = `c${tile.row}_${tile.col}`;
  // Alignment crosses sit in the middle of each overlap strip, so the same cross prints on both pages.
  const crosses: string[] = [];
  const cross = (x: number, y: number) => `<path d="M${r2(x - 0.4)} ${r2(y)}H${r2(x + 0.4)}M${r2(x)} ${r2(y - 0.4)}V${r2(y + 0.4)}" stroke="#000" stroke-width="0.03"/><circle cx="${r2(x)}" cy="${r2(y)}" r="0.2" fill="none" stroke="#000" stroke-width="0.02"/>`;
  const left = tile.x, right = tile.x + tile.w, top = tile.y, bottom = tile.y + tile.h;
  for (const xe of [left + o / 2, right - o / 2]) for (const yf of [0.25, 0.5, 0.75]) crosses.push(cross(xe, top + tile.h * yf));
  for (const ye of [top + o / 2, bottom - o / 2]) for (const xf of [0.25, 0.5, 0.75]) crosses.push(cross(left + tile.w * xf, ye));
  const ruler = (() => {
    const x0 = m + 0.5, y0 = P.h - m - 0.9;
    const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${r2(x0 + i)} ${y0}v${i % 5 === 0 ? -0.5 : -0.3}" stroke="#000" stroke-width="0.02"/>`).join("");
    return `<path d="M${x0} ${y0}h10" stroke="#000" stroke-width="0.03"/>${ticks}${label(x0, y0 + 0.5, "Check: this line must measure exactly 10 cm", 0.35)}`;
  })();
  const id = `${tile.row + 1}-${tile.col + 1}`;
  const next = [tile.col + 1 < grid.cols ? `right edge → page ${tile.row + 1}-${tile.col + 2}` : "", tile.row + 1 < grid.rows ? `bottom edge → page ${tile.row + 2}-${tile.col + 1}` : ""].filter(Boolean).join(", ");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${P.w}cm" height="${P.h}cm" viewBox="0 0 ${P.w} ${P.h}">` +
    `<defs><clipPath id="${clipId}"><rect x="${m}" y="${m}" width="${tile.w}" height="${tile.h}"/></clipPath></defs>` +
    `<rect width="${P.w}" height="${P.h}" fill="#fff"/>` +
    `<g clip-path="url(#${clipId})"><g transform="translate(${r2(m - tile.x)} ${r2(m - tile.y)})">${t.body}${crosses.join("")}</g></g>` +
    `<rect x="${m}" y="${m}" width="${tile.w}" height="${tile.h}" fill="none" stroke="#999" stroke-width="0.02" stroke-dasharray="0.2 0.2"/>` +
    ruler +
    label(P.w - m - 0.2, m - 0.35, `${chairName} · ${t.title} · page ${id} of ${grid.rows}×${grid.cols}${next ? ` · tape ${next}` : ""}`, 0.32, "end") +
    `</svg>`
  );
}

/** The whole template as one real-size SVG (for laser cutters, CNC or a plotter). */
export function fullSvg(t: Template): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${t.widthCm}cm" height="${t.heightCm}cm" viewBox="0 0 ${t.widthCm} ${t.heightCm}"><rect width="${t.widthCm}" height="${t.heightCm}" fill="#fff"/>${t.body}</svg>`;
}

/** Print-ready HTML: one page per tile, at 100% scale. */
export function printHtml(ts: Template[], paper: Paper, chairName: string): { html: string; pages: number } {
  let pages = 0;
  const body = ts
    .map((t) => {
      const g = tilePages(t.widthCm, t.heightCm, paper);
      const keep = inkedTiles(t, g.tiles);
      pages += keep.length;
      return keep.map((tile) => `<div class="pg">${pageSvg(t, tile, g, paper, chairName)}</div>`).join("");
    })
    .join("");
  const P = PAPER[paper];
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(chairName)} — templates</title><style>@page{size:${P.w}cm ${P.h}cm;margin:0}html,body{margin:0;padding:0}.pg{width:${P.w}cm;height:${P.h}cm;page-break-after:always;break-after:page;overflow:hidden}.pg svg{display:block}</style></head><body>${body}</body></html>`;
  return { html, pages };
}
