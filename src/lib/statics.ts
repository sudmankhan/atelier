// Idealized 2D static tipping model (torque equilibrium about the rear support).
// Coordinate convention (verified in chair/geometry.ts, japanese/geometry.ts, LabModel.tsx):
// +z points FORWARD, units cm. d = (comZ - pivotZ)/100 m, positive when the
// combined chair + occupant centre of mass is forward of the rear pivot.
// Moments are positive when they rotate the chair forward onto its feet.
// This is a teaching model: it ignores motion, impact, sliding, uneven floors,
// flex and joint failure, and does not certify stability.
import type { LabDesign } from "./lab";

export interface StaticsInput { W: number; d: number; F: number; h: number }
export type TipStatus = "stays" | "balance" | "tips";
export interface StaticsResult {
  ok: true;
  gravityMoment: number; // W·d, N·m (signed; negative when CoM is behind pivot)
  pushMoment: number; // F·h, N·m (overturning)
  net: number; // W·d − F·h
  thresholdF: number | null; // backward force at which net = 0; null if undefined
  status: TipStatus;
  label: string;
  notes: string[];
}
export type StaticsOutput = StaticsResult | { ok: false; error: string };

export const EXAMPLE_LOADS = { W: 900, F: 250, label: "Example loads only, not safety standards" } as const;
export const DEFAULT_COM_FRACTION = 0.35; // illustrative assumption, not a measurement
export const DEFAULT_PUSH_HEIGHT_CM = 80; // illustrative assumption
const EPS = 1e-9;

export const STATUS_LABEL: Record<TipStatus, string> = {
  stays: "Static model: tends to stay on its feet",
  balance: "Static model: at the balance point",
  tips: "Static model: tends to tip backward",
};

export function tippingStatics({ W, d, F, h }: StaticsInput): StaticsOutput {
  for (const [k, v] of Object.entries({ W, d, F, h })) if (!Number.isFinite(v)) return { ok: false, error: `${k} must be a finite number` };
  if (W <= 0) return { ok: false, error: "W must be greater than 0 N" };
  if (F < 0) return { ok: false, error: "F cannot be negative (it is the backward push magnitude)" };
  if (h < 0) return { ok: false, error: "h cannot be negative" };
  const gravityMoment = W * d;
  const pushMoment = F * h;
  const net = gravityMoment - pushMoment;
  const notes: string[] = [];
  let thresholdF: number | null;
  if (d < 0) {
    thresholdF = null;
    notes.push("The centre of mass is behind the rear pivot: gravity itself overturns the chair, so no backward push is needed.");
  } else if (h === 0) {
    thresholdF = null;
    notes.push("A push at pivot height (h = 0) creates no overturning moment.");
  } else {
    thresholdF = gravityMoment / h;
    if (d === 0) notes.push("The centre of mass is directly above the pivot: gravity gives no restoring moment.");
  }
  const status: TipStatus = Math.abs(net) < EPS ? "balance" : net > 0 ? "stays" : "tips";
  return { ok: true, gravityMoment, pushMoment, net, thresholdF, status, label: STATUS_LABEL[status], notes };
}

/** Signed lever arm in metres from z-coordinates in cm (+z forward). */
export const leverArm = (comZcm: number, pivotZcm: number) => (comZcm - pivotZcm) / 100;

/** Rear pivot z (cm, +z forward) of a Component Lab design; shared with LabModel. */
export function labRearPivotZ(d: LabDesign) {
  const rz = -d.seatDepth / 2 + d.legThickness;
  const sp = Math.tan((d.splay * Math.PI) / 180) * (d.seatHeight - 3);
  return d.base === "zframe" ? rz - 16 : d.base === "sled" ? rz - 6 : rz - sp;
}

/** Illustrative default CoM z: a fraction of the seat depth forward of the seat rear. */
export const defaultComZ = (seatRearZ: number, seatFrontZ: number, frac = DEFAULT_COM_FRACTION) =>
  seatRearZ + (seatFrontZ - seatRearZ) * frac;
