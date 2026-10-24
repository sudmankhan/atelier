import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MessageCircleQuestion } from "lucide-react";
import { WALKTHROUGH } from "@/lib/lessons";
import { useWorkshop } from "./store";

export function Walkthrough() {
  const w = useWorkshop();
  const i = Math.min(w.progress.walkStep, WALKTHROUGH.length - 1);
  const s = WALKTHROUGH[i];

  useEffect(() => {
    w.select(s.part);
    w.goView(s.view);
    w.setDims(Boolean(s.dims));
    if (s.part) w.setBenchTab("inspect");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const go = (n: number) =>
    w.updateProgress((p) => ({ ...p, walkStep: n, walkDone: p.walkDone || n === WALKTHROUGH.length - 1 }));

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-xl border hairline bg-card/95 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Guided study · {i + 1} / {WALKTHROUGH.length}</div>
        <div className="flex gap-1">
          {WALKTHROUGH.map((_, k) => (
            <button key={k} aria-label={`Step ${k + 1}`} onClick={() => go(k)} className={`h-1 w-5 rounded-full ${k <= i ? "bg-teal" : "bg-secondary"}`} />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
          <h3 className="mt-2 text-2xl">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => w.askMasterAbout(`In the step "${s.title}", why is it designed this way?`)}
          className="flex items-center gap-1.5 text-xs text-teal hover:underline"
        >
          <MessageCircleQuestion className="h-3.5 w-3.5" /> Ask the Master
        </button>
        <div className="flex gap-2">
          <button disabled={i === 0} onClick={() => go(i - 1)} className="flex items-center gap-1 rounded-md border hairline px-3 py-1.5 text-xs disabled:opacity-40">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          {i < WALKTHROUGH.length - 1 ? (
            <button onClick={() => go(i + 1)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button onClick={() => w.setSection("design")} className="flex items-center gap-1 rounded-md bg-teal px-3 py-1.5 text-xs text-accent-foreground">
              Experiment in the Design Studio <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
