import { createServerFn } from "@tanstack/react-start";
import type { LabDesign } from "./lab";
import type { Setting } from "./weather";
import type { Brief } from "./brief";

export interface BriefInput { text: string; current?: LabDesign | null; setting?: Setting }
export type BriefResult = { ok: true; source: "ai" | "keywords"; note?: string; brief: Brief };

/**
 * "Describe it → design". Gemini picks engine settings as JSON; `toBrief` validates and clamps them.
 * Any AI failure falls back to the keyword reader, so the person always gets a chair, never an error.
 */
export const designFromText = createServerFn({ method: "POST" })
  .inputValidator((input: BriefInput) => {
    if (!input || typeof input.text !== "string" || !input.text.trim()) throw new Error("Describe the chair you want");
    return { text: input.text.slice(0, 600), current: input.current ?? null, setting: input.setting ?? "indoor" };
  })
  .handler(async ({ data }): Promise<BriefResult> => {
    const { BRIEF_SYSTEM, START, heuristicBrief, isChange, toBrief } = await import("./brief");
    // A new description starts from a sound chair; only "make it…/add…" edits the one on the bench.
    const base = data.current && isChange(data.text) ? data.current : START;
    try {
      const { generateGeminiContent } = await import("./gemini.server");
      const out = await generateGeminiContent({
        system: BRIEF_SYSTEM,
        json: true,
        contents: [{ role: "user", parts: [{ text: `CURRENT design: ${JSON.stringify({ ...base, setting: data.setting })}\n\nThe person says: ${data.text}` }] }],
      });
      const raw = JSON.parse(out.replace(/^```(?:json)?|```$/g, "").trim());
      return { ok: true, source: "ai", brief: toBrief(raw, base, data.setting) };
    } catch (e) {
      console.error("designFromText fell back to keywords", e);
      const { geminiErrorKind } = await import("./gemini.server");
      const kind = geminiErrorKind(e);
      const note = kind === "not_configured" ? "AI isn't connected here, so I read your words directly." : "The AI didn't answer, so I read your words directly.";
      return { ok: true, source: "keywords", note, brief: heuristicBrief(data.text, base, data.setting) };
    }
  });
