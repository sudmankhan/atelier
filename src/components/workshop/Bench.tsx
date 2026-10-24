import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Send, Volume2, VolumeX } from "lucide-react";
import { PARTS, PART_ORDER, type PartId } from "@/lib/chair/parts";
import { J_PARTS, J_PART_ORDER, type JPartId } from "@/lib/chair/japanese/parts";
import { computeGeometry, type ChairGeometry } from "@/lib/chair/geometry";
import { computeJapanese, type JGeometry } from "@/lib/chair/japanese/geometry";
import { BASELINE, type ChairParams } from "@/lib/chair/params";
import { J_BASELINE, type JapaneseParams } from "@/lib/chair/japanese/params";
import type { Observation } from "@/lib/chair/consequences";
import { techniquesFor } from "@/lib/techniques";
import { retrieveSync } from "@/lib/knowledge/retrieve";
import { BUILD_STEPS, WALKTHROUGH } from "@/lib/lessons";
import { askMaster, speakMaster, voiceStatus } from "@/lib/mentor.functions";
import { SideProfile } from "@/components/SideProfile";
import { ShopSheet } from "./ShopSheet";
import { LumberStudio } from "./LumberStudio";
import { JointInspector } from "./JointInspector";
import { useWorkshop, type AnyPartId, type BenchTab } from "./store";
import { cn } from "@/lib/utils";

const MEASURES: Record<string, { label: string; get: (p: ChairParams, g: ChairGeometry) => string }> = {
  seatHeight: { label: "Seat height (front)", get: (p) => `${p.seatHeight.toFixed(1)} cm` },
  seatWidth: { label: "Seat width", get: (p) => `${p.seatWidth.toFixed(1)} cm` },
  seatDepth: { label: "Seat depth", get: (p) => `${p.seatDepth.toFixed(1)} cm` },
  backAngle: { label: "Seat-to-back angle", get: (p) => `${p.backAngle.toFixed(1)}°` },
  frontLegLength: { label: "Front leg length", get: (_, g) => `${g.frontLegLength.toFixed(1)} cm` },
  rearLegAngle: { label: "Rear support from vertical", get: (_, g) => `${g.rearLegAngle.toFixed(1)}°` },
  backRecline: { label: "Back lean from vertical", get: (_, g) => `${g.backRecline.toFixed(1)}°` },
  overallHeight: { label: "Overall height", get: (_, g) => `${g.overallHeight.toFixed(1)} cm` },
  railLength: { label: "Rail length (shoulders)", get: (_, g) => `${g.railLength.toFixed(1)} cm` },
  footprintWidth: { label: "Footprint width", get: (_, g) => `${g.footprintWidth.toFixed(1)} cm` },
  caneArea: { label: "Woven area (approx.)", get: (p, g) => `${(((p.seatWidth - 6) * (p.seatDepth - 8) + (p.seatWidth - 6) * (g.backrestLength - 5)) / 10000).toFixed(2)} m²` },
  rearJointAngle: { label: "Back post ↔ rear support", get: (_, g) => `${g.rearJointAngle.toFixed(1)}°` },
  frontJointAngle: { label: "Front leg ↔ seat", get: (_, g) => `${g.frontJointAngle.toFixed(1)}°` },
};

const J_MEASURES: Record<string, { label: string; get: (p: JapaneseParams, g: JGeometry) => string }> = {
  seatHeight: { label: "Seat height", get: (p) => `${p.seatHeight.toFixed(1)} cm` },
  seatWidth: { label: "Seat width", get: (p) => `${p.seatWidth.toFixed(1)} cm` },
  seatDepth: { label: "Seat depth", get: (p) => `${p.seatDepth.toFixed(1)} cm` },
  backHeight: { label: "Back height", get: (p) => `${p.backHeight.toFixed(1)} cm` },
  legLength: { label: "Leg length (true)", get: (_, g) => `${g.legLength.toFixed(1)} cm` },
  legSeatAngle: { label: "Leg ↔ seat angle", get: (_, g) => `${g.legSeatAngle.toFixed(1)}°` },
  footprintWidth: { label: "Footprint width", get: (_, g) => `${g.footprintWidth.toFixed(1)} cm` },
  footprintDepth: { label: "Footprint depth", get: (_, g) => `${g.footprintDepth.toFixed(1)} cm` },
  spindleSpacing: { label: "Spindle spacing", get: (_, g) => `${g.spindleSpacing.toFixed(1)} cm` },
  spindleLength: { label: "Spindle length (approx.)", get: (_, g) => `${g.spindleLength.toFixed(1)} cm` },
  crestSpan: { label: "Crest span", get: (_, g) => `${g.crestSpan.toFixed(1)} cm` },
  overallHeight: { label: "Overall height", get: (_, g) => `${g.overallHeight.toFixed(1)} cm` },
  armHeight: { label: "Arm height at post", get: (p) => `${(p.seatHeight + p.armHeight).toFixed(1)} cm` },
  armSlope: { label: "Arm slope", get: (_, g) => `${g.armSlope.toFixed(1)}°` },
};

