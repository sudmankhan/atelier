import { describe, expect, it } from "vitest";
import { BASELINE } from "@/lib/chair/params";
import { J_BASELINE } from "@/lib/chair/japanese/params";
import { BLANK } from "@/lib/lab";
import { makeChairARLink, parseSharedDesign } from "./chairARLink";

describe("chair AR handoff", () => {
  it("rebuilds each chair with the selected parts and sizes from a phone link", () => {
    const cases = [
      ["kangaroo", { ...BASELINE, seatHeight: 44, wood: "oak" }],
      ["japanese", { ...J_BASELINE, backHeight: 47, spindles: 6, finish: "keyaki" }],
      ["lab", { ...BLANK, base: "sled", back: "spindles", stretchers: true, seatWidth: 55 }],
    ] as const;
    for (const [chair, design] of cases) {
      const url = new URL(makeChairARLink("https://atelier.example/workshop?section=projects", chair, design as never));
      expect(url.searchParams.get("ar")).toBe("1");
      expect(url.searchParams.get("chair")).toBe(chair);
      expect(parseSharedDesign(chair, url.searchParams.get("design"))).toEqual(design);
    }
  });

  it("rejects invalid shared dimensions and unknown parts", () => {
    expect(parseSharedDesign("lab", "sled,unknown,screw,pine,45,40,42,100,40,3,0,0")).toBeUndefined();
    expect(parseSharedDesign("kangaroo", "NaN,54,56,112,22,0.35,teak")).toBeUndefined();
  });
});
