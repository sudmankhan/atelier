import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, FileJson, Maximize2, Minimize2, ScanEye, X } from "lucide-react";
import { labToSpec } from "@/lib/furniture/fromLab";
import { saveDesign } from "@/lib/furniture/saved";
import { SETTINGS, type Setting } from "@/lib/weather";
import { wordByTerm } from "@/lib/words";
import { BeginnerToggle, ResultRow, useBeginner, Words } from "@/components/Words";
import { BLANK, JOINT_TYPES, WOODS, evaluateLab, labTipping, type Back, type Base, type LabDesign } from "@/lib/lab";
import { StudioShell } from "@/components/three/StudioCanvas";
import { LabModel } from "@/components/three/LabModel";
import { cn } from "@/lib/utils";
import { labRearPivotZ } from "@/lib/statics";
import { StaticsPanel } from "./StaticsPanel";
import { BeamPanel } from "./BeamPanel";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { useWorkshop } from "./store";

const BASES: { id: Base; label: string }[] = [
  { id: "four", label: "4 straight legs" },
  { id: "splayed", label: "4 splayed legs" },
  { id: "sled", label: "Sled base" },
  { id: "zframe", label: "Z-frame (Kangaroo)" },
];
const BACKS: { id: Back; label: string }[] = [
  { id: "none", label: "No back" },
  { id: "slats", label: "Slats" },
  { id: "spindles", label: "Spindles" },
  { id: "panel", label: "Solid panel" },
];

export function ComponentLab() {
  const { mark } = useWorkshop();
  const [d, setD] = useState<LabDesign>(BLANK);
  const [tested, setTested] = useState(false);
  const [xray, setXray] = useState(false);
  const [panel, setPanel] = useState(true);
  const set = <K extends keyof LabDesign>(k: K, v: LabDesign[K]) => { mark("pick"); setD((x) => ({ ...x, [k]: v })); };
  const [knee, setKnee] = useState<number | "">("");
  const [setting, setSetting] = useState<Setting>("indoor");
  const results = evaluateLab(d, knee === "" ? { setting } : { poplitealHeight: knee, setting });
  const tip = labTipping(d);
  const tips = tested && results.some((r) => r.area === "Stability" && r.level === "bad");
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <StudioShell initial="three">
          <group position={[panel ? 0.3 : 0, 0, 0]}><LabModel d={d} xray={xray} tipping={tips} /></group>
        </StudioShell>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <div className="pointer-events-auto">
          <div className="eyebrow">Build your own</div>
          <h2 className="mt-1 text-2xl">Pick parts, then test your chair</h2>
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
          <BeginnerToggle />
          <button onClick={() => setXray(!xray)} aria-pressed={xray} title="See-through view: the wood turns glassy so you can see where each joint sits and how big it is" className={cn("flex h-9 items-center gap-2 rounded-md px-3 text-xs", xray ? "bg-teal text-accent-foreground" : "hover:bg-secondary")}>
            <ScanEye className="h-3.5 w-3.5" /> See joints
          </button>
          <button onClick={() => setPanel(!panel)} title="Hide or show the parts menu" className="flex h-9 items-center gap-2 rounded-md px-3 text-xs hover:bg-secondary">
            {panel ? <><Minimize2 className="h-3.5 w-3.5" /> Hide menu</> : <><Maximize2 className="h-3.5 w-3.5" /> Show menu</>}
          </button>
        </div>
      </div>

      {panel && (
        <div className="absolute z-10 left-5 top-24 bottom-5 w-80 space-y-4 overflow-y-auto rounded-xl border hairline bg-card/95 p-4 shadow-sm backdrop-blur">
          <Pick title="Base" hint="What the chair stands on." opts={BASES} v={d.base} on={(v) => set("base", v)} />
          <Pick title="Back" hint="What you lean on. No back = a stool." opts={BACKS} v={d.back} on={(v) => set("back", v)} />
          <Pick title="Joints" hint="How the legs lock into the seat. Mortise & tenon is strongest, screws weakest." opts={Object.entries(JOINT_TYPES).map(([id, j]) => ({ id: id as LabDesign["joint"], label: j.name }))} v={d.joint} on={(v) => set("joint", v)} />
          <Pick title="Wood" hint="Harder wood holds joints tighter; pine is soft." opts={Object.entries(WOODS).map(([id, x]) => ({ id: id as LabDesign["wood"], label: x.name }))} v={d.wood} on={(v) => set("wood", v)} />
          <Pick title="Where will it live?" hint="Outdoors, wood gets wet, rots and moves more." opts={SETTINGS.map((x) => ({ id: x.id, label: x.label, tip: x.hint }))} v={setting} on={setSetting} />
          <div className="eyebrow">Sizes</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Num label="Seat height" u="cm" v={d.seatHeight} min={30} max={60} on={(n) => set("seatHeight", n)} />
            <Num label="Seat depth" u="cm" v={d.seatDepth} min={30} max={60} on={(n) => set("seatDepth", n)} />
            <Num label="Seat width" u="cm" v={d.seatWidth} min={34} max={60} on={(n) => set("seatWidth", n)} />
            <Num label="Leg thickness" u="cm" v={d.legThickness} min={2} max={5} step={0.1} on={(n) => set("legThickness", n)} />
            <Num label="Leg splay" u="°" v={d.splay} min={0} max={20} on={(n) => set("splay", n)} />
            {d.back !== "none" && <Num label="Seat-to-back" u="°" v={d.backAngle} min={88} max={130} on={(n) => set("backAngle", n)} />}
            {d.back !== "none" && <Num label="Back height" u="cm" v={d.backHeight} min={15} max={70} on={(n) => set("backHeight", n)} />}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={d.stretchers} onChange={(e) => set("stretchers", e.target.checked)} /> <span>Add stretchers <span className="text-muted-foreground">— bars between the legs that stop sideways wobble</span></span>
          </label>
          <div className="flex gap-2">
            <button onClick={() => { mark("test"); setTested(true); }} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Test this chair</button>
            <button onClick={() => { setD(BLANK); setTested(false); }} className="rounded-md border hairline px-4 py-2 text-sm">Clear bench</button>
          </div>
          <SaveDesign d={d} />
          <details className="rounded-md border hairline p-2" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) mark("math"); }}>
            <summary className="cursor-pointer text-xs text-muted-foreground">Show the math — side view, tipping, leg bending, your knee height</summary>
            <div className="mt-3 space-y-4">
              <label className="block text-xs">
                <span>Your knee height (optional, cm) <span className="text-muted-foreground">— checks the seat height fits your legs</span></span>
                <input type="number" min={30} max={65} value={knee} placeholder="floor to back of knee, seated" onChange={(e) => setKnee(e.target.value === "" ? "" : +e.target.value)} className="mt-1 w-full rounded border hairline bg-background px-2 py-1" />
              </label>
              <div>
                <div className="eyebrow mb-1">Side view: where the weight falls</div>
                <SideView d={d} />
              </div>
              <div>
                <StaticsPanel pivotZ={labRearPivotZ(d)} seatRearZ={-d.seatDepth / 2} seatFrontZ={d.seatDepth / 2} seatHeight={d.seatHeight} chair={tip.mass} reclineDeg={d.back === "none" ? 0 : d.backAngle - 90} pushHeightCm={tip.pushHeightCm} />
              </div>
              <div>
                <div className="eyebrow mb-1">How much a leg bends (straight leg, teaching model)</div>
                <BeamPanel key={`${d.wood}-${d.seatHeight}-${d.legThickness}`} initialLengthCm={d.seatHeight} initialSectionCm={d.legThickness} initialWood={d.wood} />
              </div>
            </div>
          </details>
        </div>
      )}

      {tested && (
        <ResultsCard results={results} note={WOODS[d.wood].note} tips={tips} onClose={() => setTested(false)} />
      )}
    </main>
  );
}

