import { useEffect, useState } from "react";
import { DEFAULT_PUSH_HEIGHT_CM, EXAMPLE_LOADS, combineWeights, defaultComZ, leverArm, tippingStatics } from "@/lib/statics";
import type { ChairMass } from "@/lib/chair/chairMass";
import { cn } from "@/lib/utils";
import { ProvenanceBadge } from "./ProvenanceBadge";

/** Static tipping check. All z values in cm, +z forward. The chair's own weight comes from its parts × USDA density. */
export function StaticsPanel({ pivotZ, seatRearZ, seatFrontZ, seatHeight, chair, reclineDeg = 0, pushHeightCm = DEFAULT_PUSH_HEIGHT_CM }: {
  pivotZ: number; seatRearZ: number; seatFrontZ: number; seatHeight: number; chair: ChairMass; reclineDeg?: number; pushHeightCm?: number;
}) {
  const defCom = Math.round((defaultComZ(seatRearZ, seatFrontZ, undefined, reclineDeg) - seatRearZ) * 10) / 10;
  const defH = Math.round(pushHeightCm);
  const [W, setW] = useState<number>(EXAMPLE_LOADS.W);
  const [F, setF] = useState<number>(EXAMPLE_LOADS.F);
  const [hCm, setH] = useState(defH);
  const [com, setCom] = useState(defCom); // sitter's CoM, cm forward of seat rear
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (!touched) { setCom(defCom); setH(defH); } }, [defCom, defH, touched]);

  const occZ = seatRearZ + com;
  const both = combineWeights({ W, z: occZ }, { W: chair.N, z: chair.comZ });
  const d = leverArm(both.z, pivotZ);
  const r = tippingStatics({ W: both.W, d, F, h: hCm / 100 });
  const f2 = (n: number) => (Math.round(n * 100) / 100).toString();
  const f0 = (n: number) => Math.round(n).toString();

  // diagram
  const s = 1.4, fy = 175, px = 60;
  const X = (z: number) => px + (z - pivotZ) * s;
  const max = r.ok ? Math.max(Math.abs(r.gravityMoment), r.pushMoment, 1) : 1;
  const bar = (v: number) => (Math.abs(v) / max) * 120;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2"><div className="eyebrow">Static tipping check (idealized 2D)</div><ProvenanceBadge kind="assumption" topic="tipping" /></div>
      <svg viewBox="0 0 320 200" className="w-full rounded-md bg-background">
        <line x1={0} y1={fy} x2={320} y2={fy} className="stroke-muted-foreground" />
        <line x1={X(seatRearZ)} y1={fy - seatHeight * s} x2={X(seatFrontZ)} y2={fy - seatHeight * s} className="stroke-foreground" strokeWidth={4} />
        <circle cx={px} cy={fy} r={4} className="fill-walnut" />
        <text x={px - 20} y={fy + 14} fontSize={9} className="fill-muted-foreground">pivot</text>
        <line x1={X(both.z)} y1={fy - 110} x2={X(both.z)} y2={fy - 70} className={d >= 0 ? "stroke-teal" : "stroke-alert"} strokeWidth={2} markerEnd="url(#ah)" />
        <text x={X(both.z) + 4} y={fy - 100} fontSize={9} className="fill-foreground">W (combined CoM)</text>
        <line x1={px} y1={fy + 4} x2={X(both.z)} y2={fy + 4} className="stroke-teal" strokeDasharray="3 2" />
        <text x={(px + X(both.z)) / 2} y={fy + 24} fontSize={9} className="fill-teal">d = {f2(d)} m</text>
        <line x1={px + 70} y1={fy - hCm * s} x2={px + 20} y2={fy - hCm * s} className="stroke-alert" strokeWidth={2} markerEnd="url(#ah)" />
        <text x={px + 72} y={fy - hCm * s + 3} fontSize={9} className="fill-alert">F (h = {hCm} cm)</text>
        <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" className="fill-foreground" /></marker></defs>
        {r.ok && (
          <g transform="translate(190,20)">
            <text x={0} y={0} fontSize={9} className="fill-muted-foreground">moments (N·m)</text>
            <rect x={0} y={8} width={bar(r.gravityMoment)} height={10} className={r.gravityMoment >= 0 ? "fill-teal" : "fill-alert"} />
            <text x={0} y={30} fontSize={9} className="fill-foreground">W·d = {f2(r.gravityMoment)}</text>
            <rect x={0} y={38} width={bar(r.pushMoment)} height={10} className="fill-alert" />
            <text x={0} y={60} fontSize={9} className="fill-foreground">F·h = {f2(r.pushMoment)}</text>
          </g>
        )}
      </svg>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Sitter weight (N)" v={W} on={setW} />
        <Field label="F backward push (N)" v={F} on={setF} />
        <Field label="h push height (cm)" v={hCm} on={(n) => { setTouched(true); setH(n); }} />
        <Field label="Sitter CoM fwd of seat rear (cm)" v={com} on={(n) => { setTouched(true); setCom(n); }} />
      </div>
      <input type="range" min={-30} max={Math.round(seatFrontZ - seatRearZ)} step={0.5} value={com} onChange={(e) => { setTouched(true); setCom(+e.target.value); }} className="w-full" aria-label="Sitter centre of mass position" />
      <div className="flex gap-2">
        <button className="rounded-md border hairline px-2 py-1" onClick={() => { setW(EXAMPLE_LOADS.W); setF(EXAMPLE_LOADS.F); }}>Load 900 N / 250 N example</button>
        <button className="rounded-md border hairline px-2 py-1" onClick={() => { setW(EXAMPLE_LOADS.W); setF(EXAMPLE_LOADS.F); setH(defH); setTouched(false); setCom(defCom); }}>Reset</button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {EXAMPLE_LOADS.label}. Chair weight {chair.kg.toFixed(1)} kg ({f0(chair.N)} N) is calculated from its parts × USDA density{chair.proxy ? " (white oak stand-in)" : ""}. The sitter's default position ({defCom} cm forward of the seat rear) is an assumption{reclineDeg > 0 ? `, moved back because the upper body leans with the ${f0(reclineDeg)}° back` : ""}.
      </p>

      {r.ok ? (
        <div className="space-y-1 rounded-md border hairline p-2">
          <div className={cn("text-sm", r.status === "tips" ? "text-alert" : r.status === "balance" ? "text-walnut" : "text-teal")}>{r.label}</div>
          <div>Total weight = sitter + chair = {f0(W)} + {f0(chair.N)} = {f0(both.W)} N, centre {f2(d)} m in front of the pivot</div>
          <div>Restoring (gravity) moment = W × d = {f0(both.W)} × {f2(d)} = {f2(r.gravityMoment)} N·m</div>
          <div>Overturning moment = F × h = {F} × {f2(hCm / 100)} = {f2(r.pushMoment)} N·m</div>
          <div>Net restoring moment = W·d − F·h = {f2(r.net)} N·m</div>
          <div>Threshold backward force = W·d / h = {r.thresholdF === null ? "n/a" : `${f2(r.thresholdF)} N`}</div>
          {r.notes.map((n) => <div key={n} className="text-walnut">{n}</div>)}
        </div>
      ) : <div className="text-alert">{r.error}</div>}
      <p className="text-[11px] text-muted-foreground">Idealized static 2D model about the rear support. It excludes movement, impact, sliding, uneven ground, flex and joint failure, and does not certify that a chair is stable.</p>
    </div>
  );
}

function Field({ label, v, on }: { label: string; v: number; on: (n: number) => void }) {
  return (
    <label className="block">
      <span className="text-muted-foreground">{label}</span>
      <input type="number" value={Number.isFinite(v) ? v : ""} onChange={(e) => on(e.target.value === "" ? NaN : +e.target.value)} className="mt-0.5 w-full rounded border hairline bg-background px-2 py-1" />
    </label>
  );
}
