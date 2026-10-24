import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPLAINERS, explainerById } from "./explainers";

describe("explainers", () => {
  it("every badge topic used in the UI has an explainer", () => {
    const dir = join(__dirname, "../components/workshop");
    const topics = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(/topic="([a-z]+)"/g)].map((m) => m[1]!));
    expect(topics.length).toBeGreaterThan(5);
    for (const t of topics) expect(explainerById(t), t).toBeDefined();
  });
  it("every explainer has physics, a source for each value, and stated limits", () => {
    for (const e of EXPLAINERS) {
      expect(e.physics.length, e.id).toBeGreaterThan(0);
      expect(e.limits.length, e.id).toBeGreaterThan(10);
      for (const v of e.values) expect(v.source.length, `${e.id}/${v.name}`).toBeGreaterThan(0);
    }
  });
});

describe("product guide", () => {
  it("docs/PRODUCT_GUIDE.md covers every explainer", () => {
    const guide = readFileSync(join(__dirname, "../../docs/PRODUCT_GUIDE.md"), "utf8");
    for (const e of EXPLAINERS) expect(guide, e.title).toContain(`### ${e.title}`);
  });
});
