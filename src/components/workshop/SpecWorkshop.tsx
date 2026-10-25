import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Download, FileJson, Layers, RotateCcw, Shuffle, Trash2, X } from "lucide-react";
import { StudioShell } from "@/components/three/StudioCanvas";
import { SpecModel } from "@/components/three/SpecModel";
import type { FurnitureSpec, PartSpec } from "@/lib/furniture/spec";
import { DIM_LABELS, SAMPLE_BOARDS, resizeSpec, specBoardFeet, specCutList, specDims, specGeometry, specIssues, specLumber, specResults, type Dims } from "@/lib/furniture/engine";
import { deleteDesign, downloadSpec, fileOf } from "@/lib/furniture/saved";
import { evaluateOps, shuffleIds } from "@/lib/assembly";
import { addTime, markMilestone, type PieceId } from "@/lib/storage/chairProgress";
import { JOINT_TYPES, WOODS, type Level } from "@/lib/lab";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { cn } from "@/lib/utils";

type Tab = "file" | "tests" | "cut" | "lumber" | "assembly";
const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "file", label: "Data file", hint: "The file this chair is built from" },
  { id: "tests", label: "Tests", hint: "Lean-back, joints, comfort: the same checks as the other chairs" },
  { id: "cut", label: "Cut list", hint: "Every piece, finished and rough size" },
  { id: "lumber", label: "Lumber", hint: "The parts fitted onto sample boards" },
  { id: "assembly", label: "Assembly", hint: "Put the build steps in order" },
];
const ROLE: Record<PartSpec["role"], string> = {
  leg: "Carries the chair to the floor.",
  post: "Back leg that rises to hold the back.",
  rail: "Frames the seat and stiffens the legs.",
  seat: "What you sit on.",
  back: "What you lean on.",
  stretcher: "Low bar between legs that stops wobble.",
};
const sizeKey = (id: string) => `atelier.size.${id}`;
function loadDims(id: string): Partial<Dims> {
  try { return JSON.parse(localStorage.getItem(sizeKey(id)) ?? "{}"); } catch { return {}; }
}
const tone: Record<Level, string> = { good: "border-teal", warn: "border-walnut", bad: "border-alert" };
const txt: Record<Level, string> = { good: "text-teal", warn: "text-walnut", bad: "text-alert" };

