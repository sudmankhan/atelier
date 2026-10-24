import { useState } from "react";
import { Maximize2, Minimize2, ScanEye } from "lucide-react";
import {
  BLANK,
  JOINT_FACTOR,
  WOODS,
  evaluateLab,
  labScore,
  tipMargin,
  type Back,
  type Base,
  type LabDesign,
  type Level,
} from "@/lib/lab";
import { StudioShell } from "@/components/three/StudioCanvas";
import { LabModel } from "@/components/three/LabModel";
import { cn } from "@/lib/utils";

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
const tone: Record<Level, string> = {
  good: "border-teal",
  warn: "border-walnut",
  bad: "border-alert",
};
const txt: Record<Level, string> = { good: "text-teal", warn: "text-walnut", bad: "text-alert" };

export function ComponentLab() {
  const [d, setD] = useState<LabDesign>(BLANK);
  const [tested, setTested] = useState(false);
  const [xray, setXray] = useState(false);
  const [panel, setPanel] = useState(true);
  const set = <K extends keyof LabDesign>(k: K, v: LabDesign[K]) => {
    setD((x) => ({ ...x, [k]: v }));
  };
  const results = evaluateLab(d);
  const score = labScore(results);
  const tips = tested && tipMargin(d) < 0;
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden">
      <div
        className={cn(
          "absolute inset-y-0 right-0 transition-[left] duration-300",
          panel ? "left-[22rem]" : "left-0",
        )}
      >
        <StudioShell initial="three">
          <LabModel d={d} xray={xray} tipping={tips} />
        </StudioShell>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <div className="pointer-events-auto">
          <div className="eyebrow">Component Lab · blank bench</div>
          <h2 className="mt-1 text-2xl">Build your own chair in 3D</h2>
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
          <button
            onClick={() => setXray(!xray)}
            aria-pressed={xray}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-3 text-xs",
              xray ? "bg-teal text-accent-foreground" : "hover:bg-secondary",
            )}
          >
            <ScanEye className="h-3.5 w-3.5" /> X-ray joints
          </button>
          <button
            onClick={() => setPanel(!panel)}
            className="flex h-9 items-center gap-2 rounded-md px-3 text-xs hover:bg-secondary"
          >
            {panel ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" /> Hide parts
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" /> Show parts
              </>
            )}
          </button>
        </div>
      </div>

      {panel && (
        <div className="absolute z-10 left-5 top-24 bottom-5 w-80 space-y-4 overflow-y-auto rounded-xl border hairline bg-card/95 p-4 shadow-sm backdrop-blur">
          <Pick title="Base" opts={BASES} v={d.base} on={(v) => set("base", v)} />
          <Pick title="Back" opts={BACKS} v={d.back} on={(v) => set("back", v)} />
          <Pick
            title="Joints"
            opts={Object.entries(JOINT_FACTOR).map(([id, j]) => ({
              id: id as LabDesign["joint"],
              label: j.name,
            }))}
            v={d.joint}
            on={(v) => set("joint", v)}
          />
          <Pick
            title="Wood"
            opts={Object.entries(WOODS).map(([id, x]) => ({
              id: id as LabDesign["wood"],
              label: x.name,
            }))}
            v={d.wood}
            on={(v) => set("wood", v)}
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Num
              label="Seat height"
              u="cm"
              v={d.seatHeight}
              min={30}
              max={60}
              on={(n) => set("seatHeight", n)}
            />
            <Num
              label="Seat depth"
              u="cm"
              v={d.seatDepth}
              min={30}
              max={60}
              on={(n) => set("seatDepth", n)}
            />
            <Num
              label="Seat width"
              u="cm"
              v={d.seatWidth}
              min={34}
              max={60}
              on={(n) => set("seatWidth", n)}
            />
            <Num
              label="Leg thickness"
              u="cm"
              v={d.legThickness}
              min={2}
              max={5}
              step={0.1}
              on={(n) => set("legThickness", n)}
            />
            <Num label="Leg splay" u="°" v={d.splay} min={0} max={20} on={(n) => set("splay", n)} />
            {d.back !== "none" && (
              <Num
                label="Seat-to-back"
                u="°"
                v={d.backAngle}
                min={88}
                max={130}
                on={(n) => set("backAngle", n)}
              />
            )}
            {d.back !== "none" && (
              <Num
                label="Back height"
                u="cm"
                v={d.backHeight}
                min={15}
                max={70}
                on={(n) => set("backHeight", n)}
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={d.stretchers}
              onChange={(e) => set("stretchers", e.target.checked)}
            />{" "}
            Stretchers between the legs
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTested((value) => !value)}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              {tested ? "Hide test results" : "Test this chair"}
            </button>
            <button
              onClick={() => {
                setD(BLANK);
                setTested(false);
              }}
              className="rounded-md border hairline px-4 py-2 text-sm"
            >
              Clear bench
            </button>
          </div>
          <details className="rounded-md border hairline p-2">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Side view with tipping line
            </summary>
            <SideView d={d} />
          </details>
          {tested && (
            <ResultsPanel results={results} score={score} note={WOODS[d.wood].note} tips={tips} />
          )}
        </div>
      )}
    </main>
  );
}

