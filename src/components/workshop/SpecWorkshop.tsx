import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, FileJson, Layers, Shuffle } from "lucide-react";
import { StudioShell } from "@/components/three/StudioCanvas";
import { SpecModel } from "@/components/three/SpecModel";
import { RAW_FILES, type FurnitureSpec } from "@/lib/furniture/spec";
import { SAMPLE_BOARDS, specBoardFeet, specCutList, specGeometry, specIssues, specLumber, specResults } from "@/lib/furniture/engine";
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
const tone: Record<Level, string> = { good: "border-teal", warn: "border-walnut", bad: "border-alert" };
const txt: Record<Level, string> = { good: "text-teal", warn: "text-walnut", bad: "text-alert" };

/** Workshop for a piece described in a data file. Everything on this page is generated from the file. */
export function SpecWorkshop({ spec }: { spec: FurnitureSpec }) {
  const piece: PieceId = `spec:${spec.id}`;
  const [tab, setTab] = useState<Tab>("file");
  const [exploded, setExploded] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

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
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r hairline bg-sidebar px-6 pt-7">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-walnut hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> All furniture</Link>
        <div className="mt-4 font-serif text-xl tracking-tight">{spec.name}</div>
        <div className="eyebrow mt-1">Atelier · Chairs · {spec.style}</div>
        <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-teal/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal"><FileJson className="h-3 w-3" /> Made from a data file</div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{spec.description}</p>
        <dl className="mt-4 space-y-1 text-xs">
          <div className="flex justify-between"><dt className="text-muted-foreground">Wood</dt><dd>{WOODS[spec.wood].name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Joints</dt><dd>{JOINT_TYPES[spec.joint].name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Seat height</dt><dd className="font-mono">{g.seatTop} cm</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Overall height</dt><dd className="font-mono">{g.top} cm</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Parts</dt><dd className="font-mono">{spec.parts.reduce((n, p) => n + (p.sticks?.length ?? 0) + (p.boards?.length ?? 0), 0)} pieces</dd></div>
        </dl>
        {!spec.verified && <p className="mt-auto mb-5 rounded-md bg-walnut/10 p-2 text-[11px] text-walnut">Example design, not yet checked by a maker.</p>}
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <StudioShell initial="three"><SpecModel spec={spec} exploded={exploded} highlight={highlight} /></StudioShell>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
          <div className="pointer-events-auto">
            <div className="eyebrow">Chair from a data file</div>
            <h2 className="mt-1 text-2xl">{spec.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Nobody wrote code for this chair: one file goes in, everything on this page comes out.</p>
          </div>
          <div className="pointer-events-auto flex gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
            <button onClick={() => setExploded(!exploded)} aria-pressed={exploded} title="Pull the chair apart to see every piece" className={cn("flex h-9 items-center gap-2 rounded-md px-3 text-xs", exploded ? "bg-teal text-accent-foreground" : "hover:bg-secondary")}>
              <Layers className="h-3.5 w-3.5" /> Explode
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-5 left-5 text-[11px] text-muted-foreground">Drag to turn · scroll to zoom · pick a part in the cut list to light it up</div>
      </main>

      <aside className="flex w-[400px] shrink-0 flex-col border-l hairline bg-card">
        <div className="flex gap-3 border-b hairline px-5 pt-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} title={t.hint} className={cn("-mb-px border-b-2 pb-2.5 text-xs transition-colors", tab === t.id ? "border-teal text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {tab === "file" && <FileTab spec={spec} piece={piece} />}
          {tab === "tests" && <TestsTab spec={spec} />}
          {tab === "cut" && <CutTab spec={spec} highlight={highlight} onPick={setHighlight} />}
          {tab === "lumber" && <LumberTab spec={spec} />}
          {tab === "assembly" && <AssemblyTab spec={spec} />}
        </div>
      </aside>
    </div>
  );
}

function FileTab({ spec, piece }: { spec: FurnitureSpec; piece: PieceId }) {
  const file = RAW_FILES[spec.id]!;
  const issues = specIssues(spec);
  const json = useMemo(() => JSON.stringify(file.data, null, 2), [file]);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl">Made from a data file</h3>
        <p className="mt-1 text-sm text-muted-foreground">This chair is one short file listing its parts, their sizes, where they sit and the build order. The app's engine reads it and makes the 3D model, cut list, tests, lumber fit and assembly game.</p>
      </div>
      <div className="rounded-lg bg-teal/10 p-3 text-sm">
        <div className="font-medium text-teal">What this helps</div>
        <p className="mt-1 text-foreground/90">A new piece of furniture is a data file, not weeks of coding. That's how 3 chairs become 300: makers or plan sellers fill in the file, the engine does the rest, and a maker checks it before it goes live.</p>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-secondary/60 p-2"><dt className="text-muted-foreground">File</dt><dd className="mt-0.5 break-all font-mono text-[10px]">{file.path}</dd></div>
        <div className="rounded-md bg-secondary/60 p-2"><dt className="text-muted-foreground">Size</dt><dd className="mt-0.5 font-mono">{json.split("\n").length} lines · {spec.parts.length} part types</dd></div>
      </dl>
      <div className={cn("rounded-md border-l-2 bg-background p-2.5", issues.length ? "border-walnut" : "border-teal")}>
        <div className="flex items-center justify-between gap-2"><span className="font-medium">File checks</span><ProvenanceBadge kind="calculated" /></div>
        <p className="mt-0.5 text-muted-foreground">{issues.length ? issues.join(" · ") : "Every part's drawn length matches its cut length (allowing for tenons). Every build step's prerequisites exist. It has a seat and legs."}</p>
      </div>
      <p className="text-muted-foreground"><span className="text-foreground">Source:</span> {spec.source}</p>
      <details className="rounded-md border hairline" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) markMilestone(piece, "file"); }}>
        <summary className="cursor-pointer p-2.5 text-xs">Show the file</summary>
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
