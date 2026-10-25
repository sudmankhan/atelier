import { BASELINE, PARAM_SPECS, WOODS, clampParams, type ChairParams } from "@/lib/chair/params";
import { J_BASELINE, J_FINISHES, J_PARAM_SPECS, clampJapanese, type JapaneseParams } from "@/lib/chair/japanese/params";
import { BLANK, type LabDesign } from "@/lib/lab";

export type SharedDesign = ChairParams | JapaneseParams | LabDesign;

const LAB_KEYS = ["base", "back", "joint", "wood", "seatHeight", "seatDepth", "seatWidth", "backAngle", "backHeight", "legThickness", "splay", "stretchers"] as const;
const LAB_OPTIONS = {
  base: ["four", "splayed", "sled", "zframe"], back: ["none", "slats", "spindles", "panel"],
  joint: ["mt", "dowel", "wedged", "screw"], wood: ["oak", "ash", "walnut", "pine"],
} as const;

export function parseSharedDesign(chair: string, value: unknown): SharedDesign | undefined {
  if (typeof value !== "string" || value.length > 200) return undefined;
  const parts = value.split(",");
  if (chair === "kangaroo" || chair === "japanese") {
    const base = chair === "kangaroo" ? BASELINE : J_BASELINE;
    const specs = chair === "kangaroo" ? PARAM_SPECS : J_PARAM_SPECS;
    if (parts.length !== specs.length + 1) return undefined;
    const nums = parts.slice(0, -1).map(Number);
    if (nums.some((n) => !Number.isFinite(n))) return undefined;
    const values: Record<string, number | string> = { ...base };
    specs.forEach((spec, i) => { values[spec.key] = nums[i]!; });
    if (chair === "kangaroo") {
      if (!(parts.at(-1)! in WOODS)) return undefined;
      values["wood"] = parts.at(-1)!;
      return clampParams(values as unknown as ChairParams);
    }
    if (!(parts.at(-1)! in J_FINISHES)) return undefined;
    values["finish"] = parts.at(-1)!;
    return clampJapanese(values as unknown as JapaneseParams);
  }
  if (chair !== "lab" || parts.length !== LAB_KEYS.length) return undefined;
  const d = { ...BLANK } as Record<string, string | number | boolean>;
  LAB_KEYS.forEach((key, i) => { d[key] = parts[i]!; });
  for (const key of ["base", "back", "joint", "wood"] as const) {
    if (!(LAB_OPTIONS[key] as readonly string[]).includes(String(d[key]))) return undefined;
  }
  for (const [key, min, max] of [["seatHeight", 30, 60], ["seatDepth", 30, 60], ["seatWidth", 34, 60], ["backAngle", 88, 130], ["backHeight", 15, 70], ["legThickness", 2, 5], ["splay", 0, 20]] as const) {
    const n = Number(d[key]);
    if (!Number.isFinite(n) || n < min || n > max) return undefined;
    d[key] = n;
  }
  if (d["stretchers"] !== "0" && d["stretchers"] !== "1") return undefined;
  d["stretchers"] = d["stretchers"] === "1";
  return d as unknown as LabDesign;
}

export function makeChairARLink(pageUrl: string, chair: "kangaroo" | "japanese" | "lab", design: SharedDesign): string {
  const url = new URL(pageUrl);
  let parts: (string | number)[];
  if (chair === "kangaroo") {
    const p = design as ChairParams;
    parts = [...PARAM_SPECS.map((spec) => p[spec.key]), p.wood];
  } else if (chair === "japanese") {
    const p = design as JapaneseParams;
    parts = [...J_PARAM_SPECS.map((spec) => p[spec.key]), p.finish];
  } else {
    const d = design as LabDesign;
    parts = LAB_KEYS.map((key) => key === "stretchers" ? (d.stretchers ? 1 : 0) : d[key]);
  }
  url.search = "";
  url.searchParams.set("chair", chair);
  url.searchParams.set("section", chair === "lab" ? "lab" : "design");
  url.searchParams.set("design", parts.join(","));
  url.searchParams.set("ar", "1");
  url.hash = "";
  return url.href;
}
