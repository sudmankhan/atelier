import { createServerFn } from "@tanstack/react-start";

export interface MentorContext {
  typology: "kangaroo" | "japanese";
  section: string;
  partName: string | null;
  lesson: string | null;
  params: Record<string, number | string>;
  changed: string[];
  observations: string[]; // deterministic geometry facts computed in the browser
}

export interface MentorInput {
  question: string;
  context: MentorContext;
  history: { role: "user" | "assistant"; content: string }[];
}

export interface MentorSource {
  title: string;
  url: string;
}

const SYSTEM = `You are the Master — a demanding but patient furniture maker reviewing an apprentice's work at the bench in FORM & GRAIN.
Your job is mentorship, not encyclopedia recital. Never restate the apprentice's numbers back as a list; they can see their own sliders.
When the design changes, respond as a master would:
1. Say what the change does — mechanically (lever arms, racking, grain direction, joint angles, span) and for the sitter — and whether it helps or hurts, and why.
2. Give direction: what to adjust next, what to watch while making it, what trade-off is being accepted.
3. When it teaches something, end with one pointed question back to the apprentice.
Use the COMPUTED GEOMETRY numbers exactly as given — they are authoritative; never invent numbers. Use the REFERENCE EXCERPTS for craft principles and refer to them by title only. Never invent sources, studies, standards or URLs.
Never claim a design is safe, never give structural safety scores, never promise an angle guarantees comfort; frame judgments as craft reasoning that a real build must still test.
The 3D chairs are simplified educational reconstructions, not exact manufacturing reproductions.
Use the PARAMETERS block for what each design term means; never reinterpret a parameter (for example, support spacing is the rear support's kick-back, not rail spacing). If the apprentice names something that is not a parameter, say so.
Lines tagged [CALCULATED] are computed by the app; lines tagged [HEURISTIC] are rule-of-thumb estimates and must be described as estimates. Follow every MANDATORY FACTS line.
Never calculate stresses, loads or capacities yourself and never invent material properties. Do not say a part will fail, will survive, will shoulder all the load, or is safe. When explaining physics, state the model assumption. When something cannot be calculated here, say so plainly. Your advice is not structural certification.
Plain prose only: no markdown, no asterisks, no headings, no bullet lists; short paragraphs; under 200 words. Speak in first person as the Master.`;

export const askMaster = createServerFn({ method: "POST" })
  .inputValidator((input: MentorInput) => {
    if (!input || typeof input.question !== "string" || !input.question.trim()) throw new Error("Question required");
    return { ...input, question: input.question.slice(0, 1200), history: (input.history ?? []).slice(-8) };
  })
  .handler(async ({ data }) => {
    const { retrieveSync } = await import("@/lib/knowledge/retrieve");
    const { resolveParams, describeParam, clarifyReply, PARAM_DICTIONARY } = await import("@/lib/mentor/paramDictionary");
    const { detectClaims, mandatoryFacts, checkAnswer, LIMITATION_NOTE } = await import("@/lib/mentor/claims");
    const ctx = data.context;
    const resolution = resolveParams(data.question, ctx.typology);
    // Ambiguous parameter: ask instead of guessing (no model call).
    if (resolution.kind === "ambiguous") return { ok: true as const, answer: clarifyReply(resolution), sources: [] as MentorSource[] };
    const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
    const hits = retrieveSync(data.question, { partId: null, changedParams: ctx.changed, typology: ctx.typology }, 4);
    const refs = hits.map((h, i) => `[${i + 1}] ${h.sourceTitle}\nTopic: ${h.topic}\n${h.principle} ${h.explanation}`).join("\n\n");
    const paramText = Object.entries(ctx.params)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ");
    const paramBlock =
      resolution.kind === "resolved"
        ? resolution.params.map((p) => describeParam(p, ctx.params[p.key])).join("\n")
        : resolution.kind === "unknown"
          ? `The apprentice said "${resolution.term}", which is NOT a parameter of this chair. Say so plainly, then point to the closest real parameters:\n${resolution.closest.map((p) => describeParam(p, ctx.params[p.key])).join("\n")}`
          : `No specific parameter named. Known parameters:\n${PARAM_DICTIONARY[ctx.typology].map((p) => `${p.label}: ${p.meaning}`).join("\n")}`;
    const facts = mandatoryFacts(detectClaims(data.question), ctx.typology);
    const ctxText = [
      `Chair being studied: ${ctx.typology === "japanese" ? "Japanese-inspired spindle-back armchair" : "Kangaroo-inspired low lounge chair"}`,
      `Section: ${ctx.section}`,
      `Selected part: ${ctx.partName ?? "none"}`,
      `Active lesson: ${ctx.lesson ?? "none"}`,
      `Current parameters: ${paramText}.`,
      `Changed from original: ${ctx.changed.length ? ctx.changed.join(", ") : "nothing"}`,
      `PARAMETERS (authoritative definitions):\n${paramBlock}`,
      `COMPUTED GEOMETRY:\n${ctx.observations.slice(0, 12).join("\n") || "no changes"}`,
      facts.length ? `MANDATORY FACTS:\n${facts.join("\n")}` : "",
    ].join("\n");

    try {
      const res = await generateChatCompletion({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "system", content: `CONTEXT\n${ctxText}\n\nREFERENCE EXCERPTS\n${refs || "(none matched)"}` },
          ...data.history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: data.question },
        ],
      });
      const content = res.choices?.[0]?.message?.content;
      let answer = (typeof content === "string" ? content : "").replace(/\*\*?/g, "");
      if (answer) {
        const chk = checkAnswer(answer, ctxText);
        if (chk.overclaim || chk.inventedNumbers.length) answer += `\n\n${LIMITATION_NOTE}`;
      }
      return {
        ok: true as const,
        answer: answer || "I don't have a confident answer to that from my references.",
        sources: hits.map((h) => ({ title: h.sourceTitle, url: h.sourceUrl })) as MentorSource[],
      };
    } catch (e) {
      console.error("askMaster failed", e);
      const code = e instanceof GatewayError ? e.code : "unknown";
      const msg =
        code === "payment_required"
          ? "The Master is unavailable — AI credits are exhausted for this workspace."
          : code === "rate_limited"
            ? "The Master is busy. Please wait a moment and ask again."
            : "The Master couldn't answer just now. Please try again.";
      return { ok: false as const, answer: msg, sources: [] as MentorSource[] };
    }
  });

export const voiceStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: Boolean(process.env["ELEVENLABS_API_KEY"]),
}));

export const speakMaster = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => ({ text: String(input?.text ?? "").slice(0, 1500) }))
  .handler(async ({ data }) => {
    const key = process.env["ELEVENLABS_API_KEY"];
    if (!key) return { ok: false as const, audio: null, reason: "not_configured" };
    const voice = process.env["ELEVENLABS_VOICE_ID"] || "JBFqnCBsd6RMkjVDRZzb";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: data.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0.1, speed: 0.92 },
      }),
    });
    if (!r.ok) return { ok: false as const, audio: null, reason: `voice_error_${r.status}` };
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { ok: true as const, audio: btoa(bin), reason: null };
  });
