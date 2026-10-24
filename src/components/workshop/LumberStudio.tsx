import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2 } from "lucide-react";
import { japaneseShop, kangarooShop } from "@/lib/chair/shop";
import {
  matchStock,
  partIdFor,
  RUNOUT_LIMIT,
  type Board,
  type StockMatch,
} from "@/lib/chair/stock";
import { inspectLumber, type LumberReport } from "@/lib/lumber.functions";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { useWorkshop, type AnyPartId } from "./store";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; b: Board }[] = [
  { label: "8/4 straight walnut · 120 cm", b: { l: 120, w: 18, t: 5.1, grainSlope: 25 } },
  { label: "4/4 oak offcut, 1:7 runout", b: { l: 70, w: 15, t: 2.6, grainSlope: 7 } },
  { label: "Wide pine plank · 90 cm", b: { l: 90, w: 30, t: 4.5, grainSlope: null } },
];
const tone = {
  good: "border-teal text-teal",
  warn: "border-walnut text-walnut",
  bad: "border-alert text-alert",
} as const;

async function shrink(file: File): Promise<string> {
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let cleanup = () => {};

  try {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    cleanup = () => bitmap.close();
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    cleanup = () => URL.revokeObjectURL(url);
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unsupported or damaged image"));
        image.src = url;
      });
      source = image;
      width = image.naturalWidth;
      height = image.naturalHeight;
    } catch (error) {
      cleanup();
      throw error;
    }
  }

  try {
    if (!width || !height) throw new Error("Image has no readable dimensions");
    const scale = Math.min(1, 1280 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image conversion is unavailable");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    cleanup();
  }
}

