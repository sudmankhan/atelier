import { useMemo, useState } from "react";
import { Download, Printer, Scissors } from "lucide-react";
import { PAPER, fullSvg, inkedTiles, printHtml, templatesFor, tilePages, type Paper, type Template } from "@/lib/chair/templates";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { useWorkshop } from "./store";
import { cn } from "@/lib/utils";
import { ProvenanceBadge } from "./ProvenanceBadge";

const CHAIR_NAME = { kangaroo: "Kangaroo lounge chair", japanese: "Kuro spindle-back" } as const;

function printPages(ts: Template[], paper: Paper, name: string) {
  const { html } = printHtml(ts, paper, name);
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const doc = f.contentWindow?.document;
  if (!doc) return;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); setTimeout(() => f.remove(), 1500); }, 300);
}

function download(t: Template, name: string) {
  const blob = new Blob([fullSvg(t)], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${t.id}-full-size.svg`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** Real-size templates for the current design: preview with the page grid, print, download. */
export function Templates() {
  const w = useWorkshop();
  const [paper, setPaper] = useState<Paper>("letter");
  const ts = useMemo(() => templatesFor(w.typology, w.params as ChairParams | JapaneseParams), [w.typology, w.params]);
  const [sel, setSel] = useState(0);
  const t = ts[Math.min(sel, ts.length - 1)]!;
  const grid = tilePages(t.widthCm, t.heightCm, paper);
  const used = inkedTiles(t, grid.tiles);
  const all = ts.reduce((n, x) => n + inkedTiles(x, tilePages(x.widthCm, x.heightCm, paper).tiles).length, 0);
  const name = CHAIR_NAME[w.typology];

  return (
    <div className="min-w-0 flex-1 overflow-y-auto paper">
      <div className="mx-auto max-w-5xl px-10 py-10">
        <div className="eyebrow">Templates</div>
        <h1 className="mt-2 text-4xl leading-tight">Real-size shapes to trace onto wood</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every shape below is drawn at its real size from your current design, the same geometry as the 3D chair. Change a slider and the templates change with it.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border hairline bg-card p-4 text-sm">
            <div className="eyebrow mb-2">How you'd use this</div>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Print the pages at <span className="text-foreground">100% / actual size</span> (not "fit to page").</li>
              <li>Measure the 10 cm line on any page to check the printer didn't shrink it.</li>
              <li>Line up the small crosses where pages overlap and tape them into one sheet.</li>
              <li>Lay it on the board, trace around it, and cut. Drill the marked holes through the paper.</li>
              <li>Use the angle cards to set the drill, saw and bevel gauge.</li>
            </ol>
          </div>
          <div className="rounded-xl border hairline bg-card p-4 text-sm">
            <div className="eyebrow mb-2">What this saves</div>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>No full-size drawing by hand: woodworkers normally spend hours laying out curves and joint angles before the first cut.</li>
              <li>Fewer wrong cuts: the shapes and angles come from the same numbers as the checks, so what you trace is what was tested.</li>
              <li>Both sides match: one template makes both side frames, so the chair doesn't twist.</li>
              <li>Machine-ready: the SVG goes straight to a laser cutter or CNC for templates or parts.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {ts.map((x, i) => (
              <button key={x.id} onClick={() => setSel(i)} className={cn("rounded-full border px-3 py-1 text-xs", i === sel ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground hover:text-foreground")}>
                {x.title}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border hairline bg-card p-1 text-xs">
            {(Object.keys(PAPER) as Paper[]).map((p) => (
              <button key={p} onClick={() => setPaper(p)} className={cn("rounded-md px-2.5 py-1", paper === p ? "bg-teal text-accent-foreground" : "text-muted-foreground")}>{PAPER[p].label}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border hairline bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><h2 className="text-2xl">{t.title}</h2><ProvenanceBadge kind="calculated" topic="shop" /></div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t.use}</p>
              <p className="mt-1 font-mono text-xs text-measure">
                {t.widthCm.toFixed(1)} × {t.heightCm.toFixed(1)} cm · {used.length} {PAPER[paper].label} page{used.length === 1 ? "" : "s"} to print{used.length < grid.tiles.length ? ` (${grid.tiles.length - used.length} blank pages skipped)` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => printPages([t], paper, name)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground hover:opacity-90">
                <Printer className="h-3.5 w-3.5" /> {used.length === 1 ? "Print this page" : `Print these ${used.length} pages`}
              </button>
              <button onClick={() => download(t, name)} className="flex items-center gap-2 rounded-md border hairline px-3 py-2 text-xs hover:bg-secondary">
                <Download className="h-3.5 w-3.5" /> Download SVG (real size)
              </button>
            </div>
          </div>

          <Preview t={t} grid={grid} used={used} />
          <p className="mt-2 text-[11px] text-muted-foreground">Dashed lines show where the pages split; each page repeats 1 cm of its neighbour so you can line them up. Shaded pages are blank and aren't printed. Grey squares are 10 cm.</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border hairline bg-card p-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Scissors className="h-4 w-4" /> Everything for this chair: {ts.length} templates, {all} pages on {PAPER[paper].label}.</div>
          <button onClick={() => printPages(ts, paper, name)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground hover:opacity-90">
            <Printer className="h-3.5 w-3.5" /> Print all templates
          </button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Still dry-fit before gluing: real boards never match the plan exactly. Templates follow the app's simplified version of each chair.</p>
      </div>
    </div>
  );
}

function Preview({ t, grid, used }: { t: Template; grid: ReturnType<typeof tilePages>; used: ReturnType<typeof tilePages>["tiles"] }) {
  const isUsed = (x: { row: number; col: number }) => used.some((u) => u.row === x.row && u.col === x.col);
  const W = Math.max(t.widthCm, ...grid.tiles.map((x) => x.x + x.w));
  const H = Math.max(t.heightCm, ...grid.tiles.map((x) => x.y + x.h));
  const tens = [];
  for (let x = 0; x <= W; x += 10) tens.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#e6ded2" strokeWidth={0.05} />);
  for (let y = 0; y <= H; y += 10) tens.push(<line key={`y${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#e6ded2" strokeWidth={0.05} />);
  return (
    <div className="mt-4 overflow-hidden rounded-lg border hairline bg-white">
      <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="block max-h-[62vh] w-full" role="img" aria-label={`${t.title} at real size, split into pages`}>
        {tens}
        <g dangerouslySetInnerHTML={{ __html: t.body }} />
        {grid.tiles.map((x) => (
          <g key={`${x.row}-${x.col}`}>
            <rect x={x.x} y={x.y} width={x.w} height={x.h} fill={isUsed(x) ? "none" : "#f4efe7"} fillOpacity={0.7} stroke="#547D75" strokeWidth={0.12} strokeDasharray="0.8 0.5" />
            <text x={x.x + x.w - 0.6} y={x.y + x.h - 0.8} fontSize={1.1} textAnchor="end" fill="#547D75" fontFamily="Helvetica, Arial, sans-serif">{isUsed(x) ? `Page ${x.row + 1}-${x.col + 1}` : "blank, skipped"}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
