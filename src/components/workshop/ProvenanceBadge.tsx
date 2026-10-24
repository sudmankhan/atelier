import { Info } from "lucide-react";
import { PROVENANCE, type Provenance } from "@/lib/explainers";
import { cn } from "@/lib/utils";
import { useWorkshop } from "./store";

const TONE: Record<Provenance, string> = {
  calculated: "border-teal/50 text-teal",
  assumption: "border-walnut/50 text-walnut",
  rule: "border-muted-foreground/40 text-muted-foreground",
  ai: "border-alert/40 text-alert",
};

/** Says where a number comes from; with `topic`, links to its How-it-works explainer. */
export function ProvenanceBadge({ kind, topic, className }: { kind: Provenance; topic?: string; className?: string }) {
  const { openHow } = useWorkshop();
  const p = PROVENANCE[kind];
  const body = (
    <>
      {p.label}
      {topic && <Info className="h-2.5 w-2.5" />}
    </>
  );
  const cls = cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[9px] uppercase tracking-wide", TONE[kind], className);
  return topic ? (
    <button type="button" title={`${p.meaning} Click for how it works.`} onClick={() => openHow(topic)} className={cn(cls, "hover:bg-secondary")}>{body}</button>
  ) : (
    <span title={p.meaning} className={cls}>{body}</span>
  );
}
