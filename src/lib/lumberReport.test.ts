import { describe, expect, it } from "vitest";
import { parseLumberReport, validateImageDataUrl } from "./lumberReport";

const parts = ["Front leg", "Rear leg", "Seat"];
const j = (o: object) => "```json\n" + JSON.stringify(o) + "\n```";

describe("lumber photo report validation", () => {
  it("usable clear photo keeps the grain impression and allowed parts", () => {
    const r = parseLumberReport(j({ suitability: "usable", suitabilityReason: "clear face", species: "white oak", cut: "quarter-sawn", grain: "straight", bestFor: ["Front leg", "Made up"], avoidFor: [], advice: "ok", modelConfidence: "medium" }), parts);
    expect(r.kind).toBe("usable");
    if (r.kind === "usable") { expect(r.grain).toBe("straight"); expect(r.bestFor).toEqual(["Front leg"]); }
  });
  it("never produces a numeric grain slope, even if the model sends one", () => {
    const r = parseLumberReport(j({ suitability: "usable", grainSlope: 22, grain: "moderate" }), parts);
    expect(r).not.toHaveProperty("grainSlope");
    expect(r.kind === "usable" && r.grain).toBe("moderate");
  });
  it("synthetic image abstains and drops readings even if model supplied them", () => {
    const r = parseLumberReport(j({ suitability: "synthetic_or_non_wood", suitabilityReason: "flat digital stripes", grain: "straight", bestFor: ["Front leg"] }), parts);
    expect(r.kind).toBe("abstain");
    expect(r).not.toHaveProperty("grain");
    expect(r).not.toHaveProperty("bestFor");
  });
  it("blurry wood abstains as insufficient detail", () => {
    const r = parseLumberReport(j({ suitability: "insufficient_detail", suitabilityReason: "blurred" }), parts);
    expect(r.kind === "abstain" && r.suitability).toBe("insufficient_detail");
  });
  it("malformed output abstains as uncertain", () => {
    expect(parseLumberReport("not json", parts).kind).toBe("abstain");
    expect(parseLumberReport(j({ suitability: "usable", grain: "wavy" }), parts).kind).toBe("abstain");
    expect(parseLumberReport(j({ suitability: "great" }), parts).kind).toBe("abstain");
  });
  it("usable but no grain reading gives no 'good for' parts", () => {
    const r = parseLumberReport(j({ suitability: "usable", grain: null, bestFor: ["Front leg"], avoidFor: ["Rear leg"] }), parts);
    if (r.kind !== "usable") throw new Error("expected usable");
    expect(r.bestFor).toEqual([]);
    expect(r.avoidFor).toEqual(["Rear leg"]);
  });
  it("rejects empty or invalid files before any model call", () => {
    expect(validateImageDataUrl("")).not.toBeNull();
    expect(validateImageDataUrl("data:image/gif;base64,AAAA")).not.toBeNull();
    expect(validateImageDataUrl("data:image/png;base64,")).not.toBeNull();
    expect(validateImageDataUrl("data:image/png;base64," + "A".repeat(500))).toBeNull();
  });
});
