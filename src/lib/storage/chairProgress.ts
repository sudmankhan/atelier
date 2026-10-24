// Per-chair progress: which milestones a visitor has reached and how long they've spent.
// Lives in this browser's localStorage only. Every access is guarded so private mode etc. just reads as "not started".

export type ChairId = "kangaroo" | "japanese" | "lab";
export const CHAIR_IDS: ChairId[] = ["kangaroo", "japanese", "lab"];

export const MILESTONES: Record<ChairId, { id: string; label: string }[]> = {
  kangaroo: [
    { id: "learn", label: "Took the guided tour" },
    { id: "change", label: "Changed the design" },
    { id: "weak", label: "Checked the weak spots" },
    { id: "assembly", label: "Practised the assembly order" },
    { id: "shop", label: "Opened the cut list" },
  ],
  japanese: [
    { id: "change", label: "Changed the design" },
    { id: "weak", label: "Checked the weak spots" },
    { id: "assembly", label: "Practised the assembly order" },
    { id: "shop", label: "Opened the cut list" },
  ],
  lab: [
    { id: "pick", label: "Picked your parts" },
    { id: "test", label: "Tested your chair" },
    { id: "math", label: "Looked at the math" },
  ],
};

interface Rec {
  seconds: number;
  done: string[];
}

const key = (id: ChairId) => `atelier.chair.${id}`;

function read(id: ChairId): Rec {
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return { seconds: 0, done: [] };
    const r = JSON.parse(raw) as Partial<Rec>;
    return { seconds: Number(r.seconds) || 0, done: Array.isArray(r.done) ? r.done.filter((x) => typeof x === "string") : [] };
  } catch {
    return { seconds: 0, done: [] };
  }
}

function write(id: ChairId, r: Rec) {
  try {
    localStorage.setItem(key(id), JSON.stringify(r));
  } catch {
    /* storage unavailable: progress simply isn't kept */
  }
}

export function markMilestone(id: ChairId, milestone: string) {
  if (!MILESTONES[id].some((m) => m.id === milestone)) return;
  const r = read(id);
  if (!r.done.includes(milestone)) write(id, { ...r, done: [...r.done, milestone] });
}

export function addTime(id: ChairId, seconds: number) {
  const r = read(id);
  write(id, { ...r, seconds: r.seconds + seconds });
}

export function chairSummary(id: ChairId) {
  const r = read(id);
  const all = MILESTONES[id];
  const done = all.filter((m) => r.done.includes(m.id));
  return { pct: Math.round((done.length / all.length) * 100), seconds: r.seconds, done, next: all.find((m) => !r.done.includes(m.id)) ?? null };
}

export function formatTime(seconds: number) {
  if (seconds < 60) return seconds > 0 ? "under a minute" : "not started";
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
