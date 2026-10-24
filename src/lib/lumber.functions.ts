import { createServerFn } from "@tanstack/react-start";
import { parseLumberReport, validateImageDataUrl } from "./lumberReport";

export interface LumberInput {
  image: string; // data URL (jpeg/png/webp)
  board: { l: number; w: number; t: number };
  typology: "kangaroo" | "japanese";
  parts: string[];
}
export type { LumberReport } from "./lumberReport";

const SYSTEM = `You are a strict master chairmaker inspecting an uploaded image for an apprentice.
STEP 1 — suitability. Decide first whether the image actually shows a real, physical wood surface with enough detail to read grain:
- "usable": a real photographed board, in focus, grain lines/pores clearly visible.
- "insufficient_detail": real wood, but blurry, too dark, too far, glare, or finish hides the grain.
- "synthetic_or_non_wood": a drawing, render, digital pattern, uniform stripes, text, or any non-wood subject.
- "uncertain": you cannot tell.
Be skeptical: regular perfect stripes with no pores, rays, colour variation or texture are synthetic. If not "usable", set every other field to null and explain why in suitabilityReason.
STEP 2 (only if usable): species (or "unknown"), cut (flat-sawn | quarter-sawn | rift-sawn | unknown), grain as a visual impression of how the fibres run relative to the long edge: "straight", "moderate" or "steep", or null if not readable. Never give a numeric slope; a photo cannot measure it. Visible defects. bestFor/avoidFor may only use names from PARTS. If grain looks steep, list legs, posts, spindles and rails under avoidFor. Never invent moisture content, strength or measurements. Never claim the board is safe. advice: under 70 words.
Reply ONLY with JSON: {"suitability":string,"suitabilityReason":string,"species":string|null,"cut":string|null,"grain":"straight"|"moderate"|"steep"|null,"defects":string[]|null,"bestFor":string[]|null,"avoidFor":string[]|null,"advice":string|null,"modelConfidence":"low"|"medium"|"high"|null}`;

export const inspectLumber = createServerFn({ method: "POST" })
  .validator((i: LumberInput) => {
    const bad = validateImageDataUrl(i?.image);
    if (bad) throw new Error(bad);
    return { ...i, parts: (i.parts ?? []).slice(0, 20).map((p) => String(p).slice(0, 60)) };
  })
  .handler(async ({ data }) => {
    const { generateGeminiContent, geminiErrorKind } = await import("@/lib/gemini.server");
    const ctx = `Chair: ${data.typology === "japanese" ? "Japanese-inspired spindle-back" : "Kangaroo-inspired lounge chair"}. Board (rough): ${data.board.l} × ${data.board.w} × ${data.board.t} cm. PARTS: ${data.parts.join(", ")}.`;
    try {
      const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data.image);
      if (!match) throw new Error("Invalid image data URL");
      const text = await generateGeminiContent({
        system: SYSTEM,
        contents: [
          {
            role: "user",
            parts: [{ text: ctx }, { inlineData: { mimeType: match[1], data: match[2] } }],
          },
        ],
        mode: "vision",
      });
      const report = parseLumberReport(text, data.parts);
      return { ok: true as const, report, error: null };
    } catch (e) {
      console.error("inspectLumber failed", e);
      const kind = geminiErrorKind(e);
      const error = kind === "not_configured" ? "Lumber inspection is not configured. Add GEMINI_API_KEY to the server environment." : kind === "rate_limited" ? "Too many requests — wait a moment and try again." : kind === "timeout" ? "The photo inspection took too long. Please try again with a smaller image." : "Couldn't read that photo. Try a clearer, well-lit shot of the board face.";
      return { ok: false as const, report: null, error };
    }
  });