function ResultsCard({ results, note, tips, onClose }: { results: ReturnType<typeof evaluateLab>; note: string; tips: boolean; onClose: () => void }) {
  const [min, setMin] = useState(false);
  const [beginner] = useBeginner();
  const counts = { good: 0, warn: 0, bad: 0 };
  for (const r of results) counts[r.level]++;
  return (
    <div className="absolute z-10 right-5 bottom-5 w-80 rounded-xl border hairline bg-card/95 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Test results</div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]">
            <span className="text-teal">{counts.good} good</span> · <span className="text-walnut">{counts.warn} to watch</span> · <span className="text-alert">{counts.bad} problem{counts.bad === 1 ? "" : "s"}</span>
          </span>
          <button onClick={() => setMin(!min)} aria-label="Minimize results">{min ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}</button>
          <button onClick={onClose} aria-label="Close results"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {!min && (
        <div className="mt-2 max-h-[50vh] space-y-2 overflow-y-auto">
          {tips && <p className="text-xs text-alert">The model is tilted back because the static tipping check says a gentle lean tips it.</p>}
          {results.map((r, k) => (
            <ResultRow key={k} r={r} beginner={beginner} badge={<ProvenanceBadge kind={r.basis} topic={r.area === "Weather" ? "weather" : "lab"} />} />
          ))}
          <p className="text-[11px] text-muted-foreground">Updates as you change parts. {note}</p>
        </div>
      )}
    </div>
  );
}

