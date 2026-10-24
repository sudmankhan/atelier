// Deterministic sitter-to-chair fit checks. These are dimensional teaching
// checks, not comfort guarantees or substitutes for a physical fitting.
import type { UserMeasurements } from "./consequences";
import type { ChairParams, Typology } from "./params";
import type { JapaneseParams } from "./japanese/params";

export type FitLevel = "ok" | "watch" | "conflict";
export type FitArea = "seatHeight" | "seatDepth" | "seatWidth";

export interface ResolvedSitterMeasurements {
  poplitealHeight: number;
  thighLength: number;
  hipBreadth: number;
  torsoHeight: number;
  massKg: number;
}

export interface FitResult {
  id: FitArea;
  title: string;
  level: FitLevel;
  actual: number;
  target: string;
  detail: string;
}

export const DEFAULT_SITTER: ResolvedSitterMeasurements = {
  poplitealHeight: 43,
  thighLength: 48,
  hipBreadth: 38,
  torsoHeight: 55,
  massKg: 75,
};

export function resolveSitter(user: UserMeasurements): ResolvedSitterMeasurements {
  return {
    poplitealHeight: user.poplitealHeight ?? DEFAULT_SITTER.poplitealHeight,
    thighLength: user.thighLength ?? DEFAULT_SITTER.thighLength,
    hipBreadth: user.hipBreadth ?? DEFAULT_SITTER.hipBreadth,
    torsoHeight: user.torsoHeight ?? DEFAULT_SITTER.torsoHeight,
    massKg: user.massKg ?? DEFAULT_SITTER.massKg,
  };
}

export function evaluateSitterFit(
  _typology: Typology,
  params: ChairParams | JapaneseParams,
  user: UserMeasurements,
): FitResult[] {
  const sitter = resolveSitter(user);
  const heightDelta = params.seatHeight - sitter.poplitealHeight;
  const kneeClearance = sitter.thighLength - params.seatDepth;
  const sideClearance = params.seatWidth - sitter.hipBreadth;

  return [
    {
      id: "seatHeight",
      title: "Foot support",
      level: heightDelta > 2 ? "conflict" : heightDelta < -8 ? "watch" : "ok",
      actual: heightDelta,
      target: "seat at or slightly below knee height",
      detail:
        heightDelta > 2
          ? `The seat is ${f1(heightDelta)} cm above the sitter's knee height, so the feet may lose firm floor contact.`
          : heightDelta < -8
            ? `The seat is ${f1(Math.abs(heightDelta))} cm below knee height, raising the knees and increasing the effort to stand.`
            : `Seat and knee height differ by ${f1(Math.abs(heightDelta))} cm, leaving the feet supported in this simplified pose.`,
    },
    {
      id: "seatDepth",
      title: "Knee clearance",
      level: kneeClearance < 3 ? "conflict" : kneeClearance > 14 ? "watch" : "ok",
      actual: kneeClearance,
      target: "3–14 cm between seat edge and knee",
      detail:
        kneeClearance < 3
          ? `Only ${f1(kneeClearance)} cm remains before the knee; the front edge reaches into the knee crease.`
          : kneeClearance > 14
            ? `${f1(kneeClearance)} cm remains unsupported beneath the thigh; the seat may feel shallow.`
            : `${f1(kneeClearance)} cm remains between the seat edge and the knee in the simplified side view.`,
    },
    {
      id: "seatWidth",
      title: "Hip clearance",
      level: sideClearance < 4 ? "conflict" : sideClearance < 8 ? "watch" : "ok",
      actual: sideClearance,
      target: "at least 4 cm total side clearance",
      detail:
        sideClearance < 4
          ? `The seat leaves ${f1(sideClearance)} cm total clearance around the hips, creating side contact.`
          : sideClearance < 8
            ? `${f1(sideClearance)} cm total hip clearance fits closely and leaves little room to shift posture.`
            : `${f1(sideClearance)} cm total clearance leaves room to shift posture.`,
    },
  ];
}

const f1 = (value: number) => (Math.round(value * 10) / 10).toFixed(1);