/** Workshop for a piece described in a data file. Everything on this page is generated from the file. */
export function SpecWorkshop({ spec: original }: { spec: FurnitureSpec }) {
  const piece: PieceId = `spec:${original.id}`;
  const [tab, setTab] = useState<Tab>("file");
  const [exploded, setExploded] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const dims = useMemo(() => specDims(original), [original]);
  const [want, setWant] = useState<Partial<Dims>>(() => loadDims(original.id));
  const spec = useMemo(() => resizeSpec(original, want), [original, want]);
  const changed = spec !== original;
  const setDim = (k: keyof Dims, v: number) => {
    const next = { ...want, [k]: v };
    setWant(next);
    try { localStorage.setItem(sizeKey(original.id), JSON.stringify(next)); } catch { /* not kept */ }
  };
  const reset = () => { setWant({}); try { localStorage.removeItem(sizeKey(original.id)); } catch { /* fine */ } };

  useEffect(() => {
    markMilestone(piece, "open");
    const t = setInterval(() => { if (document.visibilityState === "visible") addTime(piece, 10); }, 10_000);
    return () => clearInterval(t);
  }, [piece]);
  useEffect(() => {
    if (tab === "lumber") markMilestone(piece, "lumber");
    if (tab === "assembly") markMilestone(piece, "assembly");
  }, [tab, piece]);

  const g = specGeometry(spec);
  const picked = spec.parts.find((p) => p.id === highlight) ?? null;
  const pickedCut = picked ? specCutList(spec)[spec.parts.indexOf(picked)] : null;
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r hairline bg-sidebar px-6 pt-7">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-walnut hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> All furniture</Link>
        <div className="mt-4 font-serif text-xl tracking-tight">{spec.name}</div>
        <div className="eyebrow mt-1">Atelier · Chairs · {spec.style}</div>
        <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-teal/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal"><FileJson className="h-3 w-3" /> {fileOf(original).saved ? "Your design · saved as a file" : "Made from a data file"}</div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{spec.description}</p>

        <div className="mt-5 flex items-center justify-between"><div className="eyebrow">Your size</div>
          {changed && <button onClick={reset} className="flex items-center gap-1 text-[11px] text-walnut hover:underline"><RotateCcw className="h-3 w-3" /> Reset</button>}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Drag to fit the chair to you. Parts, cut list, tests and lumber all update.</p>
        <div className="mt-3 space-y-3">
          {dims.keys.map((k) => {
            const [min, max] = dims.ranges[k]!;
            const v = k === "backHeight" ? Math.round((g.top - g.seatTop) * 10) / 10 : k === "seatHeight" ? g.seatTop : k === "seatWidth" ? g.seatWidth : g.seatDepth;
            return (
              <label key={k} className="block text-xs">
                <div className="flex justify-between"><span>{DIM_LABELS[k]}</span><span className="font-mono">{v} cm</span></div>
                <input type="range" min={min} max={max} step={0.5} value={v} onChange={(e) => setDim(k, Number(e.target.value))} aria-label={DIM_LABELS[k]} className="mt-1 w-full accent-[var(--color-teal)]" />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>{min}</span><span>file: {dims.base[k]}</span><span>{max}</span></div>
              </label>
            );
          })}
        </div>

        <dl className="mt-5 space-y-1 text-xs">
          <div className="flex justify-between"><dt className="text-muted-foreground">Wood</dt><dd>{WOODS[spec.wood].name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Joints</dt><dd>{JOINT_TYPES[spec.joint].name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Overall height</dt><dd className="font-mono">{g.top} cm</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Parts</dt><dd className="font-mono">{spec.parts.reduce((n, p) => n + (p.sticks?.length ?? 0) + (p.boards?.length ?? 0), 0)} pieces</dd></div>
        </dl>
        {!spec.verified && <p className="mb-5 mt-auto rounded-md bg-walnut/10 p-2 text-[11px] text-walnut">{fileOf(original).saved ? "Your design, not yet checked by a maker." : "Example design, not yet checked by a maker."}</p>}
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <StudioShell initial="three" onMiss={() => setHighlight(null)}><SpecModel spec={spec} exploded={exploded} highlight={highlight} onPick={(id) => setHighlight(id === highlight ? null : id)} /></StudioShell>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
          <div className="pointer-events-auto">
            <div className="eyebrow">Chair from a data file</div>
            <h2 className="mt-1 text-2xl">{spec.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">No code was written for this chair: one file goes in, everything on this page comes out.</p>
          </div>
          <div className="pointer-events-auto flex gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
            <button onClick={() => setExploded(!exploded)} aria-pressed={exploded} title="Pull the chair apart to see every piece" className={cn("flex h-9 items-center gap-2 rounded-md px-3 text-xs", exploded ? "bg-teal text-accent-foreground" : "hover:bg-secondary")}>
              <Layers className="h-3.5 w-3.5" /> Explode
            </button>
          </div>
        </div>
        {picked && pickedCut ? (
          <div className="absolute bottom-5 left-5 w-72 rounded-xl border hairline bg-card/95 p-3 text-xs shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div><div className="eyebrow">{picked.role}</div><div className="mt-0.5 text-base">{picked.name} <span className="text-muted-foreground">×{pickedCut.qty}</span></div></div>
              <button aria-label="Close" onClick={() => setHighlight(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
            <p className="mt-1 text-muted-foreground">{ROLE[picked.role]}{picked.note ? ` ${picked.note}` : ""}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="rounded bg-secondary/60 p-1.5"><div className="font-sans text-muted-foreground">Finished</div>{pickedCut.finished.l} × {pickedCut.finished.w} × {pickedCut.finished.t}</div>
              <div className="rounded bg-secondary/60 p-1.5"><div className="font-sans text-muted-foreground">Rough (to buy)</div>{pickedCut.rough.l} × {pickedCut.rough.w} × {pickedCut.rough.t}</div>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute bottom-5 left-5 text-[11px] text-muted-foreground">Click any part to see what it is and its size · drag to turn · scroll to zoom</div>
        )}
      </main>

      <aside className="flex w-[400px] shrink-0 flex-col border-l hairline bg-card">
        <div className="flex gap-3 border-b hairline px-5 pt-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} title={t.hint} className={cn("-mb-px border-b-2 pb-2.5 text-xs transition-colors", tab === t.id ? "border-teal text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {tab === "file" && <FileTab original={original} sized={spec} piece={piece} />}
          {tab === "tests" && <TestsTab spec={spec} />}
          {tab === "cut" && <CutTab spec={spec} highlight={highlight} onPick={setHighlight} />}
          {tab === "lumber" && <LumberTab spec={spec} />}
          {tab === "assembly" && <AssemblyTab spec={spec} />}
        </div>
      </aside>
    </div>
  );
}

/** Shown when a link points at a saved design that isn't in this browser. */
export function MissingDesign() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-center">
      <h2 className="text-2xl">This design isn't saved in this browser</h2>
      <p className="max-w-sm text-sm text-muted-foreground">Designs from Build your own are kept in the browser they were made in. Open it there, or download its file and send it to the team to add.</p>
      <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">All furniture</Link>
    </div>
  );
}

function FileTab({ original, sized, piece }: { original: FurnitureSpec; sized: FurnitureSpec; piece: PieceId }) {
  const navigate = useNavigate();
  const file = fileOf(original);
  const issues = specIssues(sized);
  const json = useMemo(() => JSON.stringify(file.data, null, 2), [file.data]);
  const changed = sized !== original;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl">Made from a data file</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {file.saved
            ? "You made this chair in Build your own. When you pressed Save, the app wrote this file for you: every part, its size, where it sits, and the build order."
            : "This chair is one file listing its parts, their sizes, where they sit and the build order."}{" "}
          The app reads the file and makes the 3D model, cut list, tests, lumber fit and assembly game. The sliders stretch it to your size.
        </p>
      </div>
      <div className="rounded-lg bg-teal/10 p-3 text-sm">
        <div className="font-medium text-teal">What this helps</div>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-foreground/90">
          <li><span className="font-medium">Makers:</span> pick a chair, drag it to your size, and get the cut list, lumber and safety checks for <em>your</em> version.</li>
          <li><span className="font-medium">Designers:</span> design in Build your own, press Save, and it becomes a full chair page like this one. No code.</li>
          <li><span className="font-medium">Atelier:</span> a new chair is a saved file, not weeks of coding. That's how 3 chairs become 300.</li>
        </ul>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-secondary/60 p-2"><dt className="text-muted-foreground">File</dt><dd className="mt-0.5 break-all font-mono text-[10px]">{file.path}</dd></div>
        <div className="rounded-md bg-secondary/60 p-2"><dt className="text-muted-foreground">Size</dt><dd className="mt-0.5 font-mono">{json.split("\n").length} lines · {original.parts.length} part types</dd></div>
      </dl>
      <div className={cn("rounded-md border-l-2 bg-background p-2.5", issues.length ? "border-walnut" : "border-teal")}>
        <div className="flex items-center justify-between gap-2"><span className="font-medium">File checks{changed ? " (at your size)" : ""}</span><ProvenanceBadge kind="calculated" /></div>
        <p className="mt-0.5 text-muted-foreground">{issues.length ? issues.join(" · ") : "Every part's drawn length matches its cut length (allowing for tenons). Every build step's prerequisites exist. It has a seat and legs."}</p>
      </div>
      <p className="text-muted-foreground"><span className="text-foreground">Source:</span> {original.source}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => downloadSpec(sized)} className="flex items-center gap-1.5 rounded-md border hairline px-3 py-1.5 hover:bg-secondary"><Download className="h-3.5 w-3.5" /> Download file{changed ? " at your size" : ""}</button>
        {file.saved && (
          <button onClick={() => { deleteDesign(original.id); navigate({ to: "/" }); }} className="flex items-center gap-1.5 rounded-md border border-alert/40 px-3 py-1.5 text-alert hover:bg-alert/10"><Trash2 className="h-3.5 w-3.5" /> Delete design</button>
        )}
      </div>
      <details className="rounded-md border hairline" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) markMilestone(piece, "file"); }}>
        <summary className="cursor-pointer p-2.5 text-xs">Show the file (for developers)</summary>
        <pre className="max-h-[50vh] overflow-auto border-t hairline bg-background p-3 font-mono text-[10px] leading-snug">{json}</pre>
      </details>
    </div>
  );
}

