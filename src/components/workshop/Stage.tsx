import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Box, Eye, Focus, GitCompare, Layers, Minimize2, Move3d, RotateCcw, Ruler, SlidersHorizontal } from "lucide-react";
import { StudioCanvas } from "@/components/three/StudioCanvas";
import { JapaneseCanvas } from "@/components/three/JapaneseCanvas";
import { BASELINE } from "@/lib/chair/params";
import { J_BASELINE } from "@/lib/chair/japanese/params";
import type { CameraPreset } from "@/lib/lessons";
import { useWorkshop } from "./store";
import { DesignControls } from "./DesignControls";
import { Walkthrough } from "./Walkthrough";
import { AssemblyPractice } from "./AssemblyPractice";
import { cn } from "@/lib/utils";
import { japaneseStress, kangarooStress } from "@/lib/chair/stress";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { ProvenanceBadge } from "./ProvenanceBadge";

function ToolBtn({ active, onClick, children, label }: { active?: boolean; onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-3 text-xs transition-colors",
        active ? "bg-teal text-accent-foreground" : "text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

const LEVEL_TXT = { ok: "text-teal", watch: "text-walnut", high: "text-alert" } as const;
const LEVEL_WORD = { ok: "Plenty of margin", watch: "Working hard — watch this joint", high: "Over the cautious limit — rethink it" } as const;

const TITLES = {
  kangaroo: { name: "Kangaroo-inspired lounge chair", sub: "Chandigarh modernism · teak & cane · educational reconstruction" },
  japanese: { name: "Kuro spindle-back armchair", sub: "Japanese mingei spirit · lacquered frame & solid slab · educational reconstruction" },
} as const;

export function Stage() {
  const w = useWorkshop();
  const [focus, setFocus] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [stressPanel, setStressPanel] = useState(true);
  const isK = w.typology === "kangaroo";
  const isBuild = w.section === "build";
  const isDesign = w.section === "design";
  const isGuided = w.section === "study";
  const visibleParts = undefined;
  const exploded = w.exploded;
  const params = isDesign || isBuild ? (isBuild ? (isK ? BASELINE : w.params) : w.params) : w.section === "study" ? (isK ? BASELINE : w.params) : w.params;
  const showConsequences = isDesign;
  const t = TITLES[w.typology];
  const [stressOn, setStressOn] = useState(false);
  const report = useMemo(
    () => (isK ? kangarooStress(params as ChairParams) : japaneseStress(params as JapaneseParams)),
    [isK, params],
  );
  const stress = stressOn ? report : null;

  const views: { id: CameraPreset; label: string }[] = [
    { id: "three", label: "¾" },
    { id: "front", label: "Front" },
    { id: "side", label: "Side" },
    { id: "top", label: "Top" },
  ];

  // The anatomy walkthrough currently follows the Kangaroo chair only.
  if (isGuided && !isK) {
    return (
      <div className="relative flex min-w-0 flex-1 items-center justify-center paper">
        <div className="max-w-md rounded-xl border hairline bg-card p-8 text-center shadow-sm">
          <div className="eyebrow">Anatomy walkthrough</div>
          <h2 className="mt-2 text-2xl">This guided lesson follows the Kangaroo chair</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The anatomy walkthrough is written for the Kangaroo. The Japanese armchair works in the Parametric Studio and the Assembly order practice.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => w.setTypology("kangaroo")} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              Switch to the Kangaroo
            </button>
            <button onClick={() => w.setSection("design")} className="rounded-md border hairline px-4 py-2 text-sm">
              Open the Parametric Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden">
      <div className="absolute inset-0">
        {isK ? (
          <StudioCanvas
            params={params as typeof BASELINE}
            selected={w.selected as never}
            onSelect={(p) => {
              w.select(p);
              w.setBenchTab("inspect");
            }}
            onMiss={() => w.select(null)}
            exploded={exploded}
            visibleParts={visibleParts}
            affected={showConsequences ? (w.consequences.affectedParts as never) : []}
            misaligned={showConsequences ? (w.consequences.misaligned as never) : []}
            ghostParams={isDesign && w.compare ? BASELINE : null}
            dims={w.dims}
            stress={stress}
            camera={w.camera}
          />
        ) : (
          <JapaneseCanvas
            params={params as typeof J_BASELINE}
            selected={w.selected as never}
            onSelect={(p) => {
              w.select(p);
              w.setBenchTab("inspect");
            }}
            onMiss={() => w.select(null)}
            exploded={exploded}
            affected={showConsequences ? (w.consequences.affectedParts as never) : []}
            misaligned={showConsequences ? (w.consequences.misaligned as never) : []}
            ghostParams={isDesign && w.compare ? J_BASELINE : null}
            dims={w.dims}
            stress={stress}
            camera={w.camera}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <div className="pointer-events-auto">
          <div className="eyebrow">{isBuild ? "Assembly order" : isDesign ? "Change a chair" : "Learn a chair"}</div>
          <h2 className="mt-1 text-2xl">{t.name}</h2>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t.sub}</p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
            {(["kangaroo", "japanese"] as const).map((ty) => (
              <button
                key={ty}
                onClick={() => w.setTypology(ty)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] transition-colors",
                  w.typology === ty ? "bg-teal text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {ty === "kangaroo" ? "Kangaroo" : "Japanese"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
            {views.map((v) => (
              <ToolBtn key={v.id} label={`${v.label} view`} active={w.camera.preset === v.id} onClick={() => w.goView(v.id)}>
                {v.label}
              </ToolBtn>
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            <ToolBtn label="Reset camera" onClick={() => w.goView("three")}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
            </ToolBtn>
          </div>
          <div className="flex items-center gap-1 rounded-lg border hairline bg-card/90 p-1 backdrop-blur">
            <ToolBtn label="Explode: pull the chair apart to see every piece" active={exploded} onClick={() => w.setExploded(!w.exploded)}>
              <Layers className="h-3.5 w-3.5" strokeWidth={1.5} /> Explode
            </ToolBtn>
            <ToolBtn label="Weak spots: grain direction and how hard each joint works" active={stressOn} onClick={() => { setStressOn(!stressOn); setStressPanel(true); }}>
              <Activity className="h-3.5 w-3.5" strokeWidth={1.5} /> Weak spots
            </ToolBtn>
            <ToolBtn label="Sizes: show key dimensions on the model" active={w.dims} onClick={() => w.setDims(!w.dims)}>
              <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} /> Sizes
            </ToolBtn>
            {isDesign && (
              <ToolBtn label="Compare: blue outline of the original chair" active={w.compare} onClick={() => w.setCompare(!w.compare)}>
                <GitCompare className="h-3.5 w-3.5" strokeWidth={1.5} /> Compare
              </ToolBtn>
            )}
            <ToolBtn label="Focus: hide all panels" active={focus} onClick={() => setFocus(!focus)}>
              <Focus className="h-3.5 w-3.5" strokeWidth={1.5} />
            </ToolBtn>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Move3d className="h-3.5 w-3.5" strokeWidth={1.5} /> Drag to turn · scroll to zoom · click a part to learn about it
        {isDesign && w.compare && (
          <span className="ml-3 flex items-center gap-1.5 text-measure">
            <Box className="h-3.5 w-3.5" strokeWidth={1.5} /> Blue outline = original
          </span>
        )}
        {isDesign && w.consequences.misaligned.length > 0 && (
          <span className="ml-3 flex items-center gap-1.5 text-alert">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> {w.consequences.misaligned.length} connection(s) no longer align
          </span>
        )}
      </div>

      {stress && !focus && !stressPanel && (
        <button onClick={() => setStressPanel(true)} className="absolute right-5 bottom-12 z-20 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm">Show weak spots</button>
      )}
      {stress && !focus && stressPanel && (
        <div className="absolute right-5 bottom-12 z-20 w-72 max-h-[55%] overflow-y-auto rounded-lg border hairline bg-card/95 p-4 text-xs shadow-sm backdrop-blur">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="eyebrow">Weak spots</div><ProvenanceBadge kind="assumption" topic="stress" /></div><button onClick={() => setStressPanel(false)} aria-label="Minimize weak spots"><Minimize2 className="h-3 w-3" /></button></div>
          {exploded && <p className="mt-2 text-alert">Close the exploded view to see the dots on the chair.</p>}
          <p className="mt-2 text-[11px] text-muted-foreground">Dots = joints. The % is how much of a cautious strength limit each joint uses when someone sits and leans back hard.</p>
          <ul className="mt-3 space-y-2.5">
            {stress.pins.map((p) => (
              <li key={p.id} className={cn("rounded-md border-l-2 bg-background px-2.5 py-2", p.level === "high" ? "border-alert" : p.level === "watch" ? "border-walnut" : "border-teal")}>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{p.label}</span>
                  <span className={cn("font-mono", LEVEL_TXT[p.level])}>{Math.round(p.utilisation * 100)}%</span>
                </div>
                <div className={cn("text-[11px]", LEVEL_TXT[p.level])}>
                  {LEVEL_WORD[p.level]}
                  {p.ratio !== 1 && <span className="text-muted-foreground"> · {p.ratio > 1 ? "+" : ""}{Math.round((p.ratio - 1) * 100)}% vs original</span>}
                </div>
                <p className="mt-0.5 text-muted-foreground">{p.why}</p>
              </li>
            ))}
          </ul>
          {stress.grain.some((g) => g.level !== "ok" || g.id === "seat") && (
            <div className="mt-3 space-y-1.5 border-t hairline pt-3">
              <div className="eyebrow">Grain</div>
              {stress.grain.filter((g) => g.level !== "ok" || g.id === "seat").map((g) => (
                <p key={g.id}><span className={cn("font-medium", g.level === "high" && "text-alert")}>{g.label}:</span> <span className="text-muted-foreground">{g.note}</span></p>
              ))}
            </div>
          )}
          {stress.wood.proxy && <p className="mt-3 text-[10px] text-walnut">{stress.wood.note}</p>}
          <details className="mt-3 border-t hairline pt-2">
            <summary className="cursor-pointer text-[11px] text-muted-foreground">Show the math</summary>
            <ul className="mt-2 space-y-2">
              {stress.pins.map((p) => (
                <li key={p.id}>
                  <div className="font-medium">{p.label}</div>
                  <p className="font-mono text-[10px]">{p.moment} N·m on {p.section} → {p.stressMPa} MPa (limit {p.refMPa} MPa)</p>
                  <p className="text-[10px] text-measure">{p.how}</p>
                </li>
              ))}
              {stress.grain.filter((g) => g.level === "ok" && g.id !== "seat").map((g) => (
                <li key={g.id} className="text-[10px] text-muted-foreground">{g.label}: {g.note}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-measure">The limit is USDA clear-wood bending strength taken down to its weakest 5% and divided by 2.1 — a cautious teaching level, not a certified safe load. Green under 50%, amber 50–100%, red over 100%. {stress.assumptions}</p>
          </details>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!focus && isDesign && (panelOpen ? (
          <motion.div key="design" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="absolute left-5 top-44 bottom-14 w-72">
            <button onClick={() => setPanelOpen(false)} aria-label="Minimize controls" className="absolute -right-3 top-2 z-10 rounded-full border hairline bg-card p-1 shadow-sm"><Minimize2 className="h-3 w-3" /></button>
            <DesignControls />
          </motion.div>
        ) : (
          <button key="design-pill" onClick={() => setPanelOpen(true)} className="absolute left-5 top-44 flex items-center gap-2 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm"><SlidersHorizontal className="h-3.5 w-3.5" /> Show sliders</button>
        ))}
        {!focus && w.section === "study" && (panelOpen ? (
          <motion.div key="study" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-1 px-5">
            <button onClick={() => setPanelOpen(false)} className="rounded-full border hairline bg-card px-3 py-1 text-[11px]">Minimize</button>
            <Walkthrough />
          </motion.div>
        ) : (
          <button key="study-pill" onClick={() => setPanelOpen(true)} className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm">Show lesson</button>
        ))}
        {!focus && isBuild && (panelOpen ? (
          <motion.div key="build" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-1 px-5">
            <button onClick={() => setPanelOpen(false)} className="rounded-full border hairline bg-card px-3 py-1 text-[11px]">Minimize</button>
            <AssemblyPractice key={w.typology} />
          </motion.div>
        ) : (
          <button key="build-pill" onClick={() => setPanelOpen(true)} className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm">Show assembly order</button>
        ))}
      </AnimatePresence>
    </div>
  );
}
