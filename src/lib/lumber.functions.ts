import { createServerFn } from "@tanstack/react-start";

export interface LumberInput {
  image: string; // data URL (jpeg/png/webp)
  board: { l: number; w: number; t: number };
  typology: "kangaroo" | "japanese";
  parts: string[];
}
export interface LumberReport {
  species: string;
  cut: string; // flat-sawn / quarter-sawn / rift / unknown
  grainSlope: number | null; // N in "1 in N"
  defects: string[];
  bestFor: string[];
  avoidFor: string[];
  advice: string;
  confidence: "low" | "medium" | "high";
}

const SYSTEM = `You are a strict master chairmaker inspecting a photo of a real board of timber for an apprentice.
Look only at what is visible. Estimate: species (or "unknown"), sawing (flat-sawn, quarter-sawn, rift-sawn, unknown), grain slope relative to the board's long edge as N in "1 in N" (straight grain ~ 20+, null if you truly cannot see grain), and visible defects (knots, checks, sapwood, wane, twist, pith, spalting).
Then assign the apprentice's chair parts: bestFor and avoidFor must only use names from the PARTS list given. Apply the 1:12 rule: grain steeper than 1 in 12 must not be used for legs, posts, spindles, crest rails or other loaded long parts.
Never claim the board is safe; you are judging from a photo. advice: under 70 words, plain prose, how to orient and cut this board.
Reply ONLY with JSON: {"species":string,"cut":string,"grainSlope":number|null,"defects":string[],"bestFor":string[],"avoidFor":string[],"advice":string,"confidence":"low"|"medium"|"high"}`;

export const inspectLumber = createServerFn({ method: "POST" })
  .inputValidator((i: LumberInput) => {
    if (!i || typeof i.image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(i.image)) throw new Error("Image required");
    if (i.image.length > 6_000_000) throw new Error("Image too large");
    return { ...i, parts: (i.parts ?? []).slice(0, 20).map((p) => String(p).slice(0, 60)) };
  })
  .handler(async ({ data }) => {
    const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
    const ctx = `Chair: ${data.typology === "japanese" ? "Japanese-inspired spindle-back" : "Kangaroo-inspired lounge chair"}. Board (rough): ${data.board.l} × ${data.board.w} × ${data.board.t} cm. PARTS: ${data.parts.join(", ")}.`;
    try {
      const res = await generateChatCompletion({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [{ type: "text", text: ctx }, { type: "image_url", image_url: { url: data.image } }] },
        ],
      } as Parameters<typeof generateChatCompletion>[0]);
      const raw = res.choices?.[0]?.message?.content;
      const text = typeof raw === "string" ? raw : "";
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const p = JSON.parse(json) as Partial<LumberReport>;
      const allowed = new Set(data.parts);
      const slope = typeof p.grainSlope === "number" && p.grainSlope > 0 ? Math.round(p.grainSlope) : null;
      const report: LumberReport = {
        species: String(p.species ?? "unknown"),
        cut: String(p.cut ?? "unknown"),
        grainSlope: slope,
        defects: Array.isArray(p.defects) ? p.defects.map(String).slice(0, 6) : [],
        bestFor: Array.isArray(p.bestFor) ? p.bestFor.map(String).filter((x) => allowed.has(x)) : [],
        avoidFor: Array.isArray(p.avoidFor) ? p.avoidFor.map(String).filter((x) => allowed.has(x)) : [],
        advice: String(p.advice ?? "").replace(/\*/g, ""),
        confidence: p.confidence === "high" || p.confidence === "medium" ? p.confidence : "low",
      };
      return { ok: true as const, report, error: null };
    } catch (e) {
      console.error("inspectLumber failed", e);
      const code = e instanceof GatewayError ? e.code : "unknown";
      const error = code === "payment_required" ? "AI credits are exhausted for this workspace." : code === "rate_limited" ? "Too many requests — wait a moment and try again." : "Couldn't read that photo. Try a clearer, well-lit shot of the board face.";
      return { ok: false as const, report: null, error };
    }
  });
