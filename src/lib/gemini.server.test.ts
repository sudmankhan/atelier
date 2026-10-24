import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiError, generateGeminiContent, geminiErrorKind } from "./gemini.server";

describe("generateGeminiContent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("calls Gemini directly with the server API key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "Direct response" }] } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateGeminiContent({
        system: "System prompt",
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        json: true,
      }),
    ).resolves.toBe("Direct response");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/models/gemini-3.5-flash:generateContent");
    expect(init.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      systemInstruction: { parts: [{ text: "System prompt" }] },
      generationConfig: { maxOutputTokens: 1_024, responseMimeType: "application/json" },
    });
  });

  it("reports missing configuration and quota errors", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(generateGeminiContent({ system: "System", contents: [] })).rejects.toMatchObject({
      code: "NOT_CONFIGURED",
    });
    expect(geminiErrorKind(new GeminiError("quota", 429, "RESOURCE_EXHAUSTED"))).toBe(
      "rate_limited",
    );
  });

  it("uses the vision model for image requests", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "Image response" }] } }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await generateGeminiContent({
      system: "Inspect the image",
      contents: [{ role: "user", parts: [{ text: "Describe it" }] }],
      mode: "vision",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      "/models/gemini-3-flash-preview:generateContent",
    );
  });
});
