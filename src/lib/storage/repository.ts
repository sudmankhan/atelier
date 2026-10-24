// Persistence boundary. The localStorage implementation is the prototype;
// a cloud implementation can satisfy the same interface later.
import type { ChairParams, Typology } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";

export type AnyParams = ChairParams | JapaneseParams;

export interface SavedDesign {
  id: string;
  name: string;
  typology: Typology;
  params: AnyParams;
  savedAt: string;
}

export interface Progress {
  buildCompleted: number[];
  buildStep: number;
  walkStep: number;
  walkDone: boolean;
  quiz: Record<number, boolean>;
}

export const EMPTY_PROGRESS: Progress = { buildCompleted: [], buildStep: 0, walkStep: 0, walkDone: false, quiz: {} };

export interface StudioRepository {
  listDesigns(): SavedDesign[];
  saveDesign(name: string, typology: Typology, params: AnyParams): SavedDesign;
  deleteDesign(id: string): void;
  getDraft(typology: Typology): AnyParams | null;
  setDraft(typology: Typology, p: AnyParams): void;
  getProgress(): Progress;
  setProgress(p: Progress): void;
}

const K = { designs: "fg.designs", draftK: "fg.draft", draftJ: "fg.draft.japanese", progress: "fg.progress" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage full or unavailable */
  }
};

export const localRepository: StudioRepository = {
  listDesigns: () =>
    read<SavedDesign[]>(K.designs, []).map((d) => ({ ...d, typology: d.typology ?? "kangaroo" })),
  saveDesign(name, typology, params) {
    const d: SavedDesign = { id: crypto.randomUUID(), name: name || "Untitled study", typology, params, savedAt: new Date().toISOString() };
    write(K.designs, [d, ...this.listDesigns()]);
    return d;
  },
  deleteDesign(id) {
    write(K.designs, this.listDesigns().filter((d) => d.id !== id));
  },
  getDraft: (typology) => read<AnyParams | null>(typology === "kangaroo" ? K.draftK : K.draftJ, null),
  setDraft: (typology, p) => write(typology === "kangaroo" ? K.draftK : K.draftJ, p),
  getProgress: () => ({ ...EMPTY_PROGRESS, ...read<Partial<Progress>>(K.progress, {}) }),
  setProgress: (p) => write(K.progress, p),
};
