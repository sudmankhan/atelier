import { useState } from "react";
import { cantileverEndLoad, toMm, toMPa, woodE_Pa } from "@/lib/chair/beam";
import { DEFAULT_MOISTURE_NOTE, WOOD_PROPERTIES, type MoistureCondition, type WoodId } from "@/lib/chair/woodProperties";
import { cn } from "@/lib/utils";

/** Educational cantilever bending estimate for a straight rectangular member. Inputs in cm/N. */
export function BeamPanel({ initialLengthCm, initialSectionCm, initialWood }: { initialLengthCm: number; initialSectionCm: number; initialWood: WoodId }) {
  const [F, setF] = useState(100);
  const [L, setL] = useState(initialLengthCm);
  const [b, setB] = useState(initialSectionCm);
  const [h, setH] = useState(initialSectionCm);
  const [wood, setWood] = useState<WoodId>(initialWood);
  const [mc, setMc] = useState<MoistureCondition>("12pct");
  const E = woodE_Pa(wood, mc) ?? NaN;
  const r = cantileverEndLoad({ F, L: L / 100, b: b / 100, h: h / 100, E });
  const mor = WOOD_PROPERTIES[wood].values[mc].MOR_MPa;
  const f = (n: number, d = 2) => n.toLocaleString(undefined, { maximumFractionDigits: d });

  // diagram: deflected shape (exaggerated if tiny)
  const len = 220, x0 = 30, y0 = 50;
  const dPx = r.ok ? Math.min(60, Math.max(2, toMm(r.delta) * 4)) : 0;
  const path = Array.from({ length: 21 }, (_, i) => { const t = i / 20; return `${x0 + t * len},${y0 + dPx * (t * t * (3 - t)) / 2}`; }).join(" ");

  return (
    <div className="space-y-3 text-xs">
      <div className="eyebrow">Bending analysis — educational estimate</div>
      <p className="text-muted-foreground">Idealized straight rectangular member, fixed at one end, point load at the free end. Use it for straight legs, rails or stretchers only — not curved parts or whole joint systems.</p>
      <svg viewBox="0 0 300 130" className="w-full rounded-md bg-background">
        <rect x={x0 - 10} y={y0 - 25} width={10} height={50} className="fill-muted-foreground" />
        <line x1={x0} y1={y0} x2={x0 + len} y2={y0} className="stroke-muted-foreground" strokeDasharray="3 3" />
        <polyline points={path} className="fill-none stroke-walnut" strokeWidth={Math.max(3, h * 1.2)} />
        <line x1={x0 + len} y1={y0 + dPx - 40} x2={x0 + len} y2={y0 + dPx - 6} className="stroke-alert" strokeWidth={2} />
        <text x={x0 + len - 30} y={y0 + dPx - 44} fontSize={9} className="fill-alert">F = {F} N</text>
        <text x={x0 + 4} y={y0 - 30} fontSize={9} className="fill-teal">max moment & stress at the fixed end</text>
        <text x={x0 + len / 2} y={120} fontSize={9} className="fill-muted-foreground">L = {L} cm (deflection exaggerated)</text>
      </svg>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Force F (N)" v={F} on={setF} />
        <Field label="Length L (cm)" v={L} on={setL} />
        <Field label="Width b (cm)" v={b} on={setB} />
        <Field label="Bending depth h (cm)" v={h} on={setH} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(WOOD_PROPERTIES) as WoodId[]).map((id) => (
          <button key={id} onClick={() => setWood(id)} className={cn("rounded-full border px-2.5 py-1", wood === id ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground")}>{WOOD_PROPERTIES[id].commonName}</button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {(["12pct", "green"] as const).map((m) => (
          <button key={m} onClick={() => setMc(m)} className={cn("rounded-full border px-2.5 py-1", mc === m ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground")}>{m === "12pct" ? "12% MC (reference)" : "Green"}</button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{DEFAULT_MOISTURE_NOTE} E = {f(E / 1e6, 0)} MPa from USDA Wood Handbook Table 5–3b (as tabulated, no shear correction).</p>

      {r.ok ? (
        <div className="space-y-1 rounded-md border hairline p-2">
          <div>Bending moment M = F × L = {F} × {f(L / 100, 3)} = {f(r.M)} N·m</div>
          <div>I = b·h³/12 = {r.I.toExponential(3)} m⁴</div>
          <div className="text-sm text-foreground">Max bending stress = M·(h/2)/I = {f(toMPa(r.sigma))} MPa</div>
          <div className="text-sm text-foreground">End deflection = F·L³/(3·E·I) = {f(toMm(r.delta))} mm</div>
          {mor !== null && <div className="text-muted-foreground">For comparison only: USDA clear-wood mean MOR = {f(mor, 1)} MPa. This is a test average from small defect-free samples, not an allowable working stress.</div>}
        </div>
      ) : <div className="text-alert">{r.error}</div>}

      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
        <li>Double the force: stress and deflection double.</li>
        <li>Double the length: stress doubles, deflection rises 8×.</li>
        <li>Double the depth h: stress drops 4×, deflection drops 8×. Orient the deep side along the load.</li>
        <li>Stiffer wood (higher E) cuts deflection. It does not change stress.</li>
      </ul>
      <p className="text-[11px] text-muted-foreground">Educational bending estimate, not proof of structural safety. Real chairs often fail at joints, or through shear, buckling, splitting, defects or fatigue, none of which this model includes.</p>
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
