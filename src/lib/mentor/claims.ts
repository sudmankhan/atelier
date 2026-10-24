// Deterministic guardrails for engineering claims in mentor answers.
export type ClaimKind = "capacity" | "safety" | "bending";

export function detectClaims(question: string): ClaimKind[] {
  const q = question.toLowerCase();
  const out: ClaimKind[] = [];
  if (/\b(support|hold|carry|take)\b.*\b\d+\s*(lb|lbs|pounds?|kg|kilos?|n|newtons?)\b|\b(weight|load)\s+(limit|capacity|rating)\b|\bhow much weight\b/.test(q)) out.push("capacity");
  if (/\b(safe|safety|will it (break|fail|hold)|structurally (sound|safe)|collapse)\b/.test(q)) out.push("safety");
  if (/\b(bend|bending|flex|deflect|deflection|bow|stress)\b/.test(q)) out.push("bending");
  return out;
}

const LIMITS =
  "This app has no validated load capacity or safety rating for any chair. It can compute, under stated assumed loads: chair geometry, the static tipping check including the chair's own weight, the bending moment at each key joint from a free-body diagram, the bending stress on the tenon or member section compared with a reference stress derived from USDA Wood Handbook clear-wood data, seasonal wood movement, and an educational cantilever estimate for straight members. It cannot compute: glue-line failure, screw withdrawal, shear, buckling, splitting, knots or other defects, creep, fatigue or impact.";

export function mandatoryFacts(kinds: ClaimKind[], typology: "kangaroo" | "japanese"): string[] {
  const f: string[] = [];
  if (kinds.includes("capacity") || kinds.includes("safety")) {
    f.push(`[LIMITATION] ${LIMITS} Do not give a yes/no on capacity or safety; explain what would have to be tested in a real build.`);
  }
  if (kinds.includes("bending")) {
    f.push(
      typology === "kangaroo"
        ? "[LIMITATION] Joint and back-post bending stresses are computed: quote only the [CALCULATED] lines, with their assumed loads. The straight cantilever deflection model does not apply to the curved Kangaroo side frame, so no deflection (flex) number exists for it; only qualitative reasoning about flex is allowed, labelled as heuristic."
        : "[LIMITATION] Leg, arm and back-post joint stresses are computed: quote only the [CALCULATED] lines, with their assumed loads. The straight cantilever deflection model does not apply to the curved crest rail or the spindle back as a system, so no deflection (flex) number exists for them; only qualitative reasoning is allowed, labelled as heuristic.",
    );
  }
  return f;
}

const OVERCLAIM = /\b(will (fail|break|snap|survive|hold up|shoulder all)|is (structurally )?safe|guarantee[sd]?|certainly (hold|fail)|rated for|can (safely )?support \d+)/i;

/** Flags overconfident phrasing and numbers that appear nowhere in the supplied context. */
export function checkAnswer(answer: string, context: string): { overclaim: boolean; inventedNumbers: string[] } {
  const ctxNums = new Set((context.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n))));
  const inventedNumbers = (answer.match(/\d+(?:\.\d+)?/g) ?? [])
    .map((n) => String(Number(n)))
    .filter((n) => Number(n) > 12 && !ctxNums.has(n)); // small counts (1..12) are ordinary prose
  return { overclaim: OVERCLAIM.test(answer), inventedNumbers: [...new Set(inventedNumbers)] };
}

export const LIMITATION_NOTE =
  "Note from the workshop: that's craft reasoning, not a calculated or certified result. Only the numbers shown in the app are computed, and real strength has to be tested in a build.";