export function LumberStudio() {
  const w = useWorkshop();
  const [b, setB] = useState<Board>(PRESETS[0]!.b);
  const [photo, setPhoto] = useState<string | null>(null);
  const [report, setReport] = useState<LumberReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inspect = useServerFn(inspectLumber);

  const cuts = useMemo(
    () =>
      (w.typology === "kangaroo"
        ? kangarooShop(w.params as ChairParams)
        : japaneseShop(w.params as JapaneseParams)
      ).cuts,
    [w.typology, w.params],
  );
  const matches = useMemo(() => matchStock(b, cuts), [b, cuts]);
  const set = (k: keyof Board, v: number | null) => setB((x) => ({ ...x, [k]: v }));

  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(null);
    setReport(null);
    setBusy(true);
    try {
      const url = await shrink(f);
      setPhoto(url);
      const r = await inspect({
        data: {
          image: url,
          board: { l: b.l, w: b.w, t: b.t },
          typology: w.typology,
          parts: cuts.map((c) => c.part),
        },
      });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setReport(r.report);
      if (r.report.grainSlope !== null) set("grainSlope", r.report.grainSlope);
    } catch (error) {
      setErr(
        error instanceof Error && /image|decode|format|dimension/i.test(error.message)
          ? "That image format couldn't be read. Try a JPEG, PNG, or WebP image."
          : "Couldn't inspect the photo. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function pick(m: StockMatch) {
    setOpen(open === m.part ? null : m.part);
    const id = partIdFor(m.part, w.typology);
    if (id) w.select(id as AnyPartId);
  }

  return (
    <div className="space-y-5 p-5 text-xs">
      <div>
        <div className="eyebrow">Your board</div>
        <p className="mt-1 text-muted-foreground">
          Enter the rough board you actually have. I'll tell you which parts of this chair come out
          of it, how to lay them out, and whether the grain can take the load.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setB(p.b);
                setReport(null);
                setPhoto(null);
              }}
              className="rounded-full border hairline px-2 py-0.5 text-[10px] hover:bg-secondary"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(
            [
              ["l", "Length"],
              ["w", "Width"],
              ["t", "Thick"],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="block">
              <span className="text-[10px] text-measure">{lab} cm</span>
              <input
                type="number"
                min={1}
                step={0.1}
                value={b[k]}
                onChange={(e) => set(k, Math.max(0, Number(e.target.value)))}
                className="mt-0.5 w-full rounded border hairline bg-background px-1.5 py-1 font-mono"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-[10px] text-measure">Grain 1 in</span>
            <input
              type="number"
              min={1}
              placeholder="?"
              value={b.grainSlope ?? ""}
              onChange={(e) =>
                set("grainSlope", e.target.value ? Math.max(1, Number(e.target.value)) : null)
              }
              className="mt-0.5 w-full rounded border hairline bg-background px-1.5 py-1 font-mono"
            />
          </label>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Grain slope: how far the fibres drift across the board — 1 in 20 is straight; steeper than
          1 in {RUNOUT_LIMIT} is too weak for legs and posts.
        </p>
      </div>

      <div className="rounded-md border hairline p-3">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Photo inspection (AI)</div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1 rounded-md bg-teal px-2 py-1 text-[11px] text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}{" "}
            {photo ? "New photo" : "Upload board photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {photo && (
          <img src={photo} alt="Your board" className="mt-2 max-h-32 w-full rounded object-cover" />
        )}
        {busy && <p className="mt-2 text-muted-foreground">Reading the grain…</p>}
        {err && <p className="mt-2 text-alert">{err}</p>}
        {report && (
          <div className="mt-2 space-y-1.5">
            <div>
              <span className="font-medium">{report.species}</span> · {report.cut} · grain{" "}
              {report.grainSlope ? `≈1 in ${report.grainSlope}` : "unclear"}{" "}
              <span className="text-muted-foreground">({report.confidence} confidence)</span>
            </div>
            {report.defects.length > 0 && (
              <div className="text-walnut">Defects: {report.defects.join(", ")}</div>
            )}
            {report.bestFor.length > 0 && (
              <div className="text-teal">Good for: {report.bestFor.join(", ")}</div>
            )}
            {report.avoidFor.length > 0 && (
              <div className="text-alert">Avoid for: {report.avoidFor.join(", ")}</div>
            )}
            <p className="text-muted-foreground">{report.advice}</p>
            <p className="text-[10px] text-muted-foreground">
              Judged from a photo — confirm by splitting or reading the edge grain before cutting
              structural parts.
            </p>
          </div>
        )}
        {!photo && (
          <p className="mt-1 text-muted-foreground">
            Optional: snap the board face in good light. The grain slope it reads feeds the fit
            check below.
          </p>
        )}
      </div>

      <div>
        <div className="eyebrow">What this board can become</div>
        <div className="mt-2 space-y-2">
          {matches.map((m) => (
            <div
              key={m.part}
              className={cn(
                "rounded-md border-l-2 bg-secondary/40 p-2",
                tone[m.verdict].split(" ")[0],
              )}
            >
              <button
                onClick={() => pick(m)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-medium">
                  {m.part} <span className="text-muted-foreground">×{m.qty}</span>
                </span>
                <span className={cn("font-mono text-[10px]", tone[m.verdict].split(" ")[1])}>
                  {m.yieldCount > 0 ? `yields ${m.yieldCount}` : "no fit"}
                </span>
              </button>
              <p className="mt-0.5 text-muted-foreground">{m.reason}</p>
              {open === m.part && m.placements.length > 0 && <Layout b={b} m={m} />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Tap a part to see the layout and light it up on the chair. Includes {0.3} cm saw kerf and
          rough-milling allowance. Simple straight layout — nest curved parts on a full-size
          template.
        </p>
      </div>
    </div>
  );
}

function Layout({ b, m }: { b: Board; m: StockMatch }) {
  const W = 300,
    s = W / b.l,
    H = Math.max(24, b.w * s);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
      <rect width={W} height={H} className="fill-secondary stroke-border" />
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={i}
          x1={0}
          x2={W}
          y1={(H / 7) * (i + 1)}
          y2={
            (H / 7) * (i + 1) +
            (b.grainSlope ? (W / b.grainSlope) * s * 0 + H / Math.max(b.grainSlope, 1) : 0)
          }
          className="stroke-muted-foreground/30"
          strokeWidth={0.5}
        />
      ))}
      {m.placements.map((p, i) => (
        <rect
          key={i}
          x={p.x * s}
          y={p.y * s}
          width={p.l * s}
          height={p.w * s}
          className="fill-teal/40 stroke-teal"
          strokeWidth={1}
        />
      ))}
      <text x={4} y={H - 4} className="fill-muted-foreground" fontSize={8}>
        {b.l}×{b.w} cm · {m.wastePct}% left as offcut
      </text>
    </svg>
  );
}
