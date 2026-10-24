// Chair self-weight and its centre (side view), from finished part volumes × USDA density at 12% MC.
// Part sizes come from the shop cut list; positions from the same geometry as the 3D model.
import { computeGeometry, lerp2, type V2 } from "./geometry";
import type { ChairParams } from "./params";
import { computeJapanese } from "./japanese/geometry";
import type { JapaneseParams } from "./japanese/params";
import { japaneseShop, kangarooShop, type CutRow } from "./shop";
import { density12, woodForChoice, type WoodId } from "./woodProperties";
import type { LabDesign } from "../lab";

const G = 9.81;

export interface ChairMass {
  kg: number;
  /** weight, N */
  N: number;
  /** horizontal position of the chair's centre of mass, cm (+z forward) */
  comZ: number;
  wood: WoodId;
  proxy: boolean;
}

interface Piece { cm3: number; z: number }

function total(pieces: Piece[], wood: WoodId, proxy: boolean): ChairMass {
  const rho = density12(wood) / 1e6; // kg/cm³
  const kg = pieces.reduce((s, p) => s + p.cm3 * rho, 0);
  const comZ = kg > 0 ? pieces.reduce((s, p) => s + p.cm3 * rho * p.z, 0) / kg : 0;
  return { kg, N: kg * G, comZ, wood, proxy };
}

const vol = (c: CutRow) => c.qty * c.finished.l * c.finished.w * c.finished.t;
const mid = (a: V2, b: V2) => lerp2(a, b, 0.5).z;

export function kangarooMass(p: ChairParams): ChairMass {
  const g = computeGeometry(p);
  const at: Record<string, number> = {
    "Front leg": mid(g.frontFoot, g.seatFront),
    "Seat rail (side)": mid(g.seatFront, g.seatRear),
    "Back post": g.backMid.z,
    "Rear support": mid(g.rearJoint, g.rearFoot),
    "Stretcher rail": (g.frontRail.z + g.rearRail.z) / 2,
    "Seat frame side": g.seatCenter.z,
    "Seat frame end": g.seatCenter.z,
    "Back frame side": g.backrestCenter.z,
    "Back frame end": g.backrestCenter.z,
  };
  const w = woodForChoice(p.wood);
  return total(kangarooShop(p).cuts.map((c) => ({ cm3: vol(c), z: at[c.part] ?? g.seatCenter.z })), w.id ?? "oak", w.proxy);
}

export function japaneseMass(p: JapaneseParams): ChairMass {
  const g = computeJapanese(p);
  const legsZ = (mid(g.frontFoot, g.frontLegTop) + mid(g.rearFoot, g.rearLegTop)) / 2;
  const at: Record<string, number> = {
    Leg: legsZ,
    "Seat slab": 0,
    "Back post": mid(g.postBase, g.postTop),
    Spindle: mid(g.postBase, g.postTop),
    "Crest rail": g.crestMid.z,
    Arm: mid(g.armFront, g.armBack),
  };
  const w = woodForChoice(p.finish);
  return total(japaneseShop(p).cuts.map((c) => ({ cm3: vol(c), z: at[c.part] ?? 0 })), w.id ?? "oak", w.proxy);
}

/** Component Lab parts, sized exactly as LabModel draws them. */
export function labMass(d: LabDesign): ChairMass {
  const T = d.legThickness, H = d.seatHeight, D = d.seatDepth, W = d.seatWidth;
  const pieces: Piece[] = [{ cm3: W * D * 3, z: 0 }];
  if (d.base === "four" || d.base === "splayed") {
    const len = H / Math.cos((d.splay * Math.PI) / 180);
    pieces.push({ cm3: 4 * T * T * len, z: 0 });
    if (d.stretchers) pieces.push({ cm3: 2 * D * 3.8 + W * 3.8, z: -D / 4 });
  } else if (d.base === "sled") {
    pieces.push({ cm3: 2 * T * T * (2 * H + D + 8), z: -2 });
  } else {
    pieces.push({ cm3: 2 * 3.8 * 3.8 * H, z: D / 2 }, { cm3: 2 * 3.8 * 3.8 * Math.hypot(H + 14, 18), z: -D / 2 - 7 });
  }
  if (d.back !== "none") {
    const rec = ((d.backAngle - 90) * Math.PI) / 180;
    const zBack = -D / 2 + 1.5 - Math.sin(rec) * d.backHeight * 0.5;
    const px = W / 2 - 2;
    const fill = d.back === "panel" ? (2 * px - 3) * d.backHeight * 0.9 * 1.8 : d.back === "slats" ? 3 * 2 * px * 6 * 1.6 : 7 * Math.PI * 0.75 ** 2 * d.backHeight;
    pieces.push({ cm3: 2 * 9 * d.backHeight + 2 * px * 5 * 2.5 + fill, z: zBack });
  }
  return total(pieces, d.wood, false);
}
