import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GraduationCap } from "lucide-react";
import { splitWords } from "@/lib/words";
import { plainResult } from "@/lib/plain";
import type { LabResult, Level } from "@/lib/lab";
import { cn } from "@/lib/utils";

/** Text with woodworking words underlined; hover (or tap) one to see what it means. */
export function Words({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitWords(text).map((p, i) =>
        typeof p === "string" ? <span key={i}>{p}</span> : <Term key={i} text={p.text} meaning={p.word.plain} term={p.word.term} />,
      )}
    </span>
  );
}

function Term({ text, term, meaning }: { text: string; term: string; meaning: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<{ x: number; y: number; below: boolean } | null>(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const W = 224;
    setAt({ x: Math.max(8, Math.min(window.innerWidth - W - 8, r.left)), y: r.top < 120 ? r.bottom + 4 : r.top - 4, below: r.top < 120 });
  };
  return (
    <>
      <button ref={ref} type="button" onMouseEnter={show} onMouseLeave={() => setAt(null)} onFocus={show} onBlur={() => setAt(null)} onClick={() => (at ? setAt(null) : show())}
        className="cursor-help border-b border-dotted border-current/60 text-inherit" aria-label={`${text}: ${meaning}`}>{text}</button>
      {at && typeof document !== "undefined" && createPortal(
        <span role="tooltip" style={{ left: at.x, top: at.y, transform: at.below ? undefined : "translateY(-100%)" }}
          className="pointer-events-none fixed z-[100] block w-56 rounded-md bg-foreground p-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-background shadow-lg">
          <span className="block font-medium">{term}</span>
          {meaning}
        </span>,
        document.body,
      )}
    </>
  );
}

const KEY = "atelier.beginner";
const EVT = "atelier-beginner";

/** Beginner mode (plain English) — remembered in this browser, shared by every page that has the switch. */
export function useBeginner(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => { try { setOn(localStorage.getItem(KEY) === "1"); } catch { /* default off */ } };
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);
  const set = (v: boolean) => {
    setOn(v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* not kept */ }
    window.dispatchEvent(new Event(EVT));
  };
  return [on, set];
}

export function BeginnerToggle({ className }: { className?: string }) {
  const [on, set] = useBeginner();
  return (
    <button onClick={() => set(!on)} aria-pressed={on} title="Say everything in everyday words, with what to do about each result" className={cn("flex h-9 items-center gap-2 rounded-md px-3 text-xs", on ? "bg-teal text-accent-foreground" : "hover:bg-secondary", className)}>
      <GraduationCap className="h-3.5 w-3.5" /> Plain English {on ? "on" : "off"}
    </button>
  );
}

const tone: Record<Level, string> = { good: "border-teal", warn: "border-walnut", bad: "border-alert" };
const txt: Record<Level, string> = { good: "text-teal", warn: "text-walnut", bad: "text-alert" };
const VERDICT: Record<Level, string> = { good: "OK", warn: "Watch", bad: "Fix this" };

/** One test result. Beginner mode: everyday words + what to do; the numbers are behind "Show the numbers". */
export function ResultRow({ r, beginner, badge }: { r: LabResult; beginner: boolean; badge?: React.ReactNode }) {
  const [nums, setNums] = useState(false);
  const p = plainResult(r);
  return (
    <div className={cn("rounded-md border-l-2 bg-background p-2.5", tone[r.level])}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{beginner ? `${VERDICT[r.level]} · ${r.area}` : r.area}</div>
        {badge}
      </div>
      <div className={cn("text-sm", txt[r.level])}>{beginner ? p.title : <Words text={r.title} />}</div>
      <div className="mt-0.5 text-xs text-muted-foreground"><Words text={beginner ? p.detail : r.detail} /></div>
      {beginner && p.detail !== r.detail && (
        <>
          <button onClick={() => setNums(!nums)} className="mt-1 text-[10px] text-walnut hover:underline">{nums ? "Hide the numbers" : "Show the numbers"}</button>
          {nums && <div className="mt-1 rounded bg-secondary/50 p-1.5 text-[11px] text-muted-foreground"><Words text={`${r.title}. ${r.detail}`} /></div>}
        </>
      )}
    </div>
  );
}
