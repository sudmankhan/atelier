import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2 } from "lucide-react";
import { japaneseShop, kangarooShop } from "@/lib/chair/shop";
import { KERF, partIdFor, RUNOUT_LIMIT, type Board } from "@/lib/chair/stock";
import { allocate, type Allocation, type StockBoard } from "@/lib/chair/allocate";
import { Plus, X } from "lucide-react";
import { inspectLumber, type LumberReport } from "@/lib/lumber.functions";
import { GRAIN_LOOK_TEXT } from "@/lib/lumberReport";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { useWorkshop, type AnyPartId } from "./store";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; b: Board }[] = [
  { label: "8/4 straight walnut · 120 cm", b: { l: 120, w: 18, t: 5.1, grainSlope: 25 } },
  { label: "4/4 oak offcut, 1:7 runout", b: { l: 70, w: 15, t: 2.6, grainSlope: 7 } },
  { label: "Wide pine plank · 90 cm", b: { l: 90, w: 30, t: 4.5, grainSlope: null } },
];
const PALETTE = ["fill-teal/50 stroke-teal", "fill-walnut/50 stroke-walnut", "fill-measure/40 stroke-measure", "fill-alert/30 stroke-alert", "fill-primary/30 stroke-primary", "fill-muted-foreground/30 stroke-muted-foreground"];
const SWATCH = ["bg-teal/60", "bg-walnut/60", "bg-measure/50", "bg-alert/40", "bg-primary/40", "bg-muted-foreground/40"];

