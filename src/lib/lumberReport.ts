import { z } from "zod";

/** Image-suitability verdicts. Only "usable" may carry grain numbers or part advice. */
export const SUITABILITY = ["usable", "insufficient_detail", "synthetic_or_non_wood", "uncertain"] as const;
export type Suitability = (typeof SUITABILITY)[number];

const RawSchema = z.object({
  suitability: z.enum(SUITABILITY),
  suitabilityReason: z.string().max(400).default(""),
  species: z.string().max(60).optional().nullable(),
  cut: z.enum(["flat-sawn", "quarter-sawn", "rift-sawn", "unknown"]).optional().nullable(),
  grainSlope: z.number().finite().positive().max(200).optional().nullable(),
  defects: z.array(z.string().max(80)).max(10).optional().nullable(),
  bestFor: z.array(z.string()).optional().nullable(),
  avoidFor: z.array(z.string()).optional().nullable(),
  advice: z.string().max(800).optional().nullable(),
  modelConfidence: z.enum(["low", "medium", "high"]).optional().nullable(),
});

export interface UsableReport {
  kind: "usable";
  reason: string;
  species: string;
  cut: string;
  grainSlope: number | null; // N in "1 in N"; an unconfirmed visual estimate
  defects: string[];
  bestFor: string[];
  avoidFor: string[];
  advice: string;
  modelConfidence: "low" | "medium" | "high"; // self-reported, NOT a calibrated probability
}
export interface Abstention {
  kind: "abstain";
  suitability: Exclude<Suitability, "usable">;
  reason: string;
  photoTips: string[];
}
export type LumberReport = UsableReport | Abstention;

export const PHOTO_TIPS = [
  "Photograph one real board, filling most of the frame.",
  "Use even daylight; avoid glare and hard shadows.",
  "Hold the camera square to the face, in focus, close enough to see pores and rays.",
  "Plane or wipe a small patch so the grain is visible; add a second shot of the edge.",
];

/** Validate raw model text into a typed report. Anything malformed or not clearly usable becomes an abstention. */
export function parseLumberReport(text: string, allowedParts: string[]): LumberReport {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  let json: unknown;
  try {
    json = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : null;
  } catch {
    json = null;
  }
  const r = RawSchema.safeParse(json);
  if (!r.success) {
    return { kind: "abstain", suitability: "uncertain", reason: "The photo reader returned an answer that failed validation, so nothing is reported.", photoTips: PHOTO_TIPS };
  }
  const p = r.data;
  const clean = (s: string) => s.replace(/\*/g, "").trim();
  if (p.suitability !== "usable") {
    return { kind: "abstain", suitability: p.suitability, reason: clean(p.suitabilityReason) || "The image isn't clear enough to judge.", photoTips: PHOTO_TIPS };
  }
  const allowed = new Set(allowedParts);
  const best = (p.bestFor ?? []).filter((x) => allowed.has(x));
  const avoid = (p.avoidFor ?? []).filter((x) => allowed.has(x) && !best.includes(x));
  return {
    kind: "usable",
    reason: clean(p.suitabilityReason),
    species: clean(p.species ?? "") || "unknown",
    cut: p.cut ?? "unknown",
    grainSlope: p.grainSlope != null ? Math.round(p.grainSlope) : null,
    defects: (p.defects ?? []).map(clean).slice(0, 6),
    // No grain reading → no part recommendations (avoid-lists are still allowed: they are conservative).
    bestFor: p.grainSlope != null ? best : [],
    avoidFor: avoid,
    advice: clean(p.advice ?? ""),
    modelConfidence: p.modelConfidence ?? "low",
  };
}

/** Basic input checks on the uploaded data URL (deterministic, before any model call). */
export function validateImageDataUrl(image: unknown): string | null {
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) return "Please upload a JPEG, PNG or WebP image.";
  const b64 = image.slice(image.indexOf(",") + 1);
  if (b64.length < 200) return "That image file is empty or too small to inspect.";
  if (image.length > 6_000_000) return "Image too large.";
  return null;
}
