# Mentor accuracy and reliability

## Goal
The Master must identify design parameters correctly, ground every number in the app's own calculations, and never certify strength or safety.

## 1. Parameter dictionary (deterministic)
New `src/lib/mentor/paramDictionary.ts`, one entry per real slider for both chairs:
- canonical key, label, exact meaning, component, unit, synonyms, related calculation (e.g. support spacing -> tipping check, rear-joint angle).
- Kangaroo: seatHeight, seatWidth, seatDepth, backAngle, supportSpacing ("rear support kick-back behind the seat", NOT rail spacing), backCurve.
- Japanese: seatHeight, seatWidth, seatDepth, backHeight, legSplay, spindles, armHeight.
- Current value filled from the live params.

Resolver `resolveParams(question, typology)` returns one of:
- `resolved`: matched parameter(s) with definition.
- `ambiguous`: term maps to several parameters (e.g. "back length" on Kangaroo could be back angle/back curve; "spacing" alone) -> the Master asks which one, no model guess.
- `unknown`: term looks like a parameter but none exists (e.g. "rail spacing" — the app has no such slider; rail length follows seat width). The Master says so and names the closest real parameters.
Ambiguous cases are answered with a deterministic clarifying reply without calling Gemini (saves credits).

## 2. Claim guardrails
New `src/lib/mentor/claims.ts`:
- Detect capacity/safety questions ("support 300 pounds", "is it safe", "will it break"). Return a fixed, honest frame: the app has no validated load capacity; list what it can compute (tipping moment, straight-member bending estimate in Component Lab) and what it cannot (joints, shear, fatigue, defects). Gemini still explains conversationally, but this frame is injected as mandatory facts.
- Bending questions: check `beamModelApplies`; the Kangaroo back and frame are curved, so the cantilever model does not apply -> state that; only straight Lab members get numbers.
- Observations passed to Gemini get tags: `[CALCULATED]` (geometry, tipping, beam, USDA data) vs `[HEURISTIC]` (rule-of-thumb scores, warnings).
- Post-check on the answer: flag phrases like "will fail", "will survive", "is safe", "will shoulder all", and any number not present in the supplied context; when found, append a short limitation note (no silent rewriting of meaning).

## 3. Prompt changes (prompt-only)
System prompt gains: use only tagged numbers; qualify heuristic items as estimates; state model assumptions when explaining physics; say plainly when something cannot be calculated; never present advice as certification. Resolved parameter definitions are passed in a PARAMETERS block.

## 4. Tests
`src/lib/mentor/mentor.test.ts` on the deterministic parts:
- "increase support spacing" -> resolves to supportSpacing, rear kick-back, tipping link.
- "increase rail spacing" -> unknown, not supportSpacing.
- "support 300 pounds" -> capacity guardrail, no capacity number produced.
- "structurally safe" -> safety guardrail.
- "backrest length affect bending" -> Kangaroo: ambiguous/curved, beam model not applicable; Japanese: backHeight, not applicable to curved crest.
- Post-check flags "will fail" and an invented number.
One live mentor call afterwards to confirm the reply in the app.

## Report at the end
Clear split: deterministic (dictionary, resolver, guardrails, tags, post-check, tests) vs prompt-only (wording rules). Tone, geometry and other features unchanged.