const K_MISALIGNED: Record<string, string> = {
  frontJoint: "front leg / seat",
  rearJoint: "back post / rear support",
  railJoints: "rear rail shoulders",
  backTopJoint: "back top rail",
};
const J_MISALIGNED: Record<string, string> = {
  legJoints: "leg / seat sockets",
  armJoints: "arm / post joints",
};

const TABS: { id: BenchTab; label: string }[] = [
  { id: "inspect", label: "Inspect" },
  { id: "geometry", label: "Geometry" },
  { id: "feedback", label: "Feedback" },
  { id: "shop", label: "Shop" },
  { id: "lumber", label: "Lumber" },
  { id: "joints", label: "Joints" },
  { id: "ask", label: "Ask" },
];

export function Bench() {
  const w = useWorkshop();
  const [open, setOpen] = useState(true);
  if (!open)
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center border-l hairline bg-card pt-6">
        <button onClick={() => setOpen(true)} aria-label="Open the Master's Bench" className="rounded-md p-1.5 hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
        <span className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">Master's Bench</span>
      </aside>
    );
  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l hairline bg-card">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between"><div className="eyebrow">The Master's Bench</div><button onClick={() => setOpen(false)} aria-label="Hide the Master's Bench" className="rounded-md p-1 hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button></div>
        <div className="mt-3 flex gap-3 border-b hairline">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => w.setBenchTab(t.id)}
              className={cn(
                "-mb-px border-b-2 pb-2.5 text-xs transition-colors",
                w.benchTab === t.id ? "border-teal text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={w.benchTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {w.benchTab === "inspect" && <Inspect />}
            {w.benchTab === "geometry" && <Geometry />}
            {w.benchTab === "feedback" && <Feedback />}
            {w.benchTab === "shop" && <ShopSheet />}
            {w.benchTab === "lumber" && <LumberStudio />}
            {w.benchTab === "joints" && <JointInspector />}
            {w.benchTab === "ask" && <Ask />}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

function PartChips({ parts }: { parts: AnyPartId[] }) {
  const w = useWorkshop();
  const names = w.typology === "kangaroo" ? PARTS : J_PARTS;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {parts.map((p) => (
        <button key={p} onClick={() => w.select(p)} className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] text-teal hover:underline">
          {(names as Record<string, { name: string }>)[p]?.name ?? p}
        </button>
      ))}
    </div>
  );
}

