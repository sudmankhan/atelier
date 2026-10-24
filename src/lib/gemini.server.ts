const DEFAULT_TEXT_MODEL = "gemini-3.5-flash";
const DEFAULT_VISION_MODEL = "gemini-3-flash-preview";
const REQUEST_TIMEOUT_MS = 45_000;

interface GeminiPart {
  text?: string;
  thought?: boolean;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateGeminiContent({
  system,
  contents,
  json = false,
  mode = "text",
}: {
  system: string;
  contents: GeminiContent[];
  json?: boolean;
  mode?: "text" | "vision";
}): Promise<string> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not configured", 500, "NOT_CONFIGURED");

  const model =
    mode === "vision"
      ? process.env["GEMINI_VISION_MODEL"] || DEFAULT_VISION_MODEL
      : process.env["GEMINI_MODEL"] || DEFAULT_TEXT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  let payload: GeminiResponse;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            maxOutputTokens: 2_048,
            thinkingConfig: { thinkingBudget: 128 },
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
        signal: controller.signal,
      },
    );
    payload = (await response.json().catch(() => ({}))) as GeminiResponse;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new GeminiError("Gemini request timed out", 504, "TIMEOUT");
    }
    throw new GeminiError(
      error instanceof Error ? error.message : "Gemini network request failed",
      502,
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new GeminiError(
      payload.error?.message || `Gemini request failed with status ${response.status}`,
      response.status,
      payload.error?.status || "UNKNOWN",
    );
  }

  const candidate = payload.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new GeminiError("Gemini exhausted its output budget", 502, "INCOMPLETE_RESPONSE");
  }

  const text = candidate?.content?.parts
    ?.filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new GeminiError("Gemini returned no text", 502, "EMPTY_RESPONSE");
  return text;
}

export function geminiErrorKind(
  error: unknown,
): "not_configured" | "rate_limited" | "timeout" | "unknown" {
  if (!(error instanceof GeminiError)) return "unknown";
  if (error.code === "NOT_CONFIGURED") return "not_configured";
  if (error.status === 429 || error.code === "RESOURCE_EXHAUSTED") return "rate_limited";
  if (error.code === "TIMEOUT") return "timeout";
  return "unknown";
}
