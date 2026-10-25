import { useMemo, useRef, useState } from "react";
import { Hammer, Printer, X } from "lucide-react";
import { blueprintDims, cost, PRICE_PER_BF, shoppingList } from "@/lib/buildkit";
import { labToSpec } from "@/lib/furniture/fromLab";
import { specCutList } from "@/lib/furniture/engine";
import { WOODS, type LabDesign } from "@/lib/lab";
import { Words } from "@/components/Words";

const rad = (d: number) => (d * Math.PI) / 180;
const INK = "currentColor";

/** A dimension line with end ticks and a label. Coordinates in SVG units. */
function Dim({ x1, y1, x2, y2, label, side = -1 }: { x1: number; y1: number; x2: number; y2: number; label: string; side?: 1 | -1 }) {
  const vertical = Math.abs(x1 - x2) < 0.01;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <g className="text-walnut" stroke={INK} strokeWidth={0.9}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical
        ? <><line x1={x1 - 4} y1={y1} x2={x1 + 4} y2={y1} /><line x1={x2 - 4} y1={y2} x2={x2 + 4} y2={y2} /></>
        : <><line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} /><line x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} /></>}
      <text x={vertical ? mx + side * 6 : mx} y={vertical ? my + 3 : my + side * 6 + (side > 0 ? 6 : 0)} fontSize={10} textAnchor={vertical ? (side < 0 ? "end" : "start") : "middle"} stroke="none" fill={INK}>{label}</text>
    </g>
  );
}

