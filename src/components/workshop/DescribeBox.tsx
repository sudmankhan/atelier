import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { designFromText } from "@/lib/brief.functions";
import type { Brief } from "@/lib/brief";
import type { LabDesign } from "@/lib/lab";
import type { Setting } from "@/lib/weather";

const EXAMPLES = [
  "A sturdy patio dining chair. I'm 6'2\".",
  "A low reading chair in walnut, laid back.",
  "A small chair for a 5-year-old.",
  "A Japanese-style stick chair.",
];

/**
 * "Describe it → design". The AI only picks settings; the engine builds and tests the chair.
 * `current` lets people describe changes ("make it taller") to the chair on the bench.
 */
export function DescribeBox({ current, setting, onDesign }: { current: LabDesign; setting: Setting; onDesign: (b: Brief, source: "ai" | "keywords", note?: string) => void }) {
  const run = useServerFn(designFromText);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async (t = text) => {
    if (!t.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await run({ data: { text: t, current, setting } });
      onDesign(r.brief, r.source, r.note);
    } catch {
      setErr("Couldn't design that just now. Try again, or pick parts below.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg border border-teal/50 bg-teal/5 p-3">
      <label htmlFor="describe" className="flex items-center gap-1.5 text-sm font-medium text-teal"><Sparkles className="h-4 w-4" /> Describe the chair you want</label>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Where it goes, who sits in it, the look. We pick the parts, then test it. You can also describe changes to this one.</p>
      <textarea id="describe" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={600}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go(); }}
        placeholder="e.g. A sturdy patio dining chair. I'm 6'2&quot;, I like a clean modern look."
        className="mt-2 w-full resize-none rounded-md border hairline bg-background px-2 py-1.5 text-sm" />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={() => go()} disabled={busy || !text.trim()} className="flex h-9 items-center gap-1.5 rounded-md bg-teal px-3 text-sm text-accent-foreground disabled:opacity-50">
          {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Designing…</> : <>Design it</>}
        </button>
        {err && <span className="text-[11px] text-alert">{err}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {EXAMPLES.map((x) => (
          <button key={x} onClick={() => { setText(x); go(x); }} disabled={busy} className="rounded-full border hairline px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">{x}</button>
        ))}
      </div>
    </div>
  );
}

/** What the designer picked and why, plus anything it honestly couldn't do. */
export function BriefNote({ brief, source, note, onClose }: { brief: Brief; source: "ai" | "keywords"; note?: string; onClose: () => void }) {
  return (
    <div className="rounded-lg border hairline bg-background p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-foreground">{brief.name}</div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">×</button>
      </div>
      {brief.summary && <p className="mt-1 text-muted-foreground">{brief.summary}</p>}
      {brief.cannotDo.length > 0 && <p className="mt-1.5 text-walnut">Can't build yet: {brief.cannotDo.join(", ")}. This is the closest chair I can make.</p>}
      {brief.clamped.length > 0 && <p className="mt-1.5 text-walnut">Kept within limits: {brief.clamped.join("; ")}.</p>}
      <p className="mt-1.5 text-[10px] text-muted-foreground">{source === "ai" ? "AI picked the parts" : note ?? "Read from your words"} · every check below is the app's own physics.</p>
    </div>
  );
}
