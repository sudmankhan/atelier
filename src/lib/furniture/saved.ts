// Designs people save from Build your own. They live in this browser (localStorage), in exactly the
// same file format as the built-in pieces, and can be downloaded as a .json file to share.
import { FurnitureSchema, RAW_FILES, specById, type FurnitureSpec } from "./spec";

const KEY = "atelier.designs";

export function loadSaved(): FurnitureSpec[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((r) => {
      const p = FurnitureSchema.safeParse(r);
      return p.success ? [p.data] : [];
    });
  } catch {
    return [];
  }
}

function write(list: FurnitureSpec[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("atelier-designs"));
  } catch {
    /* storage full or blocked: the design just isn't kept */
  }
}

export function saveDesign(s: FurnitureSpec) {
  write([...loadSaved().filter((x) => x.id !== s.id), s]);
}

export function deleteDesign(id: string) {
  write(loadSaved().filter((x) => x.id !== id));
}

/** A built-in piece or a saved design. */
export function findSpec(id: string): FurnitureSpec | null {
  return specById(id) ?? (typeof window === "undefined" ? null : loadSaved().find((s) => s.id === id) ?? null);
}

export const isSaved = (id: string) => !RAW_FILES[id];

/** Where the file lives and what it says, for the "Data file" tab. */
export function fileOf(s: FurnitureSpec): { path: string; data: unknown; saved: boolean } {
  const f = RAW_FILES[s.id];
  return f ? { ...f, saved: false } : { path: "Saved in this browser", data: s, saved: true };
}

export function downloadSpec(s: FurnitureSpec) {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${s.id}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