function ResultsPanel({
  results,
  score,
  note,
  tips,
}: {
  results: ReturnType<typeof evaluateLab>;
  score: number;
  note: string;
  tips: boolean;
}) {
  return (
    <section className="border-t hairline pt-4">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Test results</div>
        <span
          className={cn(
            "font-mono text-sm",
            score >= 80 ? "text-teal" : score >= 50 ? "text-walnut" : "text-alert",
          )}
        >
          {score}/100
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {tips && (
          <p className="text-xs text-alert">
            The model is tilted back: this chair tips when someone leans.
          </p>
        )}
        {results.map((r, k) => (
          <div key={k} className={cn("rounded-md border-l-2 bg-background p-2.5", tone[r.level])}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {r.area}
            </div>
            <div className={cn("text-sm", txt[r.level])}>{r.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{r.detail}</div>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Updates as you change parts. {note}</p>
      </div>
    </section>
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
  const tm = tipMargin(d);
  return (
    <svg viewBox={`0 0 340 ${H}`} className="w-full">
      <line x1={0} y1={fy} x2={340} y2={fy} className="stroke-muted-foreground" />
      {d.base === "four" || d.base === "splayed" ? (
        <>
          <line
            x1={x0 + 4}
            y1={sy}
            x2={x0 + 4 - spread}
            y2={fy}
            className="stroke-walnut"
            strokeWidth={lt}
          />
          <line
            x1={x1 - 4}
            y1={sy}
            x2={x1 - 4 + spread}
            y2={fy}
            className="stroke-walnut"
            strokeWidth={lt}
          />
        </>
      ) : d.base === "sled" ? (
        <polyline
          points={`${x0},${sy} ${x0 - 6},${fy} ${x1 + 12},${fy} ${x1},${sy}`}
          className="fill-none stroke-walnut"
          strokeWidth={lt}
        />
      ) : (
        <polyline
          points={`${x0},${sy} ${x0 + 10},${fy} M ${x1},${sy}`}
          className="fill-none stroke-walnut"
          strokeWidth={lt}
        />
      )}
      {d.base === "zframe" && (
        <line
          x1={x1}
          y1={sy - 30}
          x2={x1 + 42}
          y2={fy}
          className="stroke-walnut"
          strokeWidth={lt}
        />
      )}
      {d.stretchers && d.base !== "zframe" && (
        <line x1={x0} y1={fy - 40} x2={x1} y2={fy - 40} className="stroke-walnut" strokeWidth={3} />
      )}
      <line x1={x0 - 4} y1={sy} x2={x1 + 4} y2={sy} className="stroke-foreground" strokeWidth={6} />
      {d.back !== "none" && (
        <line
          x1={x1}
          y1={sy}
          x2={bx}
          y2={by}
          className="stroke-foreground"
          strokeWidth={d.back === "panel" ? 8 : 4}
          strokeDasharray={d.back === "spindles" ? "2 3" : d.back === "slats" ? "10 4" : undefined}
        />
      )}
      {/* sitter's leaning weight line */}
      {(() => {
        const cx =
          x0 +
          (d.seatDepth * 0.65 +
            Math.max(0, d.backAngle - 95) * (d.back === "none" ? 0 : 0.6) +
            (d.back === "none" ? 0 : 3)) *
            s;
        return (
          <g>
            <line
              x1={cx}
              y1={sy - 60}
              x2={cx}
              y2={fy}
              className={tm < 0 ? "stroke-alert" : "stroke-teal"}
              strokeDasharray="4 3"
            />
            <text
              x={cx + 4}
              y={sy - 50}
              fontSize={9}
              className={tm < 0 ? "fill-alert" : "fill-teal"}
            >
              sitter's weight (leaning)
            </text>
          </g>
        );
      })()}
      <text x={6} y={14} fontSize={9} className="fill-muted-foreground">
        If the dashed line falls behind the rear foot, the chair tips.
      </text>
    </svg>
  );
}

function Pick<T extends string>({
  title,
  opts,
  v,
  on,
}: {
  title: string;
  opts: { id: T; label: string }[];
  v: T;
  on: (v: T) => void;
}) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button
            key={o.id}
            onClick={() => on(o.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              v === o.id
                ? "border-teal bg-teal-soft text-teal"
                : "hairline text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Num({
  label,
  u,
  v,
  min,
  max,
  step = 1,
  on,
}: {
  label: string;
  u: string;
  v: number;
  min: number;
  max: number;
  step?: number;
  on: (n: number) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono">
          {v}
          {u}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => on(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--color-teal)]"
      />
    </label>
  );
}
