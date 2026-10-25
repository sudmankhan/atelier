import { describe, expect, it } from "vitest";
import { arSearch, makeARLink, parseARDims } from "./arLink";
import { resizeSpec } from "./engine";
import { specById } from "./spec";

describe("AR handoff", () => {
  it("shares the selected size and opens AR on the receiving device", () => {
    const spec = resizeSpec(specById("nordic-ladder-back")!, { seatHeight: 50, seatWidth: 48 });
    const url = new URL(makeARLink("https://atelier.example/workshop?section=design", spec));
    expect(url.searchParams.get("chair")).toBe("spec:nordic-ladder-back");
    expect(arSearch(Object.fromEntries(url.searchParams))).toMatchObject({
      ar: 1,
      dims: "50,48,40,43",
    });
    expect(parseARDims(url.searchParams.get("dims"))).toEqual({
      seatHeight: 50,
      seatWidth: 48,
      seatDepth: 40,
      backHeight: 43,
    });
  });

  it("rejects malformed or non-finite dimensions", () => {
    expect(parseARDims("45,42,40,Infinity")).toBeUndefined();
    expect(parseARDims("45,42,40")).toBeUndefined();
    expect(parseARDims("0,42,40,43")).toBeUndefined();
  });
});
