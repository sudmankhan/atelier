import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Box,
  Eye,
  Focus,
  GitCompare,
  Layers,
  Minimize2,
  Move3d,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
} from "lucide-react";
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
import { resolveSitter } from "@/lib/chair/fit";

function ToolBtn({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs transition-colors",
        active ? "bg-teal text-accent-foreground" : "text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

const TITLES = {
  kangaroo: {
    name: "Kangaroo-inspired lounge chair",
    sub: "Chandigarh modernism · teak & cane · educational reconstruction",
  },
  japanese: {
    name: "Kuro spindle-back armchair",
    sub: "Japanese mingei spirit · lacquered frame & solid slab · educational reconstruction",
  },
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
  const sitterActive = isDesign && w.sitter.active;
  const visibleParts = undefined;
  const exploded = w.exploded;
  const params =
    isDesign || isBuild
      ? isBuild
        ? isK
          ? BASELINE
          : w.params
        : w.params
      : w.section === "study"
        ? isK
          ? BASELINE
          : w.params
        : w.params;
  const showConsequences = isDesign;
  const t = TITLES[w.typology];
  const [stressOn, setStressOn] = useState(false);
  const seatLoadN = sitterActive ? resolveSitter(w.user).massKg * 9.81 : undefined;
  const report = useMemo(
    () =>
      isK
        ? kangarooStress(params as ChairParams, seatLoadN)
        : japaneseStress(params as JapaneseParams, seatLoadN),
    [isK, params, seatLoadN],
  );
  const stress = stressOn || sitterActive ? report : null;

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
            The anatomy walkthrough is written for the Kangaroo. The Japanese armchair works in the
            Parametric Studio and the Assembly order practice.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => w.setTypology("kangaroo")}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Switch to the Kangaroo
            </button>
            <button
              onClick={() => w.setSection("design")}
              className="rounded-md border hairline px-4 py-2 text-sm"
            >
              Open the Parametric Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden">
      <div
        className={cn(
          "absolute right-0 bottom-0 transition-[left,top] duration-300",
          focus ? "top-0" : "top-20",
          !focus && isDesign && panelOpen ? "left-[20rem]" : "left-0",
        )}
      >
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
            stressGrain={stressOn}
            stressLabels={!sitterActive}
            stressAnimateKey={sitterActive ? w.sitter.run : undefined}
            sitter={sitterActive ? { measurements: w.user, runKey: w.sitter.run } : null}
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
            stressGrain={stressOn}
            stressLabels={!sitterActive}
            stressAnimateKey={sitterActive ? w.sitter.run : undefined}
            sitter={sitterActive ? { measurements: w.user, runKey: w.sitter.run } : null}
            camera={w.camera}
          />
        )}
      </div>

      {!focus && (
        <header className="absolute inset-x-0 top-0 z-30 flex h-20 items-center justify-between gap-4 border-b hairline bg-card px-5">
          <div className="min-w-0">
            <div className="eyebrow">
              {isBuild ? "Assembly order" : isDesign ? "Parametric Studio" : "Anatomy"}
            </div>
            <div className="mt-0.5 truncate font-serif text-lg">{t.name}</div>
          </div>
          <div className="flex shrink-0 items-end gap-2">
            <label className="text-[10px] text-muted-foreground">
              Chair
              <select
                value={w.typology}
                onChange={(event) => w.setTypology(event.target.value as "kangaroo" | "japanese")}
                className="mt-1 block h-8 rounded-md border hairline bg-background px-2 text-xs text-foreground outline-none focus:border-teal"
              >
                <option value="kangaroo">Kangaroo</option>
                <option value="japanese">Japanese</option>
              </select>
            </label>
            <label className="text-[10px] text-muted-foreground">
              View
              <select
                value={w.camera.preset}
                onChange={(event) => w.goView(event.target.value as CameraPreset)}
                className="mt-1 block h-8 rounded-md border hairline bg-background px-2 text-xs text-foreground outline-none focus:border-teal"
              >
                {views.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mb-0 flex h-8 items-center gap-0.5 border-l hairline pl-2">
              <ToolBtn label="Reset camera" onClick={() => w.goView("three")}>
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              </ToolBtn>
              <ToolBtn
                label="Exploded view"
                active={exploded}
                onClick={() => w.setExploded(!w.exploded)}
              >
                <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
              </ToolBtn>
              <ToolBtn label="Dimensions" active={w.dims} onClick={() => w.setDims(!w.dims)}>
                <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />
              </ToolBtn>
              <ToolBtn
                label="Grain and joint stress"
                active={stressOn}
                onClick={() => {
                  setStressOn(!stressOn);
                  setStressPanel(true);
                }}
              >
                <Activity className="h-3.5 w-3.5" strokeWidth={1.5} />
              </ToolBtn>
              <ToolBtn
                label="Focus: hide all panels"
                active={focus}
                onClick={() => setFocus(!focus)}
              >
                <Focus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </ToolBtn>
              {isDesign && (
                <ToolBtn
                  label="Compare with original"
                  active={w.compare}
                  onClick={() => w.setCompare(!w.compare)}
                >
                  <GitCompare className="h-3.5 w-3.5" strokeWidth={1.5} />
                </ToolBtn>
              )}
            </div>
          </div>
        </header>
      )}

      {focus && (
        <button
          onClick={() => setFocus(false)}
          className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border hairline bg-card/90 px-3 py-2 text-xs shadow-sm backdrop-blur"
        >
          <Focus className="h-3.5 w-3.5" /> Exit focus
        </button>
      )}

      {!focus && (
        <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Move3d className="h-3.5 w-3.5" strokeWidth={1.5} /> Drag to orbit · scroll to zoom ·
          right-drag to pan · click a part
          {isDesign && w.compare && (
            <span className="ml-3 flex items-center gap-1.5 text-measure">
              <Box className="h-3.5 w-3.5" strokeWidth={1.5} /> Blue outline = original
            </span>
          )}
          {isDesign && w.consequences.misaligned.length > 0 && (
            <span className="ml-3 flex items-center gap-1.5 text-alert">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> {w.consequences.misaligned.length}{" "}
              connection(s) no longer align
            </span>
          )}
        </div>
      )}

      {stressOn && stress && !focus && !stressPanel && (
        <button
          onClick={() => setStressPanel(true)}
          className="absolute right-5 bottom-12 z-20 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm"
        >
          Show stress notes
        </button>
      )}
      {stressOn && stress && !focus && stressPanel && (
        <div className="absolute right-5 bottom-12 z-20 w-64 max-h-[45%] overflow-y-auto rounded-lg border hairline bg-card/95 p-4 text-xs shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="eyebrow">Grain & joint stress</div>
            <button onClick={() => setStressPanel(false)} aria-label="Minimize stress notes">
              <Minimize2 className="h-3 w-3" />
            </button>
          </div>
          {exploded && (
            <p className="mt-2 text-alert">Close the exploded view to see markers on the chair.</p>
          )}
          <ul className="mt-3 space-y-3">
            {stress.pins.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between gap-2 font-medium">
                  <span>{p.label}</span>
                  <span
                    className={cn(
                      "font-mono",
                      p.level === "high"
                        ? "text-alert"
                        : p.level === "watch"
                          ? "text-walnut"
                          : "text-teal",
                    )}
                  >
                    {p.ratio === 1
                      ? "original"
                      : `${p.ratio > 1 ? "+" : ""}${Math.round((p.ratio - 1) * 100)}%`}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{p.why}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t hairline pt-3 space-y-2">
            {stress.grain
              .filter((g) => g.runoutDeg > 0 || g.level !== "ok" || g.id === "seat")
              .map((g) => (
                <p key={g.id}>
                  <span className={cn("font-medium", g.level === "high" && "text-alert")}>
                    {g.label}:
                  </span>{" "}
                  <span className="text-muted-foreground">{g.note}</span>
                </p>
              ))}
          </div>
          <p className="mt-3 text-[10px] text-measure">
            Arrows = grain direction. Dots = joints (green original, amber +10–30%, red &gt;30%).{" "}
            {stress.assumptions}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!focus &&
          isDesign &&
          (panelOpen ? (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="absolute left-5 top-24 bottom-14 w-72"
            >
              <button
                onClick={() => setPanelOpen(false)}
                aria-label="Minimize controls"
                className="absolute -right-3 top-2 z-10 rounded-full border hairline bg-card p-1 shadow-sm"
              >
                <Minimize2 className="h-3 w-3" />
              </button>
              <DesignControls />
            </motion.div>
          ) : (
            <button
              key="design-pill"
              onClick={() => setPanelOpen(true)}
              className="absolute left-5 top-24 flex items-center gap-2 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Show sliders
            </button>
          ))}
        {!focus &&
          w.section === "study" &&
          (panelOpen ? (
            <motion.div
              key="study"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-1 px-5"
            >
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-full border hairline bg-card px-3 py-1 text-[11px]"
              >
                Minimize
              </button>
              <Walkthrough />
            </motion.div>
          ) : (
            <button
              key="study-pill"
              onClick={() => setPanelOpen(true)}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm"
            >
              Show lesson
            </button>
          ))}
        {!focus &&
          isBuild &&
          (panelOpen ? (
            <motion.div
              key="build"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-1 px-5"
            >
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-full border hairline bg-card px-3 py-1 text-[11px]"
              >
                Minimize
              </button>
              <AssemblyPractice key={w.typology} />
            </motion.div>
          ) : (
            <button
              key="build-pill"
              onClick={() => setPanelOpen(true)}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full border hairline bg-card/95 px-3 py-2 text-xs shadow-sm"
            >
              Show assembly order
            </button>
          ))}
      </AnimatePresence>
    </div>
  );
}
