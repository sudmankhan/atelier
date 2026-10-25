import { specDims, type Dims } from "./engine";
import type { FurnitureSpec } from "./spec";

export const DIM_KEYS = ["seatHeight", "seatWidth", "seatDepth", "backHeight"] as const;

/** Untrusted URL input: reject partial, empty, infinite and non-numeric dimensions. */
export function parseARDims(value: unknown): Dims | undefined {
  if (typeof value !== "string" || value.length > 100) return undefined;
  const parts = value.split(",");
  if (parts.length !== 4 || parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part.trim())))
    return undefined;
  const [seatHeight, seatWidth, seatDepth, backHeight] = parts.map(Number);
  if (
    ![seatHeight, seatWidth, seatDepth, backHeight].every(Number.isFinite) ||
    seatHeight <= 0 ||
    seatWidth <= 0 ||
    seatDepth <= 0 ||
    backHeight < 0
  )
    return undefined;
  return { seatHeight, seatWidth, seatDepth, backHeight };
}

export function arSearch(search: Record<string, unknown>): { dims?: string; ar?: 1 } {
  const parsed = parseARDims(search["dims"]);
  return {
    dims: parsed ? DIM_KEYS.map((key) => parsed[key]).join(",") : undefined,
    ar: search["ar"] === 1 || search["ar"] === "1" ? 1 : undefined,
  };
}

/** Share the spec identity and actual clamped sizes, never a browser-local blob URL. */
export function makeARLink(pageUrl: string, resized: FurnitureSpec): string {
  const url = new URL(pageUrl);
  const { base } = specDims(resized);
  url.searchParams.set("chair", `spec:${resized.id}`);
  url.searchParams.set("dims", DIM_KEYS.map((key) => base[key]).join(","));
  url.searchParams.set("ar", "1");
  url.hash = "";
  return url.href;
}

/** Scene Viewer is a separate native app and cannot read browser-scoped blobs. */
export function arModesForSource(src: string): string {
  const modes = ["webxr", "quick-look", "scene-viewer"];
  return modes.filter((mode) => mode !== "scene-viewer" || !src.startsWith("blob:")).join(" ");
}
