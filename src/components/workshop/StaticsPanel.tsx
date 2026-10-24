import { useEffect, useState } from "react";
import { DEFAULT_PUSH_HEIGHT_CM, EXAMPLE_LOADS, defaultComZ, leverArm, tippingStatics } from "@/lib/statics";
import { cn } from "@/lib/utils";

/** Static tipping check. All z values in cm, +z forward. */
export function StaticsPanel({ pivotZ, seatRearZ, seatFrontZ, seatHeight }: { pivotZ: number; seatRearZ: number; seatFrontZ: number; seatHeight: number }) {
  const defCom = Math.round((defaultComZ(seatRearZ, seatFrontZ) - seatRearZ) * 10) / 10;
  const [W, setW] = useState<number>(EXAMPLE_LOADS.W);
  const [F, setF] = useState<number>(EXAMPLE_LOADS.F);
  const [hCm, setH] = useState(DEFAULT_PUSH_HEIGHT_CM);
  const [com, setCom] = useState(defCom); // cm forward of seat rear
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (!touched) setCom(defCom); }, [defCom, touched]);

  const comZ = seatRearZ + com;
  const d = leverArm(comZ, pivotZ);
  const r = tippingStatics({ W, d, F, h: hCm / 100 });
  const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

  // diagram
  const s = 1.4, fy = 175, px = 60;
  const X = (z: number) => px + (z - pivotZ) * s;
  const max = r.ok ? Math.max(Math.abs(r.gravityMoment), r.pushMoment, 1) : 1;
  const bar = (v: number) => (Math.abs(v) / max) * 120;

  return (
    <div className="space-y-3 text-xs">
      <div className="eyebrow">Static tipping check (idealized 2D)</div>
      <svg viewBox="0 0 320 200" className="w-full rounded-md bg-background">
        <line x1={0} y1={fy} x2={320} y2={fy} className="stroke-muted-foreground" />
        <line x1={X(seatRearZ)} y1={fy - seatHeight * s} x2={X(seatFrontZ)} y2={fy - seatHeight * s} className="stroke-foreground" strokeWidth={4} />
        <circle cx={px} cy={fy} r={4} className="fill-walnut" />
        <text x={px - 20} y={fy + 14} fontSize={9} className="fill-muted-foreground">pivot</text>
        <line x1={X(comZ)} y1={fy - 110} x2={X(comZ)} y2={fy - 70} className={d >= 0 ? "stroke-teal" : "stroke-alert"} strokeWidth={2} markerEnd="url(#ah)" />
        <text x={X(comZ) + 4} y={fy - 100} fontSize={9} className="fill-foreground">W (CoM)</text>
        <line x1={px} y1={fy + 4} x2={X(comZ)} y2={fy + 4} className="stroke-teal" strokeDasharray="3 2" />
        <text x={(px + X(comZ)) / 2} y={fy + 24} fontSize={9} className="fill-teal">d = {f2(d)} m</text>
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
        <Field label="W total weight (N)" v={W} on={setW} />
        <Field label="F backward push (N)" v={F} on={setF} />
        <Field label="h push height (cm)" v={hCm} on={setH} />
        <Field label="CoM fwd of seat rear (cm)" v={com} on={(n) => { setTouched(true); setCom(n); }} />
      </div>
      <input type="range" min={-30} max={Math.round(seatFrontZ - seatRearZ)} step={0.5} value={com} onChange={(e) => { setTouched(true); setCom(+e.target.value); }} className="w-full" aria-label="Centre of mass position" />
      <div className="flex gap-2">
        <button className="rounded-md border hairline px-2 py-1" onClick={() => { setW(EXAMPLE_LOADS.W); setF(EXAMPLE_LOADS.F); }}>Load 900 N / 250 N example</button>
        <button className="rounded-md border hairline px-2 py-1" onClick={() => { setW(EXAMPLE_LOADS.W); setF(EXAMPLE_LOADS.F); setH(DEFAULT_PUSH_HEIGHT_CM); setTouched(false); setCom(defCom); }}>Reset</button>
      </div>
      <p className="text-[11px] text-muted-foreground">{EXAMPLE_LOADS.label}. The centre of mass is for the combined chair + occupant. Its default ({defCom} cm forward of the seat rear) is an illustrative assumption, not measured from the chair or from you.</p>

      {r.ok ? (
        <div className="space-y-1 rounded-md border hairline p-2">
          <div className={cn("text-sm", r.status === "tips" ? "text-alert" : r.status === "balance" ? "text-walnut" : "text-teal")}>{r.label}</div>
          <div>Restoring (gravity) moment = W × d = {W} × {f2(d)} = {f2(r.gravityMoment)} N·m</div>
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
