import { describe, expect, it } from "vitest";
import { KNOWLEDGE } from "./library";

describe("curated knowledge sources", () => {
  it("uses non-Wikipedia references throughout the mentor's knowledge library", () => {
    for (const entry of KNOWLEDGE) {
      expect(`${entry.sourceTitle} ${entry.sourceUrl}`, entry.id).not.toMatch(
        /wikipedia|wikimedia/i,
      );
      if (entry.sourceTitle !== "Traditional workshop practice (educational summary)") {
        expect(new URL(entry.sourceUrl).protocol, entry.id).toBe("https:");
      }
    }
  });

  it("keeps each entry addressable for retrieval and citations", () => {
    expect(new Set(KNOWLEDGE.map((entry) => entry.id)).size).toBe(KNOWLEDGE.length);
    for (const entry of KNOWLEDGE) {
      expect(entry.sourceTitle.trim(), entry.id).not.toBe("");
      expect(entry.explanation.trim(), entry.id).not.toBe("");
    }
  });
});
