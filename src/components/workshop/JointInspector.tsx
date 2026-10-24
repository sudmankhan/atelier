import { useState } from "react";
import { JOINTS, checkJoint, jointGrade, type JointSpec, type Level } from "@/lib/chair/joinery";
import { trialJointStress } from "@/lib/chair/stress";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { useWorkshop } from "./store";
import { cn } from "@/lib/utils";
import { ProvenanceBadge } from "./ProvenanceBadge";

const tone: Record<Level, string> = { good: "text-teal", warn: "text-walnut", bad: "text-alert" };
const dot: Record<Level, string> = { good: "bg-teal", warn: "bg-walnut", bad: "bg-alert" };

export function JointInspector() {
  const w = useWorkshop();
  const joints = JOINTS[w.typology];
  const [id, setId] = useState(joints[0]!.id);
  const j = joints.find((x) => x.id === id) ?? joints[0]!;
  return (
    <div className="space-y-4 p-5" key={w.typology}>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Pick a joint, then size its tenon. The checks are the rules of thumb a shop teaches — not a strength certificate.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {joints.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={cn("rounded-full border px-2.5 py-1 text-[11px]", x.id === j.id ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground")}>
            {x.name}
          </button>
        ))}
      </div>
      <JointEditor key={j.id} j={j} />
    </div>
  );
}

function JointEditor({ j }: { j: JointSpec }) {
  const w = useWorkshop();
  const [t, setT] = useState(j.tenonT);
  const [l, setL] = useState(j.tenonL);
  const checks = checkJoint(j, t, l);
  const load = trialJointStress(w.typology, w.params as ChairParams | JapaneseParams, j.id, t);
  const grade = jointGrade(checks);
  const round = j.kind === "round-tenon";
  // Cross-section SVG: mortised member seen end-on with the tenon cut through it.
  const S = 150 / Math.max(j.mortiseMember, 1);
  const M = j.mortiseMember * S;
  const T = t * S;
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{j.why}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/60 p-2">
          <div className="eyebrow mb-1">Cross-section</div>
          <svg viewBox="-10 -10 170 170" className="w-full">
            <rect x={0} y={0} width={M} height={M} className="fill-card stroke-foreground" strokeWidth={1} />
            {round ? (
              <circle cx={M / 2} cy={M / 2} r={T / 2} className={cn("stroke-foreground", grade === "bad" ? "fill-alert/40" : "fill-teal/30")} />
            ) : (
              <rect x={(M - T) / 2} y={M * 0.15} width={T} height={M * 0.7} className={cn("stroke-foreground", grade === "bad" ? "fill-alert/40" : "fill-teal/30")} />
            )}
            <text x={2} y={M + 9} className="fill-muted-foreground" fontSize={8}>wall {((j.mortiseMember - t) / 2).toFixed(2)} cm</text>
          </svg>
        </div>
        <div className="rounded-lg bg-secondary/60 p-2">
          <div className="eyebrow mb-1">Side view</div>
          <svg viewBox="-5 -10 170 100" className="w-full">
            <rect x={0} y={20} width={60} height={j.tenonMember * 10} className="fill-card stroke-foreground" />
            <rect x={60} y={20 + (j.tenonMember * 10 - t * 10) / 2} width={l * 12} height={t * 10} className="fill-teal/30 stroke-foreground" />
            <rect x={60} y={5} width={j.mortiseDepthMax * 12} height={j.tenonMember * 10 + 30} className="fill-none stroke-muted-foreground" strokeDasharray="3 2" />
            <text x={62} y={2} fontSize={7} className="fill-muted-foreground">mortised member</text>
          </svg>
        </div>
      </div>
      <Slider label={round ? "Tenon diameter" : "Tenon thickness"} v={t} min={0.4} max={j.mortiseMember - 0.2} step={0.1} on={setT} />
      <Slider label="Tenon length" v={l} min={0.8} max={j.mortiseDepthMax + 1.5} step={0.1} on={setL} />
      {load && (
        <div className="rounded-md border hairline p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", load.level === "high" ? "bg-alert" : load.level === "watch" ? "bg-walnut" : "bg-teal")} />
            <span className="flex-1">Bending stress in this tenon, current design</span>
            <span className="font-mono text-[11px]">{Math.round(load.utilisation * 100)}% of ref</span>
            <ProvenanceBadge kind="assumption" topic="stress" />
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            σ = M / S = {load.moment.toFixed(1)} N·m / {load.sectionCm3.toFixed(2)} cm³ = {load.stressMPa.toFixed(1)} MPa · reference {load.refMPa.toFixed(1)} MPa
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{load.how} Same calculation as the stress pins on the 3D chair.</div>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center gap-2"><span className="eyebrow">Shop rules</span><ProvenanceBadge kind="rule" topic="joints" /></div>
        {checks.map((c) => (
          <div key={c.rule} className="rounded-md border hairline p-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className={cn("h-2 w-2 rounded-full", dot[c.level])} />
              <span className="flex-1">{c.rule}</span>
              <span className={cn("font-mono text-[11px]", tone[c.level])}>{c.value}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{c.advice}</div>
          </div>
        ))}
      </div>
      <button onClick={() => { setT(j.tenonT); setL(j.tenonL); }} className="text-[11px] text-teal hover:underline">Reset to the shop default</button>
    </div>
  );
}

function Slider({ label, v, min, max, step, on }: { label: string; v: number; min: number; max: number; step: number; on: (n: number) => void }) {
  return (
    <label className="block text-xs">
      <div className="flex justify-between"><span>{label}</span><span className="font-mono">{v.toFixed(1)} cm</span></div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-teal)]" />
    </label>
  );
}
