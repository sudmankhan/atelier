import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { durabilityReport, GRADES, type Grade, type MathTopic } from "@/lib/durability";
import { SETTINGS, type Setting } from "@/lib/weather";
import type { LabDesign, LabUser } from "@/lib/lab";
import { Words } from "@/components/Words";
import { cn } from "@/lib/utils";

const TONE: Record<Grade, string> = {
  heavy: "bg-teal/15 text-teal",
  everyday: "bg-teal/10 text-teal",
  light: "bg-walnut/15 text-walnut",
  "not-ready": "bg-alert/10 text-alert",
};

/** Honest durability report: what it's built for, what wears first, how to care for it. No years. */
export function DurabilityCard({ d, user, setting, onSetting, onSeeMath, onFix, onClose }: {
  d: LabDesign; user: LabUser; setting: Setting;
  onSetting: (s: Setting) => void; onSeeMath: (t: MathTopic) => void; onFix?: () => void; onClose: () => void;
}) {
  const r = useMemo(() => durabilityReport(d, { ...user, setting }), [d, user, setting]);
  const g = GRADES[r.grade];
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" role="dialog" aria-label="Durability report">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border hairline bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="eyebrow flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Durability report</div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className={cn("mt-2 rounded-xl p-4", TONE[r.grade])}>
          <div className="text-2xl font-medium">{g.title}</div>
          <p className="mt-1 text-sm text-foreground/80">{g.line}</p>
          {r.grade === "not-ready" && onFix && <button onClick={onFix} className="mt-2 rounded-md bg-teal px-3 py-1.5 text-sm text-accent-foreground">See ways to fix this</button>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Where it lives:</span>
          {SETTINGS.map((x) => (
            <button key={x.id} onClick={() => onSetting(x.id)} aria-pressed={setting === x.id} className={cn("rounded-full border px-3 py-1", setting === x.id ? "border-teal bg-teal-soft text-teal" : "hairline text-muted-foreground hover:text-foreground")}>{x.label}</button>
          ))}
        </div>

        <section className="mt-4">
          <h3 className="text-sm font-medium">What we checked</h3>
          <ul className="mt-2 space-y-2">
            {r.facts.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm">
                {f.good ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-walnut" />}
                <span className="flex-1"><Words text={f.text} /> <button onClick={() => onSeeMath(f.math)} className="whitespace-nowrap text-xs text-walnut underline-offset-2 hover:underline">see the math →</button></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-medium">What wears first</h3>
          <ol className="mt-2 space-y-2">
            {r.wearsFirst.map((w, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-secondary/50 p-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background font-mono text-xs">{i + 1}</span>
                <div>
                  <div className="font-medium">{w.part}</div>
                  <div className="text-xs text-muted-foreground"><Words text={w.why} /></div>
                  <div className="mt-0.5 text-xs"><span className="text-muted-foreground">Watch for:</span> {w.sign}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-medium">How to look after it</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {r.care.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>

        <p className="mt-4 border-t hairline pt-3 text-[11px] text-muted-foreground">
          No lifespan in years: that depends on how it's used, the climate and the care it gets, and no honest tool can promise a number. Every line above comes from the app's own tests, under stated assumptions (a 90 kg sitter, a 250 N lean).
        </p>
      </div>
    </div>
  );
}