/** Side and front views drawn from the same numbers as the 3D model, with the measurements a carpenter needs. */
export function Blueprint({ d }: { d: LabDesign }) {
  const b = blueprintDims(d);
  const W = d.seatWidth, D = d.seatDepth, H = d.seatHeight, T = d.legThickness;
  const top = H - 3;
  const sp = d.base === "four" || d.base === "splayed" ? Math.tan(rad(d.splay)) * top : 0;
  const rec = rad(d.backAngle - 90), bh = d.backHeight, hasBack = d.back !== "none";
  const s = 230 / Math.max(b.overallHeight + 10, b.footprintDepth + 30, b.footprintWidth + 30);
  const floor = 270;
  const fz = D / 2 - T, rz = -D / 2 + T, bz = -D / 2 + 1.5, hx = W / 2 - T;
  const bk = (k: number) => [bz - Math.sin(rec) * bh * k, H + Math.cos(rec) * bh * k] as const;
  // side view: z (front = +) to the left
  const SX = (z: number) => 160 - z * s, Y = (y: number) => floor - y * s;
  const FX = (x: number) => 160 + x * s;
  const legW = Math.max(2, T * s);
  const backTop = bk(1);
  const px = W / 2 - 2;
  const sideLegs =
    d.base === "sled" ? [[fz, top, fz + 2, 0], [rz, top, rz - 6, 0], [fz + 2, 0, rz - 6, 0]]
    : d.base === "zframe" ? [[fz, top, fz + 2, 0], [rz + 2, top + 14, rz - 16, 0]]
    : [[fz, top, fz + sp, 0], [rz, top, rz - sp, 0]];
  const frontLegs = d.base === "sled" || d.base === "zframe" ? [[-hx, top, -hx, 0], [hx, top, hx, 0]] : [[-hx, top, -hx - sp, 0], [hx, top, hx + sp, 0]];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <figure className="rounded-lg border hairline bg-background p-2">
        <svg viewBox="0 0 320 300" className="w-full text-foreground" role="img" aria-label={`Side view: seat ${b.seatHeight} cm high, ${b.overallHeight} cm overall, ${b.footprintDepth} cm deep at the floor`}>
          <line x1={10} y1={floor} x2={310} y2={floor} stroke="currentColor" strokeOpacity={0.3} />
          <g stroke="currentColor" strokeLinecap="round" fill="none">
            {sideLegs.map(([z1, y1, z2, y2], i) => <line key={i} x1={SX(z1!)} y1={Y(y1!)} x2={SX(z2!)} y2={Y(y2!)} strokeWidth={legW} strokeOpacity={0.75} />)}
            {d.stretchers && d.base !== "zframe" && d.base !== "sled" && <line x1={SX(fz + sp * 0.65)} y1={Y(top * 0.35)} x2={SX(rz - sp * 0.65)} y2={Y(top * 0.35)} strokeWidth={Math.max(1.5, 2.2 * s)} strokeOpacity={0.6} />}
            {hasBack && <line x1={SX(bz)} y1={Y(H)} x2={SX(backTop[0])} y2={Y(backTop[1])} strokeWidth={Math.max(2, 3 * s)} strokeOpacity={0.75} />}
          </g>
          <rect x={SX(D / 2)} y={Y(H)} width={D * s} height={3 * s} fill="currentColor" fillOpacity={0.55} />
          <Dim x1={22} y1={Y(0)} x2={22} y2={Y(b.overallHeight)} label={`${b.overallHeight}`} side={1} />
          <Dim x1={SX(D / 2) - 14} y1={Y(0)} x2={SX(D / 2) - 14} y2={Y(H)} label={`seat ${b.seatHeight}`} side={-1} />
          <Dim x1={SX(D / 2)} y1={Y(H) - 12} x2={SX(-D / 2)} y2={Y(H) - 12} label={`depth ${b.seatDepth}`} side={-1} />
          <Dim x1={SX(D / 2 + (b.footprintDepth - D) / 2)} y1={floor + 14} x2={SX(D / 2 + (b.footprintDepth - D) / 2 - b.footprintDepth)} y2={floor + 14} label={`floor ${b.footprintDepth}`} side={1} />
          {hasBack && <text x={SX(backTop[0]) + 6} y={Y(backTop[1]) + 4} fontSize={10} fill="currentColor" className="text-walnut">{d.backAngle}° seat-to-back</text>}
          <text x={300} y={20} fontSize={10} textAnchor="end" fill="currentColor" fillOpacity={0.6}>SIDE · front on the left · cm</text>
        </svg>
      </figure>
      <figure className="rounded-lg border hairline bg-background p-2">
        <svg viewBox="0 0 320 300" className="w-full text-foreground" role="img" aria-label={`Front view: seat ${b.seatWidth} cm wide, ${b.footprintWidth} cm wide at the floor`}>
          <line x1={10} y1={floor} x2={310} y2={floor} stroke="currentColor" strokeOpacity={0.3} />
          <g stroke="currentColor" strokeLinecap="round" fill="none">
            {frontLegs.map(([x1, y1, x2, y2], i) => <line key={i} x1={FX(x1!)} y1={Y(y1!)} x2={FX(x2!)} y2={Y(y2!)} strokeWidth={legW} strokeOpacity={0.75} />)}
            {d.stretchers && d.base !== "zframe" && d.base !== "sled" && <line x1={FX(-hx - sp * 0.65)} y1={Y(top * 0.35)} x2={FX(hx + sp * 0.65)} y2={Y(top * 0.35)} strokeWidth={Math.max(1.5, 2.2 * s)} strokeOpacity={0.6} />}
            {hasBack && <>
              <line x1={FX(-px)} y1={Y(H)} x2={FX(-px)} y2={Y(backTop[1])} strokeWidth={Math.max(2, 3 * s)} strokeOpacity={0.75} />
              <line x1={FX(px)} y1={Y(H)} x2={FX(px)} y2={Y(backTop[1])} strokeWidth={Math.max(2, 3 * s)} strokeOpacity={0.75} />
              <line x1={FX(-px)} y1={Y(backTop[1])} x2={FX(px)} y2={Y(backTop[1])} strokeWidth={Math.max(2, 5 * s)} strokeOpacity={0.6} />
              {d.back === "slats" && [0.4, 0.62, 0.84].map((k) => <line key={k} x1={FX(-px)} y1={Y(bk(k)[1])} x2={FX(px)} y2={Y(bk(k)[1])} strokeWidth={Math.max(2, 6 * s)} strokeOpacity={0.45} />)}
              {d.back === "spindles" && [1, 2, 3, 4, 5, 6, 7].map((i) => { const x = -px + (2 * px * i) / 8; return <line key={i} x1={FX(x)} y1={Y(H)} x2={FX(x)} y2={Y(backTop[1])} strokeWidth={Math.max(1, 1.5 * s)} strokeOpacity={0.55} />; })}
              {d.back === "panel" && <rect x={FX(-px + 1.5)} y={Y(bk(0.95)[1])} width={(2 * px - 3) * s} height={(bk(0.95)[1] - bk(0.05)[1]) * s} fill="currentColor" fillOpacity={0.3} stroke="none" />}
            </>}
          </g>
          <rect x={FX(-W / 2)} y={Y(H)} width={W * s} height={3 * s} fill="currentColor" fillOpacity={0.55} />
          <Dim x1={FX(-W / 2)} y1={Y(H) - 12} x2={FX(W / 2)} y2={Y(H) - 12} label={`width ${b.seatWidth}`} side={-1} />
          <Dim x1={FX(-b.footprintWidth / 2)} y1={floor + 14} x2={FX(b.footprintWidth / 2)} y2={floor + 14} label={`floor ${b.footprintWidth}`} side={1} />
          {b.splay > 0 && <text x={FX(hx + sp) + 6} y={Y(8)} fontSize={10} fill="currentColor" className="text-walnut">legs lean out {b.splay}°</text>}
          <text x={300} y={20} fontSize={10} textAnchor="end" fill="currentColor" fillOpacity={0.6}>FRONT · cm</text>
        </svg>
      </figure>
    </div>
  );
}

