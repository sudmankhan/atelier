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
  "This app has no validated load capacity or safety rating for any chair. It can compute: chair geometry, the idealized static tipping moment (Tipping tab), and an educational cantilever bending estimate for straight members in Component Lab. It cannot compute: joint strength, glue-line failure, shear, buckling, splitting, defects, creep or fatigue.";

export function mandatoryFacts(kinds: ClaimKind[], typology: "kangaroo" | "japanese"): string[] {
  const f: string[] = [];
  if (kinds.includes("capacity") || kinds.includes("safety")) {
    f.push(`[LIMITATION] ${LIMITS} Do not give a yes/no on capacity or safety; explain what would have to be tested in a real build.`);
  }
  if (kinds.includes("bending")) {
    f.push(
      typology === "kangaroo"
        ? "[LIMITATION] The Kangaroo back post and side frame are curved; the straight cantilever beam model does not apply, so no bending stress or deflection number exists for them. Only qualitative reasoning (longer lever, thinner section -> more flex) is allowed, labelled as heuristic."
        : "[LIMITATION] The Japanese crest rail is curved and the back is a spindle/joint system; the straight cantilever model does not apply to it, so there is no computed bending number. Only qualitative reasoning is allowed, labelled as heuristic.",
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