async function shrink(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const s = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

// Board inventory outlives tab switches (the Bench unmounts inactive tabs).
const keep: { boards: StockBoard[]; sel: string; nextId: number } = { boards: [{ id: "B1", ...PRESETS[0]!.b }], sel: "B1", nextId: 2 };

export function LumberStudio() {
  const w = useWorkshop();
  const [boards, setBoards] = useState<StockBoard[]>(keep.boards);
  const [sel, setSel] = useState(keep.sel);
  const [photo, setPhoto] = useState<string | null>(null);
  const [report, setReport] = useState<LumberReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextId, setNextId] = useState(keep.nextId);
  keep.boards = boards; keep.sel = sel; keep.nextId = nextId;
  const fileRef = useRef<HTMLInputElement>(null);
  const inspect = useServerFn(inspectLumber);

  const cuts = useMemo(
    () => (w.typology === "kangaroo" ? kangarooShop(w.params as ChairParams) : japaneseShop(w.params as JapaneseParams)).cuts,
    [w.typology, w.params],
  );
  const alloc = useMemo(() => allocate(boards, cuts), [boards, cuts]);
  const colorOf = useMemo(() => new Map(cuts.map((c, i) => [c.part, i % PALETTE.length])), [cuts]);
  const b = boards.find((x) => x.id === sel) ?? boards[0]!;
  const set = (k: keyof Board, v: number | null) => setBoards((bs) => bs.map((x) => (x.id === b.id ? { ...x, [k]: v } : x)));
  const addBoard = (pb: Board) => { const id = `B${nextId}`; setNextId(nextId + 1); setBoards((bs) => [...bs, { id, ...pb }]); setSel(id); setReport(null); setPhoto(null); };
  const removeBoard = (id: string) => { if (boards.length < 2) return; const rest = boards.filter((x) => x.id !== id); setBoards(rest); if (sel === id) setSel(rest[0]!.id); };

  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(null); setReport(null);
    if (f.size === 0) { setErr("That file is empty — choose a photo of your board."); return; }
    const url = await shrink(f).catch(() => null);
    if (!url) { setErr("That file couldn't be opened as an image. Try a JPEG, PNG or WebP photo."); return; }
    setPhoto(url); setBusy(true);
    const r = await inspect({ data: { image: url, board: { l: b.l, w: b.w, t: b.t }, typology: w.typology, parts: cuts.map((c) => c.part) } }).catch(() => null);
    setBusy(false);
    if (!r || !r.ok) { setErr(r?.error ?? "Couldn't inspect the photo."); return; }
    setReport(r.report);
  }

  function pick(part: string) {
    const id = partIdFor(part, w.typology);
    if (id) w.select(id as AnyPartId);
  }

  const perPart = cuts.map((c) => {
    const placed = alloc.placements.filter((p) => p.part === c.part);
    const un = alloc.unallocated.filter((u) => u.part === c.part);
    const warn = placed.some((p) => p.warning);
    return { c, placed, un, warn };
  });

  return (
    <div className="space-y-5 p-5 text-xs">
      <div>
        <div className="eyebrow">Your boards</div>
        <p className="mt-1 text-muted-foreground">Enter the rough boards you actually have. Every piece of this chair gets its own spot across all of them — no wood is promised twice.</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {boards.map((x) => (
            <span key={x.id} className={cn("flex items-center gap-1 rounded-full border hairline px-2 py-0.5 text-[10px]", x.id === b.id && "bg-secondary")}>
              <button onClick={() => setSel(x.id)} className="font-mono">{x.id} · {x.l}×{x.w}×{x.t}</button>
              {boards.length > 1 && <button aria-label={`Remove ${x.id}`} onClick={() => removeBoard(x.id)}><X className="h-3 w-3" /></button>}
            </span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => addBoard(p.b)} className="flex items-center gap-0.5 rounded-full border hairline px-2 py-0.5 text-[10px] hover:bg-secondary"><Plus className="h-3 w-3" />{p.label}</button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {([["l", "Length"], ["w", "Width"], ["t", "Thick"]] as const).map(([k, lab]) => (
            <label key={k} className="block">
              <span className="text-[10px] text-measure">{b.id} {lab} cm</span>
              <input type="number" min={0.1} step={0.1} value={b[k]} onChange={(e) => set(k, Math.max(0, Number(e.target.value)))} className="mt-0.5 w-full rounded border hairline bg-background px-1.5 py-1 font-mono" />
            </label>
          ))}
          <label className="block">
            <span className="text-[10px] text-measure">Grain 1 in</span>
            <input type="number" min={1} placeholder="?" value={b.grainSlope ?? ""} onChange={(e) => set("grainSlope", e.target.value ? Math.max(1, Number(e.target.value)) : null)} className="mt-0.5 w-full rounded border hairline bg-background px-1.5 py-1 font-mono" />
          </label>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Grain slope: how far the fibres drift across the board — 1 in 20 is straight; steeper than 1 in {RUNOUT_LIMIT} is too weak for legs and posts. Leave blank if unknown.</p>
      </div>

      <div className="rounded-md border hairline p-3">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Photo inspection (AI) · {b.id}</div>
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center gap-1 rounded-md bg-teal px-2 py-1 text-[11px] text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />} {photo ? "New photo" : "Upload board photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        {photo && <img src={photo} alt="Your board" className="mt-2 max-h-32 w-full rounded object-cover" />}
        {busy && <p className="mt-2 text-muted-foreground">Reading the grain…</p>}
        {err && <p className="mt-2 text-alert">{err}</p>}
        {report && report.kind === "abstain" && (
          <div className="mt-2 space-y-1.5">
            <div className="font-medium text-walnut">No reading — {report.suitability === "synthetic_or_non_wood" ? "this doesn't look like a real wood surface" : report.suitability === "insufficient_detail" ? "not enough visible detail" : "the image is ambiguous"}.</div>
            <p className="text-muted-foreground">{report.reason}</p>
            <ul className="list-disc pl-4 text-muted-foreground">{report.photoTips.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="text-[10px] text-muted-foreground">No grain estimate or part advice is given for unclear images. The board's grain setting was not changed.</p>
          </div>
        )}
        {report && report.kind === "usable" && (
          <div className="mt-2 space-y-1.5">
            <div><span className="font-medium">{report.species}</span> · {report.cut} · grain {report.grain ? GRAIN_LOOK_TEXT[report.grain] : "unclear"} <span className="text-muted-foreground">(model says "{report.modelConfidence}" — not a measured probability)</span></div>
            {report.defects.length > 0 && <div className="text-walnut">Defects: {report.defects.join(", ")}</div>}
            {report.bestFor.length > 0 && <div className="text-teal">Good for: {report.bestFor.join(", ")}</div>}
            {report.avoidFor.length > 0 && <div className="text-alert">Avoid for: {report.avoidFor.join(", ")}</div>}
            <p className="text-muted-foreground">{report.advice}</p>
            <p className="text-[10px] text-muted-foreground">Judged from a photo by an AI that can be wrong. It never changes the board's grain setting: measure the slope yourself (scribe a line along a split or a pore line) and type it in above.</p>
          </div>
        )}
        {!photo && <p className="mt-1 text-muted-foreground">Optional: snap the selected board's face in good light. You get a species guess, visible defects and a rough grain impression — advice only, never a number fed into the layout.</p>}
      </div>

      <div>
        <div className="eyebrow">Shared cutting layout</div>
        <p className="mt-1 text-[10px] text-muted-foreground">Heuristic layout (best-fit), not a guaranteed optimum. Conceptual cutting layout, not a guaranteed saw-cut sequence — some layouts may need non-through cuts.</p>
        <div className="mt-2 space-y-3">
          {boards.map((bd) => <BoardLayout key={bd.id} b={bd} a={alloc} colorOf={colorOf} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {cuts.map((c) => <span key={c.part} className="flex items-center gap-1 text-[10px]"><span className={cn("h-2 w-2 rounded-sm", SWATCH[colorOf.get(c.part)!])} />{c.part}</span>)}
        </div>
      </div>

      <div>
        <div className="eyebrow">Parts</div>
        <div className="mt-2 space-y-2">
          {perPart.map(({ c, placed, un, warn }) => (
            <button key={c.part} onClick={() => pick(c.part)} className={cn("block w-full rounded-md border-l-2 bg-secondary/40 p-2 text-left", un.length ? "border-alert" : warn ? "border-walnut" : "border-teal")}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.part} <span className="text-muted-foreground">×{c.qty}</span></span>
                <span className={cn("font-mono text-[10px]", un.length ? "text-alert" : warn ? "text-walnut" : "text-teal")}>{placed.length}/{c.qty} placed</span>
              </div>
              <p className="mt-0.5 text-muted-foreground">
                {placed.length > 0 && `On ${[...new Set(placed.map((p) => p.boardId))].join(", ")}${placed.some((p) => p.rotated) ? " (some turned on edge)" : ""}. `}
                {un.length > 0 && `Not allocated: ${un.length} — ${[...new Set(un.map((u) => u.reason))].join(", ")}. `}
                {warn && "Grain slope unknown: check runout before trusting it structurally."}
              </p>
            </button>
          ))}
        </div>
        {alloc.unallocated.length > 0 && <p className="mt-2 text-alert">Unallocated pieces: {alloc.unallocated.map((u) => `${u.pieceId} (${u.reason})`).join(", ")}</p>}
        <p className="mt-2 text-[10px] text-muted-foreground">Tap a part to light it up on the chair. Includes {KERF} cm saw kerf and rough-milling allowance; no resawing. Nest curved parts on a full-size template.</p>
      </div>
    </div>
  );
}

function BoardLayout({ b, a, colorOf }: { b: StockBoard; a: Allocation; colorOf: Map<string, number> }) {
  const u = a.boards.find((x) => x.boardId === b.id);
  if (!u) return <p className="text-alert">{b.id}: invalid dimensions — ignored.</p>;
  const W = 300, s = W / b.l, H = Math.max(16, b.w * s);
  const pl = a.placements.filter((p) => p.boardId === b.id);
  const pct = (n: number) => `${((n / u.totalArea) * 100).toFixed(0)}%`;
  return (
    <div>
      <div className="font-mono text-[10px]">{b.id} · {b.l}×{b.w}×{b.t} cm · grain {b.grainSlope ? `1 in ${b.grainSlope}` : "unknown"}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full">
        <rect width={W} height={H} className="fill-secondary stroke-border" />
        {pl.map((p) => (
          <g key={p.pieceId}>
            <rect x={p.x * s} y={p.y * s} width={p.l * s} height={p.w * s} className={PALETTE[colorOf.get(p.part) ?? 0]} strokeWidth={1} />
            {p.w * s > 7 && <text x={p.x * s + 2} y={p.y * s + Math.min(p.w * s - 2, 8)} fontSize={6} className="fill-foreground">{p.pieceId}{p.rotated ? " ⟲" : ""}{p.warning ? " !" : ""}</text>}
          </g>
        ))}
      </svg>
      <div className="text-[10px] text-muted-foreground">Used {u.usedArea.toFixed(0)} cm² ({pct(u.usedArea)}) · kerf ≈{u.kerfArea.toFixed(0)} cm² · remaining {u.remainingArea.toFixed(0)} cm² ({pct(u.remainingArea)})</div>
    </div>
  );
}