function TestsTab({ spec }: { spec: FurnitureSpec }) {
  const [knee, setKnee] = useState<number | "">("");
  const results = specResults(spec, knee === "" ? {} : { poplitealHeight: knee });
  const counts = { good: 0, warn: 0, bad: 0 };
  for (const r of results) counts[r.level]++;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-2xl">Tests</h3>
        <p className="mt-1 text-muted-foreground">The same physics as the other chairs: the lean-back test uses this file's own parts, weight and feet; joints, parts and comfort use the Build-your-own rules.</p>
        <p className="mt-2 font-mono"><span className="text-teal">{counts.good} good</span> · <span className="text-walnut">{counts.warn} to watch</span> · <span className="text-alert">{counts.bad} problem{counts.bad === 1 ? "" : "s"}</span></p>
      </div>
      {results.map((r, i) => (
        <div key={i} className={cn("rounded-md border-l-2 bg-background p-2.5", tone[r.level])}>
          <div className="flex items-center justify-between gap-2"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.area}</div><ProvenanceBadge kind={r.basis} topic="lab" /></div>
          <div className={cn("text-sm", txt[r.level])}>{r.title}</div>
          <div className="mt-0.5 text-muted-foreground">{r.detail}</div>
        </div>
      ))}
      <label className="block">
        <span>Your knee height (optional, cm) <span className="text-muted-foreground">— checks the seat height fits your legs</span></span>
        <input type="number" min={30} max={65} value={knee} onChange={(e) => setKnee(e.target.value === "" ? "" : +e.target.value)} className="mt-1 w-full rounded border hairline bg-background px-2 py-1" />
      </label>
    </div>
  );
}

