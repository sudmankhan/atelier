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
Plain prose only: no markdown, no asterisks, no headings, no bullet lists; short paragraphs; under 200 words. Speak in first person as the Master.`;

export const askMaster = createServerFn({ method: "POST" })
  .inputValidator((input: MentorInput) => {
    if (!input || typeof input.question !== "string" || !input.question.trim())
      throw new Error("Question required");
    return {
      ...input,
      question: input.question.slice(0, 1200),
      history: (input.history ?? []).slice(-8),
    };
  })
  .handler(async ({ data }) => {
    const { retrieveSync } = await import("@/lib/knowledge/retrieve");
    const { generateGeminiContent, geminiErrorKind } = await import("@/lib/gemini.server");
    const ctx = data.context;
    const hits = retrieveSync(
      data.question,
      { partId: null, changedParams: ctx.changed, typology: ctx.typology },
      4,
    );
    const refs = hits
      .map(
        (h, i) => `[${i + 1}] ${h.sourceTitle}\nTopic: ${h.topic}\n${h.principle} ${h.explanation}`,
      )
      .join("\n\n");
    const paramText = Object.entries(ctx.params)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ");
    const ctxText = [
      `Chair being studied: ${ctx.typology === "japanese" ? "Japanese-inspired spindle-back armchair" : "Kangaroo-inspired low lounge chair"}`,
      `Section: ${ctx.section}`,
      `Selected part: ${ctx.partName ?? "none"}`,
      `Active lesson: ${ctx.lesson ?? "none"}`,
      `Current parameters: ${paramText}.`,
      `Changed from original: ${ctx.changed.length ? ctx.changed.join(", ") : "nothing"}`,
      `COMPUTED GEOMETRY:\n${ctx.observations.slice(0, 12).join("\n") || "no changes"}`,
    ].join("\n");

    try {
      const answer = await generateGeminiContent({
        system: `${SYSTEM}\n\nCONTEXT\n${ctxText}\n\nREFERENCE EXCERPTS\n${refs || "(none matched)"}`,
        contents: [
          ...data.history.map((message) => ({
            role: message.role === "assistant" ? ("model" as const) : ("user" as const),
            parts: [{ text: message.content }],
          })),
          { role: "user", parts: [{ text: data.question }] },
        ],
      });
      return {
        ok: true as const,
        answer:
          answer.replace(/\*\*?/g, "") ||
          "I don't have a confident answer to that from my references.",
        sources: hits.map((h) => ({ title: h.sourceTitle, url: h.sourceUrl })) as MentorSource[],
      };
    } catch (e) {
      console.error("askMaster failed", e);
      const kind = geminiErrorKind(e);
      const msg =
        kind === "not_configured"
          ? "The Master is unavailable — GEMINI_API_KEY is not configured on the server."
          : kind === "rate_limited"
            ? "The Master is busy. Please wait a moment and ask again."
            : kind === "timeout"
              ? "The Master took too long to answer. Please try again."
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
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0.1, speed: 0.92 },
        }),
      },
    );
    if (!r.ok) return { ok: false as const, audio: null, reason: `voice_error_${r.status}` };
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { ok: true as const, audio: btoa(bin), reason: null };
  });
