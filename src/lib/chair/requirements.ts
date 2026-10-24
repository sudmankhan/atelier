// Advisory design requirements for the parametric studio.
// These are transparent in-app design briefs, not claims of standards compliance.
import type { ChairParams, Typology } from "./params";
import type { JapaneseParams } from "./japanese/params";

export type RequirementProfileId = "lounge" | "dining";
export type RequirementMetric = "seatHeight" | "seatWidth" | "seatDepth" | "backAngle";
export type RequirementCategory = "human-factors" | "product-test";
export type RequirementStatus = "meets" | "outside" | "pending-test";
export type AnyChairParams = ChairParams | JapaneseParams;

export interface RequirementProfile {
  id: RequirementProfileId;
  label: string;
  description: string;
}

export interface RequirementSource {
  title: string;
  version: string;
  section: string;
  authority: "in-app-guidance";
}

interface RequirementBase {
  id: string;
  profile: RequirementProfileId;
  title: string;
  category: RequirementCategory;
  appliesTo: Typology[];
  rationale: string;
  source: RequirementSource;
}

export interface RangeRequirement extends RequirementBase {
  kind: "range";
  metric: RequirementMetric;
  min: number;
  max: number;
  unit: "cm" | "°";
}

export interface PhysicalTestRequirement extends RequirementBase {
  kind: "physical-test";
  method: string;
}

export type RequirementSpec = RangeRequirement | PhysicalTestRequirement;

export interface RequirementResult {
  spec: RequirementSpec;
  status: RequirementStatus;
  actual: number | null;
  evidence: string;
}

export const REQUIREMENT_PROFILES: Record<RequirementProfileId, RequirementProfile> = {
  lounge: {
    id: "lounge",
    label: "Low lounge",
    description: "A relaxed chair with a low seat, deeper support and a reclined back.",
  },
  dining: {
    id: "dining",
    label: "Dining",
    description: "An upright chair intended for sitting at a table and rising more easily.",
  },
};

const SOURCE: RequirementSource = {
  title: "FORM & GRAIN seating design brief",
  version: "1.0",
  section: "Dimensional guidance",
  authority: "in-app-guidance",
};

const TEST_SOURCE: RequirementSource = {
  title: "FORM & GRAIN product-test checklist",
  version: "1.0",
  section: "Physical verification",
  authority: "in-app-guidance",
};

const BOTH: Typology[] = ["kangaroo", "japanese"];
const KANGAROO: Typology[] = ["kangaroo"];

export const REQUIREMENT_SPECS: RequirementSpec[] = [
  range(
    "lounge-seat-height",
    "lounge",
    "Seat height",
    "seatHeight",
    34,
    40,
    "cm",
    BOTH,
    "Keeps the sitter low while avoiding the most difficult rise from the chair.",
  ),
  range(
    "lounge-seat-width",
    "lounge",
    "Seat width",
    "seatWidth",
    48,
    62,
    "cm",
    BOTH,
    "Allows room to shift posture without making every cross-member unnecessarily long.",
  ),
  range(
    "lounge-seat-depth",
    "lounge",
    "Seat depth",
    "seatDepth",
    48,
    60,
    "cm",
    BOTH,
    "Supports a reclined posture; body size still determines whether the front edge reaches behind the knee.",
  ),
  range(
    "lounge-back-angle",
    "lounge",
    "Seat-to-back angle",
    "backAngle",
    105,
    120,
    "°",
    KANGAROO,
    "Supports a relaxed posture without using the most extreme recline available in the model.",
  ),
  range(
    "dining-seat-height",
    "dining",
    "Seat height",
    "seatHeight",
    40,
    47,
    "cm",
    BOTH,
    "Places the sitter closer to table height and generally makes rising easier than a low lounge seat.",
  ),
  range(
    "dining-seat-width",
    "dining",
    "Seat width",
    "seatWidth",
    44,
    60,
    "cm",
    BOTH,
    "Provides useful sitting room while keeping the chair practical around a table.",
  ),
  range(
    "dining-seat-depth",
    "dining",
    "Seat depth",
    "seatDepth",
    38,
    48,
    "cm",
    BOTH,
    "Limits pressure behind the knees when the sitter remains upright at a table.",
  ),
  range(
    "dining-back-angle",
    "dining",
    "Seat-to-back angle",
    "backAngle",
    95,
    108,
    "°",
    KANGAROO,
    "Keeps the back more upright for dining or attentive sitting.",
  ),
  physical(
    "lounge-rearward-stability",
    "lounge",
    "Rearward stability test",
    "A built prototype must be tested under a documented rearward load; geometry alone cannot record a pass.",
  ),
  physical(
    "lounge-strength",
    "lounge",
    "Static and cyclic load tests",
    "Joint and member performance must be verified on a representative physical build.",
  ),
  physical(
    "dining-rearward-stability",
    "dining",
    "Rearward stability test",
    "A built prototype must be tested under a documented rearward load; geometry alone cannot record a pass.",
  ),
  physical(
    "dining-strength",
    "dining",
    "Static and cyclic load tests",
    "Joint and member performance must be verified on a representative physical build.",
  ),
];

function range(
  id: string,
  profile: RequirementProfileId,
  title: string,
  metric: RequirementMetric,
  min: number,
  max: number,
  unit: "cm" | "°",
  appliesTo: Typology[],
  rationale: string,
): RangeRequirement {
  return {
    id,
    profile,
    title,
    category: "human-factors",
    kind: "range",
    metric,
    min,
    max,
    unit,
    appliesTo,
    rationale,
    source: SOURCE,
  };
}

function physical(
  id: string,
  profile: RequirementProfileId,
  title: string,
  rationale: string,
): PhysicalTestRequirement {
  return {
    id,
    profile,
    title,
    category: "product-test",
    kind: "physical-test",
    appliesTo: BOTH,
    rationale,
    method:
      "Record the test method, load, cycles, specimen and result after testing a representative build.",
    source: TEST_SOURCE,
  };
}

export function evaluateRequirements(
  profile: RequirementProfileId,
  typology: Typology,
  params: AnyChairParams,
): RequirementResult[] {
  return REQUIREMENT_SPECS.filter(
    (spec) => spec.profile === profile && spec.appliesTo.includes(typology),
  ).map((spec) => {
    if (spec.kind === "physical-test") {
      return {
        spec,
        status: "pending-test" as const,
        actual: null,
        evidence: "Not evaluated digitally — record evidence from a representative physical build.",
      };
    }

    const actual = numericMetric(params, spec.metric);
    const meets = actual >= spec.min && actual <= spec.max;
    return {
      spec,
      status: meets ? ("meets" as const) : ("outside" as const),
      actual,
      evidence: meets
        ? `${formatValue(actual, spec.unit)} is within ${formatRequirementTarget(spec)}.`
        : `${formatValue(actual, spec.unit)} is ${actual < spec.min ? "below" : "above"} ${formatRequirementTarget(spec)}.`,
    };
  });
}

function numericMetric(params: AnyChairParams, metric: RequirementMetric): number {
  if (metric === "backAngle") return (params as ChairParams).backAngle;
  return params[metric];
}

function formatValue(value: number, unit: string) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}${unit}`;
}

export function formatRequirementTarget(spec: RequirementSpec) {
  return spec.kind === "range" ? `${spec.min}–${spec.max}${spec.unit}` : "physical test required";
}