/** Prints just the kit: copies it and the page's stylesheets into a hidden frame, so the workshop's
 * full-screen layout can't clip it across pages. */
function printKit(el: HTMLElement | null) {
  if (!el) return;
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join("\n");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Build kit</title><base href="${location.origin}/">${styles}<style>@page{margin:14mm}body{background:#fff}.no-print{display:none!important}.build-kit{max-height:none!important;overflow:visible!important;box-shadow:none!important;border:0!important}</style></head><body>${el.outerHTML}</body></html>`);
  doc.close();
  const go = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); setTimeout(() => frame.remove(), 1000); };
  setTimeout(go, 400);
}

/** Everything to hand a carpenter: drawings, what to buy, a rough cost, the cut list and the glue-up order. */
export function BuildKit({ d, name, onClose }: { d: LabDesign; name: string; onClose: () => void }) {
  const list = useMemo(() => shoppingList(d), [d]);
  const spec = useMemo(() => labToSpec(d, name), [d, name]);
  const cuts = useMemo(() => specCutList(spec), [spec]);
  const [price, setPrice] = useState(PRICE_PER_BF[d.wood]);
  const b = blueprintDims(d);
  const kitRef = useRef<HTMLDivElement>(null);
  return (
    <div className="build-kit-overlay absolute inset-0 z-30 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" role="dialog" aria-label="Build kit">
      <div ref={kitRef} className="build-kit max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl border hairline bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow flex items-center gap-1.5"><Hammer className="h-3.5 w-3.5" /> Build kit</div>
            <h3 className="mt-1 text-2xl">{name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{WOODS[d.wood].name} · everything you or a carpenter needs to make it. Measurements in cm.</p>
          </div>
          <div className="no-print flex gap-1">
            <button onClick={() => printKit(kitRef.current)} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Printer className="h-3.5 w-3.5" /> Print / save PDF</button>
            <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <section className="mt-4">
          <h4 className="text-sm font-medium">1 · The drawings</h4>
          <div className="mt-2"><Blueprint d={d} /></div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            {[["Seat height", `${b.seatHeight} cm`], ["Overall height", `${b.overallHeight} cm`], ["Seat", `${b.seatWidth} × ${b.seatDepth} cm`], ["Takes up on the floor", `${b.footprintWidth} × ${b.footprintDepth} cm`],
              ["Legs", `${b.legThickness} cm thick${b.splay ? `, lean out ${b.splay}°` : ""}`], ...(b.backAngle ? [["Back", `${b.backHeight} cm, ${b.backAngle}° to the seat`]] : [])].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b hairline py-1"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="mt-5">
          <h4 className="text-sm font-medium">2 · What to buy</h4>
          <p className="text-xs text-muted-foreground">Rough-sawn {WOODS[d.wood].name.toLowerCase()} from a lumberyard. Every part, with extra for planing, is packed onto these boards with saw cuts allowed for.</p>
          <table className="mt-2 w-full text-sm">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="pb-1 font-normal">Buy</th><th className="pb-1 font-normal">Board</th><th className="pb-1 font-normal">For</th><th className="pb-1 text-right font-normal">Board feet</th></tr></thead>
            <tbody>
              {list.lines.map((l, i) => (
                <tr key={i} className="border-t hairline align-top">
                  <td className="py-1.5 pr-2 font-medium">{l.count} ×</td>
                  <td className="py-1.5 pr-2">{l.thickness}, {Math.round(l.widthCm / 2.54)} in wide, {l.lengthFt} ft long<div className="text-[11px] text-muted-foreground">{l.widthCm} cm × {l.lengthCm} cm</div></td>
                  <td className="py-1.5 pr-2 text-xs text-muted-foreground">{l.parts.join(", ")}</td>
                  <td className="py-1.5 text-right font-mono">{l.boardFeet}</td>
                </tr>
              ))}
              <tr className="border-t hairline font-medium"><td colSpan={3} className="py-1.5">Total</td><td className="py-1.5 text-right font-mono">{list.boardFeet} bf</td></tr>
            </tbody>
          </table>
          {list.glueUps.map((g) => <p key={g.part} className="mt-1 text-xs text-walnut"><Words text={`${g.part}: wider than any board, so glue it up from ${g.strips} strips about ${g.stripWidth} cm wide, alternating the growth rings.`} /></p>)}
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-teal/10 p-3 text-sm">
            <span>Rough cost of wood:</span>
            <span className="text-xl font-medium text-teal">${cost(list, price)}</span>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">at $<input type="number" min={1} max={60} value={price} onChange={(e) => setPrice(Math.max(0, +e.target.value || 0))} className="w-14 rounded border hairline bg-background px-1.5 py-0.5 text-foreground" /> per board foot</label>
            <span className="w-full text-[11px] text-muted-foreground">An estimate from a typical US lumberyard price. Check your yard. Glue, finish and a carpenter's time are extra.</span>
          </div>
        </section>

        <section className="mt-5">
          <h4 className="text-sm font-medium">3 · Cut list</h4>
          <table className="mt-2 w-full text-xs">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="pb-1 font-normal">Part</th><th className="pb-1 font-normal">Qty</th><th className="pb-1 font-normal">Finished (L × W × T)</th><th className="pb-1 font-normal">Cut first (rough)</th></tr></thead>
            <tbody>
              {cuts.map((c) => (
                <tr key={c.part} className="border-t hairline align-top">
                  <td className="py-1 pr-2">{c.part}{c.note && <div className="text-[10px] text-muted-foreground"><Words text={c.note} /></div>}</td>
                  <td className="py-1 pr-2 font-mono">{c.qty}</td>
                  <td className="py-1 pr-2 font-mono">{c.finished.l} × {c.finished.w} × {c.finished.t}</td>
                  <td className="py-1 font-mono text-muted-foreground">{c.rough.l} × {c.rough.w} × {c.rough.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-muted-foreground">Every part is straight, so no curved templates are needed: mark them straight from this list.</p>
        </section>

        <section className="mt-5">
          <h4 className="text-sm font-medium">4 · Order of work</h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {spec.steps.map((s) => <li key={s.id}><Words text={s.label} /></li>)}
          </ol>
        </section>
      </div>
    </div>
  );
}
