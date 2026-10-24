import { Bookmark, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { BASELINE, PARAM_SPECS, WOODS, type WoodId } from "@/lib/chair/params";
import { J_BASELINE, J_FINISHES, J_PARAM_SPECS, type JFinish } from "@/lib/chair/japanese/params";
import { useWorkshop } from "./store";
import { cn } from "@/lib/utils";

export function DesignControls() {
  const w = useWorkshop();
  const [name, setName] = useState("");
  const isK = w.typology === "kangaroo";
  const specs = isK ? PARAM_SPECS : J_PARAM_SPECS;
  const baseline = isK ? BASELINE : J_BASELINE;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border hairline bg-card/95 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b hairline px-4 py-3">
        <div className="font-serif text-lg">Shape the chair</div>
        <button
          onClick={() => {
            w.resetParams();
            toast("Reset to the original proportions");
          }}
          className="flex items-center gap-1.5 rounded-md border hairline px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase hover:bg-secondary"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {specs.map((s) => {
          const v = (w.params as unknown as Record<string, number>)[s.key] as number;
          const d = v - (baseline as unknown as Record<string, number>)[s.key]!;
          const isCurve = s.key === "backCurve";
          return (
            <div key={s.key}>
              <div className="flex items-baseline justify-between">
                <label className="text-sm">{s.label}</label>
                <span className="font-mono text-xs">
                  {isCurve ? v.toFixed(2) : v.toFixed(1)}
                  {s.unit}
                  {Math.abs(d) > 1e-6 && (
                    <span className={cn("ml-1.5", "text-teal")}>
                      {d > 0 ? "+" : "−"}
                      {Math.abs(d).toFixed(isCurve ? 2 : 1)}
                    </span>
                  )}
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[v]}
                min={s.min}
                max={s.max}
                step={s.step}
                onValueChange={([nv]) => w.setParam(s.key, nv as number)}
                aria-label={s.label}
              />
              <div className="mt-1 text-[11px] text-muted-foreground">{s.hint}</div>
            </div>
          );
        })}
        {isK ? (
          <div>
            <div className="text-sm">Wood appearance</div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(Object.keys(WOODS) as WoodId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => w.setParam("wood", id)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-xs transition-colors",
                    (w.params as typeof BASELINE).wood === id ? "border-teal bg-teal-soft" : "hairline hover:bg-secondary",
                  )}
                >
                  {WOODS[id].label}
                </button>
              ))}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{WOODS[(w.params as typeof BASELINE).wood].note}</div>
          </div>
        ) : (
          <div>
            <div className="text-sm">Finish</div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(Object.keys(J_FINISHES) as JFinish[]).map((id) => (
                <button
                  key={id}
                  onClick={() => w.setParam("finish", id)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-xs transition-colors",
                    (w.params as typeof J_BASELINE).finish === id ? "border-teal bg-teal-soft" : "hairline hover:bg-secondary",
                  )}
                >
                  {J_FINISHES[id].label}
                </button>
              ))}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{J_FINISHES[(w.params as typeof J_BASELINE).finish].note}</div>
          </div>
        )}
        <button onClick={() => w.setBenchTab("shop")} className="w-full rounded-md border hairline px-3 py-2 text-left text-xs hover:bg-secondary">
          Full cut list and saw angles → <span className="text-teal">Shop tab</span>
        </button>
      </div>
      <form
        className="flex gap-2 border-t hairline p-3"
        onSubmit={(e) => {
          e.preventDefault();
          w.saveDesign(name.trim() || `Study ${new Date().toLocaleDateString()}`);
          setName("");
          toast("Design saved to My Projects");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this design"
          className="min-w-0 flex-1 rounded-md border hairline bg-background px-2.5 py-1.5 text-xs outline-none focus:border-teal"
        />
        <button className="flex items-center gap-1 rounded-md bg-primary px-3 text-xs text-primary-foreground">
          <Bookmark className="h-3 w-3" /> Save
        </button>
      </form>
    </div>
  );
}
