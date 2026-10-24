import { AlertTriangle, CheckCircle2, EyeOff, Play, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_SITTER, evaluateSitterFit, resolveSitter } from "@/lib/chair/fit";
import { cn } from "@/lib/utils";
import { useWorkshop } from "./store";

const FIELDS = [
  { key: "poplitealHeight", label: "Knee height", min: 34, max: 55, unit: "cm" },
  { key: "thighLength", label: "Buttock to knee", min: 40, max: 62, unit: "cm" },
  { key: "hipBreadth", label: "Seated hip breadth", min: 30, max: 52, unit: "cm" },
  { key: "torsoHeight", label: "Hip to shoulder", min: 45, max: 70, unit: "cm" },
  { key: "massKg", label: "Body mass", min: 45, max: 130, unit: "kg" },
] as const;

export function SitterPanel() {
  const w = useWorkshop();
  const sitter = resolveSitter(w.user);
  const results = evaluateSitterFit(w.typology, w.params, w.user);
  const conflicts = results.filter((result) => result.level !== "ok");

  return (
    <div className="space-y-5">
      <div>
        <div className="eyebrow">Dimensioned sitter</div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Adjust body dimensions, then replay the sit test. The figure is intentionally schematic so
          contact and clearance remain legible.
        </p>
      </div>

      {FIELDS.map((field) => {
        const value = sitter[field.key];
        return (
          <div key={field.key}>
            <div className="flex items-baseline justify-between text-xs">
              <label>{field.label}</label>
              <span className="font-mono text-measure">
                {value}
                {field.unit}
              </span>
            </div>
            <Slider
              className="mt-2"
              value={[value]}
              min={field.min}
              max={field.max}
              step={1}
              onValueChange={([next]) => w.setUser({ [field.key]: next })}
              aria-label={field.label}
            />
          </div>
        );
      })}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            w.runSitter();
            w.goView("side");
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground"
        >
          <Play className="h-3.5 w-3.5" /> {w.sitter.active ? "Replay sit test" : "Run sit test"}
        </button>
        {w.sitter.active && (
          <button
            type="button"
            onClick={w.hideSitter}
            aria-label="Hide sitter"
            className="rounded-md border hairline px-3 hover:bg-secondary"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => w.setUser(DEFAULT_SITTER)}
          aria-label="Reset sitter dimensions"
          className="rounded-md border hairline px-3 hover:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <section className="border-t hairline pt-4">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Fit feedback</div>
          <span
            className={cn("font-mono text-[10px]", conflicts.length ? "text-alert" : "text-teal")}
          >
            {conflicts.length
              ? `${conflicts.length} issue${conflicts.length === 1 ? "" : "s"}`
              : "clear"}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          {results.map((result) => {
            const Icon = result.level === "ok" ? CheckCircle2 : AlertTriangle;
            return (
              <div key={result.id} className="flex gap-2 rounded-md bg-background p-2.5">
                <Icon
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    result.level === "ok"
                      ? "text-teal"
                      : result.level === "watch"
                        ? "text-walnut"
                        : "text-alert",
                  )}
                />
                <div>
                  <div className="text-xs">{result.title}</div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    {result.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
          Dimensional teaching check only; posture, cushioning and individual mobility still require
          a physical fitting.
        </p>
      </section>
    </div>
  );
}
