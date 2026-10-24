import { useState } from "react";
import { ArrowDown, ArrowUp, Shuffle } from "lucide-react";
import { OPS, evaluateOrder, shuffled } from "@/lib/assembly";
import { useWorkshop } from "./store";
import { cn } from "@/lib/utils";

export function AssemblyPractice() {
  const w = useWorkshop();
  const t = w.typology;
  const [order, setOrder] = useState(() => shuffled(t));
  const [checked, setChecked] = useState(false);
  const ops = OPS[t];
  const ids = order.length === ops.length && order.every((id) => ops.some((o) => o.id === id)) ? order : shuffled(t);
  const errs = evaluateOrder(t, ids);
  const bad = new Set(errs.map((e) => e.opId));
  const move = (i: number, d: number) => {
    const a = [...ids];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j]!, a[i]!];
    setOrder(a);
    setChecked(false);
  };
  return (
    <div className="pointer-events-auto max-h-[60vh] w-full max-w-2xl overflow-y-auto rounded-xl border hairline bg-card/95 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">Practice · {t === "kangaroo" ? "Kangaroo" : "Japanese"} chair</div>
          <h3 className="mt-1 text-xl">Put the shop steps in order</h3>
        </div>
        <button onClick={() => { setOrder(shuffled(t)); setChecked(false); }} className="flex items-center gap-1 rounded-md border hairline px-2.5 py-1 text-xs"><Shuffle className="h-3 w-3" /> Shuffle</button>
      </div>
      <ol className="mt-3 space-y-1">
        {ids.map((id, i) => {
          const op = ops.find((o) => o.id === id)!;
          return (
            <li key={id} className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs", checked && bad.has(id) ? "border-alert" : checked ? "border-teal" : "hairline")}>
              <span className="w-4 font-mono text-muted-foreground">{i + 1}</span>
              <span className="flex-1">{op.label}</span>
              <button aria-label="Move up" onClick={() => move(i, -1)} className="p-0.5 text-muted-foreground hover:text-foreground"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="p-0.5 text-muted-foreground hover:text-foreground"><ArrowDown className="h-3.5 w-3.5" /></button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => setChecked(true)} className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Check my order</button>
        {checked && <span className={cn("text-xs", errs.length ? "text-alert" : "text-teal")}>{errs.length ? `${errs.length} problem${errs.length > 1 ? "s" : ""} in the shop` : "That order works — nothing gets ruined."}</span>}
      </div>
      {checked && errs.length > 0 && (
        <div className="mt-3 space-y-2">
          {errs.map((e, k) => (
            <div key={k} className="rounded-md bg-secondary/60 p-2.5 text-xs">
              <div><span className="text-alert">“{e.label}”</span> before “{e.missing}”</div>
              <div className="mt-0.5 text-muted-foreground">What happens: {e.why}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