function CutTab({ spec, highlight, onPick }: { spec: FurnitureSpec; highlight: string | null; onPick: (id: string | null) => void }) {
  const cuts = specCutList(spec);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2"><h3 className="text-2xl">Cut list</h3><ProvenanceBadge kind="calculated" topic="shop" /></div>
      <p className="text-muted-foreground">cm, length × width × thickness. Rough adds 2.5 cm length and 0.6 cm width and thickness for planing. About <span className="font-mono text-foreground">{specBoardFeet(spec)} board feet</span> of rough timber. Click a part to light it up.</p>
      <table className="w-full border-collapse">
        <thead><tr className="text-left text-[10px] text-measure"><th className="pb-1 font-normal">Part</th><th className="pb-1 pr-2 font-normal">Qty</th><th className="pb-1 font-normal">Finished</th><th className="pb-1 font-normal">Rough</th></tr></thead>
        <tbody>
          {cuts.map((c, i) => {
            const id = spec.parts[i]!.id;
            return (
              <tr key={c.part} onClick={() => onPick(highlight === id ? null : id)} className={cn("cursor-pointer border-t hairline align-top hover:bg-secondary/50", highlight === id && "bg-teal-soft")}>
                <td className="py-1.5 pr-2">{c.part}{c.note && <div className="text-[10px] text-muted-foreground">{c.note}</div>}</td>
                <td className="py-1.5 pr-2 font-mono">{c.qty}</td>
                <td className="whitespace-nowrap py-1.5 pr-2 font-mono text-[10px]">{c.finished.l} × {c.finished.w} × {c.finished.t}</td>
                <td className="whitespace-nowrap py-1.5 font-mono text-[10px] text-muted-foreground">{c.rough.l} × {c.rough.w} × {c.rough.t}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LumberTab({ spec }: { spec: FurnitureSpec }) {
  const alloc = specLumber(spec);
  const cuts = specCutList(spec);
  const colours = ["fill-teal/50 stroke-teal", "fill-walnut/50 stroke-walnut", "fill-measure/40 stroke-measure", "fill-alert/30 stroke-alert", "fill-primary/30 stroke-primary"];
  const colourOf = new Map(cuts.map((c, i) => [c.part, colours[i % colours.length]!]));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2"><h3 className="text-2xl">Lumber</h3><ProvenanceBadge kind="calculated" topic="lumber" /></div>
      <p className="text-muted-foreground">Every rough piece packed onto two sample boards, with 0.3 cm lost per saw cut and the grain along each part. Same packing engine as the other chairs.</p>
      {SAMPLE_BOARDS.map((b) => {
        const W = 340, s = W / b.l, H = Math.max(16, b.w * s);
        const u = alloc.boards.find((x) => x.boardId === b.id);
        return (
          <div key={b.id}>
            <div className="font-mono text-[10px]">{b.id} · {b.l} × {b.w} × {b.t} cm · grain 1 in {b.grainSlope}</div>
            <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full">
              <rect width={W} height={H} className="fill-secondary stroke-border" />
              {alloc.placements.filter((p) => p.boardId === b.id).map((p) => (
                <rect key={p.pieceId} x={p.x * s} y={p.y * s} width={p.l * s} height={p.w * s} className={colourOf.get(p.part)} strokeWidth={1}><title>{p.pieceId}</title></rect>
              ))}
            </svg>
            {u && <div className="text-[10px] text-muted-foreground">Used {Math.round((u.usedArea / u.totalArea) * 100)}% of the board face</div>}
          </div>
        );
      })}
      <div className="space-y-1.5">
        {cuts.map((c) => {
          const placed = alloc.placements.filter((p) => p.part === c.part).length;
          const un = alloc.unallocated.filter((x) => x.part === c.part);
          return (
            <div key={c.part} className={cn("flex justify-between rounded-md border-l-2 bg-secondary/40 px-2 py-1.5", un.length ? "border-alert" : "border-teal")}>
              <span>{c.part} <span className="text-muted-foreground">×{c.qty}</span>{un.length > 0 && <span className="text-alert"> · {[...new Set(un.map((x) => x.reason))].join(", ")}</span>}</span>
              <span className={cn("font-mono text-[10px]", un.length ? "text-alert" : "text-teal")}>{placed}/{c.qty} placed</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssemblyTab({ spec }: { spec: FurnitureSpec }) {
  const [order, setOrder] = useState(() => shuffleIds(spec.steps.map((s) => s.id)));
  const [checked, setChecked] = useState(false);
  const errs = evaluateOps(spec.steps, order);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const a = [...order];
    [a[i], a[j]] = [a[j]!, a[i]!];
    setOrder(a);
    setChecked(false);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h3 className="text-2xl">Assembly order</h3>
        <button onClick={() => { setOrder(shuffleIds(spec.steps.map((s) => s.id))); setChecked(false); }} className="flex items-center gap-1 rounded-md border hairline px-2.5 py-1"><Shuffle className="h-3 w-3" /> Shuffle</button>
      </div>
      <p className="text-muted-foreground">The steps come from the data file. Put them in order, then check: every step placed before something it needs is explained.</p>
      <ol className="space-y-1">
        {order.map((id, i) => {
          const s = spec.steps.find((x) => x.id === id)!;
          const bad = checked && errs.some((e) => e.opId === id);
          return (
            <li key={id} className={cn("flex items-center gap-2 rounded-md border hairline px-2 py-1.5", bad && "border-alert")}>
              <span className="w-4 font-mono text-muted-foreground">{i + 1}</span>
              <span className="flex-1">{s.label}</span>
              <button aria-label="Move up" onClick={() => move(i, -1)} className="p-0.5 text-muted-foreground hover:text-foreground"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="p-0.5 text-muted-foreground hover:text-foreground"><ArrowDown className="h-3.5 w-3.5" /></button>
            </li>
          );
        })}
      </ol>
      <button onClick={() => setChecked(true)} className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">Check my order</button>
      {checked && (errs.length === 0
        ? <p className="text-teal">That order works: every step comes after what it needs.</p>
        : <ul className="space-y-1.5">{errs.map((e, i) => <li key={i} className="rounded-md bg-alert/10 p-2"><span className="font-medium text-alert">{e.label}</span> before <span className="font-medium">{e.missing}</span>: {e.why}</li>)}</ul>)}
    </div>
  );
}