function Inspect() {
  const w = useWorkshop();
  const isK = w.typology === "kangaroo";
  const params = w.section === "design" ? w.params : isK ? BASELINE : J_BASELINE;
  const g = isK ? computeGeometry(params as ChairParams) : computeJapanese(params as JapaneseParams);
  const parts = isK ? PARTS : J_PARTS;
  const order: AnyPartId[] = isK ? PART_ORDER : J_PART_ORDER;
  const measures = isK ? MEASURES : J_MEASURES;

  if (!w.selected)
    return (
      <div className="p-5">
        <h3 className="text-2xl">Select a component</h3>
        <p className="mt-2 text-sm text-muted-foreground">Click any part of the chair to study its purpose, material and construction — or choose one here.</p>
        <div className="mt-5 divide-y hairline border-y hairline">
          {order.map((p) => (
            <button key={p} onClick={() => w.select(p)} className="flex w-full items-center justify-between py-3 text-left text-sm hover:text-teal">
              {(parts as Record<string, { name: string }>)[p]!.name}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
            </button>
          ))}
        </div>
      </div>
    );
  const part = (parts as Record<string, { id: string; name: string; purpose: string; material: string; relationships: string; observations: string[]; challenges: string[]; measures: string[] }>)[w.selected]!;
  const refs = retrieveSync(part.name, { partId: w.selected, typology: w.typology }, 2);
  const techs = techniquesFor(w.selected, w.typology).slice(0, 3);
  return (
    <div className="space-y-5 p-5">
      <div>
        <div className="eyebrow text-teal">Selected component</div>
        <h3 className="mt-1 text-3xl">{part.name}</h3>
        <p className="mt-3 text-sm leading-relaxed">{part.purpose}</p>
      </div>
      <button
        onClick={() => w.askMasterAbout(`Why is the ${part.name.toLowerCase()} designed this way?`)}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:opacity-90"
      >
        Why is it designed this way?
      </button>
      <Field label="Material">{part.material}</Field>
      <Field label="Relationships">{part.relationships}</Field>
      <div>
        <div className="eyebrow">Measurements</div>
        <dl className="mt-2 divide-y hairline">
          {part.measures.map((m) => (
            <div key={m} className="flex justify-between py-1.5 text-xs">
              <dt className="text-muted-foreground">{measures[m]?.label ?? m}</dt>
              <dd className="font-mono text-measure">{measures[m] ? (measures[m].get as (p: never, g: never) => string)(params as never, g as never) : "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Field label="Design observations">
        <ul className="list-disc space-y-1 pl-4">{part.observations.map((o) => <li key={o}>{o}</li>)}</ul>
      </Field>
      <Field label="Construction challenges">
        <ul className="list-disc space-y-1 pl-4">{part.challenges.map((o) => <li key={o}>{o}</li>)}</ul>
      </Field>
      <div>
        <div className="eyebrow">Learn the craft</div>
        <ul className="mt-2 space-y-1.5">
          {techs.map((t) => (
            <li key={t.id}>
              <button onClick={() => w.setSection("library")} className="group flex w-full items-start justify-between gap-2 text-left text-xs hover:text-teal">
                <span>
                  {t.title}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">Step-by-step guide · Library</span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
              </button>
            </li>
          ))}
          {refs.map((r) => (
            <li key={r.id}>
              <button onClick={() => w.setSection("library")} className="group flex w-full items-start justify-between gap-2 text-left text-xs hover:text-teal">
                <span>
                  {r.topic}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">Principle · Library</span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1.5 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function Geometry() {
  const w = useWorkshop();
  const isK = w.typology === "kangaroo";
  const { current: g, baseline: b } = w.consequences;
  const rows: [string, number, number, string][] = isK
    ? (() => {
        const p = w.params as ChairParams;
        const gc = g as ChairGeometry;
        const gb = b as ChairGeometry;
        return [
          ["Seat height", p.seatHeight, BASELINE.seatHeight, "cm"],
          ["Seat width", p.seatWidth, BASELINE.seatWidth, "cm"],
          ["Seat depth", p.seatDepth, BASELINE.seatDepth, "cm"],
          ["Backrest angle", p.backAngle, BASELINE.backAngle, "°"],
          ["Back lean from vertical", gc.backRecline, gb.backRecline, "°"],
          ["Front leg length", gc.frontLegLength, gb.frontLegLength, "cm"],
          ["Rear support angle", gc.rearLegAngle, gb.rearLegAngle, "°"],
          ["Rail length", gc.railLength, gb.railLength, "cm"],
          ["Footprint depth", gc.footprintDepth, gb.footprintDepth, "cm"],
          ["Overall height", gc.overallHeight, gb.overallHeight, "cm"],
          ["Back post ↔ rear support", gc.rearJointAngle, gb.rearJointAngle, "°"],
        ];
      })()
    : (() => {
        const p = w.params as JapaneseParams;
        const gc = g as JGeometry;
        const gb = b as JGeometry;
        return [
          ["Seat height", p.seatHeight, J_BASELINE.seatHeight, "cm"],
          ["Seat width", p.seatWidth, J_BASELINE.seatWidth, "cm"],
          ["Seat depth", p.seatDepth, J_BASELINE.seatDepth, "cm"],
          ["Back height", p.backHeight, J_BASELINE.backHeight, "cm"],
          ["Leg splay", p.legSplay, J_BASELINE.legSplay, "°"],
          ["Leg length", gc.legLength, gb.legLength, "cm"],
          ["Leg ↔ seat angle", gc.legSeatAngle, gb.legSeatAngle, "°"],
          ["Spindle spacing", gc.spindleSpacing, gb.spindleSpacing, "cm"],
          ["Arm slope", gc.armSlope, gb.armSlope, "°"],
          ["Footprint width", gc.footprintWidth, gb.footprintWidth, "cm"],
          ["Overall height", gc.overallHeight, gb.overallHeight, "cm"],
        ];
      })();
  return (
    <div className="p-5">
      <h3 className="text-2xl">Side elevation</h3>
      <p className="mt-1 text-xs text-muted-foreground">Solid: current design. Dashed blue: original. Computed from the same geometry as the 3D model.</p>
      <div className="mt-3 rounded-lg border hairline bg-background grid-paper">
        <SideProfile params={w.params} typology={w.typology} className="w-full" />
      </div>
      <table className="mt-4 w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-1 font-normal">Measure</th>
            <th className="py-1 text-right font-normal">Original</th>
            <th className="py-1 text-right font-normal">Current</th>
            <th className="py-1 text-right font-normal">Δ</th>
          </tr>
        </thead>
        <tbody className="divide-y hairline font-mono">
          {rows.map(([l, c, o, u]) => {
            const d = c - o;
            return (
              <tr key={l}>
                <td className="py-1.5 font-sans">{l}</td>
                <td className="py-1.5 text-right text-muted-foreground">{o.toFixed(1)}</td>
                <td className="py-1.5 text-right">{c.toFixed(1)}{u}</td>
                <td className={cn("py-1.5 text-right", Math.abs(d) > 0.05 ? "text-teal" : "text-muted-foreground")}>
                  {Math.abs(d) > 0.05 ? `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ObsGroup({ title, tag, items }: { title: string; tag: string; items: Observation[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h4 className="font-serif text-lg">{title}</h4>
        <span className="eyebrow">{tag}</span>
      </div>
      {items.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No changes in this category yet.</p>}
      <AnimatePresence initial={false}>
        {items.map((o) => (
          <motion.div
            key={o.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("mt-2 overflow-hidden rounded-lg border-l-2 bg-background px-3 py-2.5", o.attention ? "border-alert" : "border-teal")}
          >
            <div className="text-sm">{o.title}</div>
            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{o.detail}</div>
            <PartChips parts={o.parts} />
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  );
}

function Feedback() {
  const w = useWorkshop();
  const c = w.consequences;
  const labels = w.typology === "kangaroo" ? K_MISALIGNED : J_MISALIGNED;
  return (
    <div className="space-y-6 p-5">
      <div>
        <h3 className="text-2xl">Design Consequences</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Geometry is calculated exactly. Human-factors and craft notes are reviewed guidance — not safety ratings or comfort guarantees.
        </p>
        {w.section !== "design" && (
          <button onClick={() => w.setSection("design")} className="mt-3 text-xs text-teal hover:underline">
            Open the Design Studio to change the chair →
          </button>
        )}
      </div>
      {c.misaligned.length > 0 && (
        <div className="rounded-lg bg-alert/10 px-3 py-2.5 text-xs text-foreground">
          <span className="font-semibold text-alert">Connections out of alignment: </span>
          {c.misaligned.map((m) => labels[m] ?? m).join(", ")}
          . Their angles differ from the original beyond tolerance, so joints laid out for the original would not seat.
        </div>
      )}
      <ObsGroup title="Geometry" tag="Measured" items={c.geometry} />
      <ObsGroup title="Human Factors" tag="Guidance" items={c.human} />
      <ObsGroup title="Craftsmanship" tag="Guidance" items={c.craft} />
      <div className="rounded-lg bg-secondary/60 p-3">
        <label className="text-xs">
          Your seated knee height (popliteal), optional
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              min={30}
              max={60}
              value={w.user.poplitealHeight ?? ""}
              onChange={(e) => w.setUser({ poplitealHeight: e.target.value ? Number(e.target.value) : undefined })}
              className="w-20 rounded-md border hairline bg-card px-2 py-1 font-mono text-xs outline-none focus:border-teal"
            />
            <span className="text-muted-foreground">cm — floor to the back of the knee, seated</span>
          </div>
        </label>
      </div>
      <button
        disabled={c.changed.length === 0}
        onClick={() => w.askMasterAbout("Explain the consequences of my design changes, and what I should consider as a maker.")}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-40"
      >
        Have the Master explain these changes
      </button>
    </div>
  );
}

function Ask() {
  const w = useWorkshop();
  const ask = useServerFn(askMaster);
  const speak = useServerFn(speakMaster);
  const status = useServerFn(voiceStatus);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voice, setVoice] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    status().then((s) => setVoice(s.configured)).catch(() => setVoice(false));
  }, [status]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [w.chat.length, busy]);

  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    const history = w.chat.map((m) => ({ role: m.role, content: m.content }));
    w.setChat((c) => [...c, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    const c = w.consequences;
    const lesson =
      w.section === "study" ? WALKTHROUGH[w.progress.walkStep]?.title : w.section === "build" ? BUILD_STEPS[w.progress.buildStep]?.title : null;
    try {
      const r = await ask({
        data: {
          question: q,
          history,
          context: {
            typology: w.typology,
            section: w.section,
            partName,
            lesson: lesson ?? null,
            params: w.params as unknown as Record<string, number | string>,
            changed: c.changed,
            observations: [...c.geometry, ...c.craft].map((o) => `${o.title}: ${o.detail}`),
          },
        },
      });
      w.setChat((m) => [...m, { role: "assistant", content: r.answer, sources: r.sources }]);
    } catch {
      w.setChat((m) => [...m, { role: "assistant", content: "The Master couldn't answer just now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (w.pendingQuestion && handled.current !== w.pendingQuestion) {
      const q = w.pendingQuestion;
      handled.current = q;
      w.clearPending();
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.pendingQuestion]);

  const listen = async (i: number, text: string) => {
    if (playing === i) {
      audio.current?.pause();
      setPlaying(null);
      return;
    }
    setPlaying(i);
    const r = await speak({ data: { text } }).catch(() => null);
    if (!r?.ok || !r.audio) {
      setPlaying(null);
      return;
    }
    audio.current?.pause();
    audio.current = new Audio(`data:audio/mpeg;base64,${r.audio}`);
    audio.current.onended = () => setPlaying(null);
    void audio.current.play();
  };

  const partName = w.selected
    ? ((w.typology === "kangaroo" ? PARTS[w.selected as PartId]?.name : J_PARTS[w.selected as JPartId]?.name) ?? null)
    : null;

  const suggestions =
    w.typology === "kangaroo"
      ? [
          "Why does the Kangaroo Chair use such a low seat?",
          "What happens if I increase the backrest angle?",
          "How would the side frames be joined to the rails?",
        ]
      : [
          "Why are the legs splayed instead of straight?",
          "What happens if I remove spindles?",
          "How are the legs joined to the seat slab?",
        ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="text-xs text-muted-foreground">
          Context: <span className="text-foreground">{partName ?? "whole chair"}</span> · {w.typology} · {w.section}
          {w.consequences.changed.length > 0 && ` · ${w.consequences.changed.length} parameter(s) changed`}
        </div>
        {w.chat.length === 0 && (
          <div>
            <h3 className="text-2xl">Ask the Master</h3>
            <p className="mt-2 text-sm text-muted-foreground">A patient craft instructor who knows what you're looking at and what you've changed.</p>
            <div className="mt-4 space-y-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="block w-full rounded-md border hairline px-3 py-2 text-left text-xs hover:border-teal">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {w.chat.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-8 rounded-lg bg-secondary px-3 py-2 text-sm">{m.content}</div>
          ) : (
            <div key={i} className="text-sm leading-relaxed">
              <div className="eyebrow mb-1">The Master</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {m.sources.map((s) =>
                    s.url ? (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-[11px] text-teal hover:underline">
                        {s.title} ↗
                      </a>
                    ) : (
                      <span key={s.title} className="text-[11px] text-muted-foreground">{s.title}</span>
                    ),
                  )}
                </div>
              )}
              {voice && (
                <button onClick={() => listen(i, m.content)} className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                  {playing === i ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {playing === i ? "Stop" : "Listen to the Master"}
                </button>
              )}
            </div>
          ),
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> The Master is considering…
          </div>
        )}
        <div ref={end} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2 border-t hairline p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about form, joinery, materials…"
          className="min-w-0 flex-1 rounded-md border hairline bg-background px-3 py-2 text-sm outline-none focus:border-teal"
        />
        <button disabled={busy || !input.trim()} aria-label="Send" className="rounded-md bg-primary px-3 text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {!voice && <div className="px-4 pb-2 text-[10px] text-muted-foreground">Silent text mode — voice narration isn't configured.</div>}
    </div>
  );
}
