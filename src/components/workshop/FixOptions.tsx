import { useMemo } from "react";
import { ArrowRight, Lock, Unlock, Wrench, X } from "lucide-react";
import { StudioShell } from "@/components/three/StudioCanvas";
import { LabModel } from "@/components/three/LabModel";
import { LOCKABLE, blockingLocks, type Fix, type Lockable } from "@/lib/compromise";
import { labTipping, type LabDesign, type LabUser } from "@/lib/lab";
import { cn } from "@/lib/utils";

/** Side-by-side compromise options: each one passes every test; pick one, or lock what you won't give up. */
export function FixOptions({ d, user, fixes, locked, onLock, onUse, onClose }: {
  d: LabDesign; user: LabUser; fixes: Fix[]; locked: Lockable[];
  onLock: (k: Lockable) => void; onUse: (f: Fix) => void; onClose: () => void;
}) {
  const before = Math.round(labTipping(d).result.thresholdF ?? 0);
  const blockers = useMemo(() => (fixes.length ? [] : blockingLocks(d, user, locked)), [fixes.length, d, user, locked]);
  const name = (k: Lockable) => LOCKABLE.find((x) => x.key === k)?.label ?? k;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" role="dialog" aria-label="Ways to fix this chair">
      <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl border hairline bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Ways to fix this</div>
            <h3 className="mt-1 text-2xl">{fixes.length ? `${fixes.length === 2 ? "Two versions" : "One version"} that pass every test` : "No fix while keeping that"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Found by re-running the same tests on small changes to your chair. Nothing here is guessed.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {fixes.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fixes.map((f) => (
              <div key={f.id} className="flex flex-col rounded-xl border hairline bg-background p-4">
                <div className="h-48 overflow-hidden rounded-lg bg-secondary/40">
                  <StudioShell autoRotate initial="three"><LabModel d={f.design} xray={false} tipping={false} /></StudioShell>
                </div>
                <div className="mt-3 text-lg font-medium">{f.title}</div>
                <p className="text-xs text-muted-foreground">{f.idea}</p>
                <div className="mt-2 rounded-md bg-teal/10 px-2.5 py-1.5 text-xs">
                  Lean it takes to tip: <span className="font-mono text-alert line-through">{before} N</span> <ArrowRight className="inline h-3 w-3" /> <span className="font-mono font-medium text-teal">{f.tipsAt} N</span>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs">
                  {f.changes.map((c) => (
                    <li key={c.what} className="flex justify-between gap-2"><span className="text-muted-foreground">{c.what}</span><span><span className="text-muted-foreground">{c.from}</span> → <span className="font-medium">{c.to}</span></span></li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-walnut">{f.tradeoff}</p>
                <button onClick={() => onUse(f)} className="mt-auto pt-3">
                  <span className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">Use this version</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-walnut/10 p-3 text-sm text-walnut">
            {blockers.length
              ? `Keeping ${blockers.map(name).join(" and ")} is itself part of the problem, so no version can pass. Unlock it to see fixes, or keep your chair as it is.`
              : "No small change makes this pass. Try a different base or back in the parts menu."}
          </p>
        )}

        <div className="mt-5 border-t hairline pt-4">
          <div className="text-xs font-medium">Won't give something up? Keep it, and we'll find another way.</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LOCKABLE.map(({ key, label }) => {
              const on = locked.includes(key);
              return (
                <button key={key} onClick={() => onLock(key)} aria-pressed={on} className={cn("flex items-center gap-1 rounded-full border px-3 py-1 text-xs", on ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground hover:text-foreground")}>
                  {on ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />} Keep {label}
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline">Keep my chair as it is</button>
        </div>
      </div>
    </div>
  );
}