function SideView({ d }: { d: LabDesign }) {
  const s = 3; // px per cm
  const H = 260;
  const fy = H - 10;
  const sy = fy - d.seatHeight * s;
  const x0 = 60;
  const x1 = x0 + d.seatDepth * s;
  const spread = Math.tan((d.splay * Math.PI) / 180) * d.seatHeight * s;
  const lt = Math.max(4, d.legThickness * s);
  const recl = ((d.backAngle - 90 + 5) * Math.PI) / 180;
  const bx = x1 + Math.sin(recl) * d.backHeight * s;
  const by = sy - Math.cos(recl) * d.backHeight * s;
  const tip = labTipping(d);
  return (
    <svg viewBox={`0 0 340 ${H}`} className="w-full">
      <line x1={0} y1={fy} x2={340} y2={fy} className="stroke-muted-foreground" />
      {d.base === "four" || d.base === "splayed" ? (
        <>
          <line x1={x0 + 4} y1={sy} x2={x0 + 4 - spread} y2={fy} className="stroke-walnut" strokeWidth={lt} />
          <line x1={x1 - 4} y1={sy} x2={x1 - 4 + spread} y2={fy} className="stroke-walnut" strokeWidth={lt} />
        </>
      ) : d.base === "sled" ? (
        <polyline points={`${x0},${sy} ${x0 - 6},${fy} ${x1 + 12},${fy} ${x1},${sy}`} className="fill-none stroke-walnut" strokeWidth={lt} />
      ) : (
        <polyline points={`${x0},${sy} ${x0 + 10},${fy} M ${x1},${sy}`} className="fill-none stroke-walnut" strokeWidth={lt} />
      )}
      {d.base === "zframe" && <line x1={x1} y1={sy - 30} x2={x1 + 42} y2={fy} className="stroke-walnut" strokeWidth={lt} />}
      {d.stretchers && d.base !== "zframe" && <line x1={x0} y1={fy - 40} x2={x1} y2={fy - 40} className="stroke-walnut" strokeWidth={3} />}
      <line x1={x0 - 4} y1={sy} x2={x1 + 4} y2={sy} className="stroke-foreground" strokeWidth={6} />
      {d.back !== "none" && <line x1={x1} y1={sy} x2={bx} y2={by} className="stroke-foreground" strokeWidth={d.back === "panel" ? 8 : 4} strokeDasharray={d.back === "spindles" ? "2 3" : d.back === "slats" ? "10 4" : undefined} />}
      {/* sitter's leaning weight line */}
      {(() => { const cx = x1 - (tip.comZ + d.seatDepth / 2) * s; const px = x1 - (tip.pivotZ + d.seatDepth / 2) * s; const bad = tip.result.status !== "stays"; return (
        <g><line x1={cx} y1={sy - 60} x2={cx} y2={fy} className={bad ? "stroke-alert" : "stroke-teal"} strokeDasharray="4 3" />
          <text x={cx - 4} y={sy - 50} fontSize={9} textAnchor="end" className={bad ? "fill-alert" : "fill-teal"}>sitter + chair weight</text>
          <circle cx={px} cy={fy} r={3} className="fill-walnut" /></g>
      ); })()}
      <text x={6} y={14} fontSize={9} className="fill-muted-foreground">Dashed line = combined centre of mass; dot = rear foot (pivot). {tip.result.thresholdF === null ? "" : `Tips at ${Math.round(tip.result.thresholdF)} N of lean.`}</text>
    </svg>
  );
}

/** Save the bench design as a furniture data file: it then appears on the home screen as its own chair. */
function SaveDesign({ d }: { d: LabDesign }) {
  const navigate = useNavigate();
  const [name, setName] = useState("My chair");
  const [saved, setSaved] = useState<{ id: string; key: string } | null>(null);
  const key = JSON.stringify(d) + name;
  const fresh = saved?.key === key;
  const save = () => {
    const spec = labToSpec(d, name);
    saveDesign(spec);
    setSaved({ id: spec.id, key });
  };
  return (
    <div className="rounded-md border border-teal/40 bg-teal/5 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-teal"><FileJson className="h-3.5 w-3.5" /> Save as a design</div>
      <p className="mt-1 text-[11px] text-muted-foreground">Turns this chair into its own page, with size sliders, a cut list, lumber fit and assembly steps. The app writes the file for you: no code.</p>
      <div className="mt-2 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Design name" className="min-w-0 flex-1 rounded border hairline bg-background px-2 py-1 text-xs" />
        <button onClick={save} disabled={fresh} className="rounded-md bg-teal px-3 py-1 text-xs text-accent-foreground disabled:opacity-50">{fresh ? "Saved" : "Save"}</button>
      </div>
      {fresh && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="flex items-center gap-1 text-teal"><Check className="h-3 w-3" /> On the home screen under Your own.</span>
          <button onClick={() => navigate({ to: "/workshop", search: { chair: `spec:${saved!.id}` } })} className="flex items-center gap-1 text-walnut hover:underline">Open it <ArrowRight className="h-3 w-3" /></button>
        </div>
      )}
    </div>
  );
}

function Pick<T extends string>({ title, hint, opts, v, on }: { title: string; hint?: string; opts: { id: T; label: string; tip?: string }[]; v: T; on: (v: T) => void }) {
  return (
    <div>
      <div className="eyebrow">{title}</div>
      {hint && <div className="mb-1.5 mt-0.5 text-[11px] text-muted-foreground"><Words text={hint} /></div>}
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button key={o.id} onClick={() => on(o.id)} title={o.tip ?? wordByTerm(o.label)?.plain} className={cn("rounded-full border px-3 py-1 text-xs", v === o.id ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground hover:text-foreground")}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function Num({ label, u, v, min, max, step = 1, on }: { label: string; u: string; v: number; min: number; max: number; step?: number; on: (n: number) => void }) {
  return (
    <label className="block text-xs">
      <div className="flex justify-between"><span>{label}</span><span className="font-mono">{v}{u}</span></div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-teal)]" />
    </label>
  );
}
