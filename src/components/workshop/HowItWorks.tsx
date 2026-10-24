import { useEffect, useRef } from "react";
import { EXPLAINERS, PRIMER, PROVENANCE, type Provenance } from "@/lib/explainers";
import { HANDBOOK, HANDBOOK_URL } from "@/lib/chair/woodProperties";
import { cn } from "@/lib/utils";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { useWorkshop } from "./store";

export function HowItWorks() {
  const { howTopic } = useWorkshop();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (howTopic) root.current?.querySelector(`#how-${howTopic}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [howTopic]);

  return (
    <main ref={root} className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-10 px-8 py-10">
        <header>
          <div className="eyebrow">How it works</div>
          <h1 className="mt-1 text-3xl">What every number means, and where it comes from</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            FORM & GRAIN teaches why chairs look the way they do by showing the forces inside them. Every number carries a badge saying how much to trust it. Wood data comes from the{" "}
            <a href={HANDBOOK_URL} target="_blank" rel="noreferrer" className="underline">{HANDBOOK}</a>.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(Object.keys(PROVENANCE) as Provenance[]).map((k) => (
              <div key={k} className="rounded-md border hairline p-3 text-xs">
                <ProvenanceBadge kind={k} />
                <p className="mt-1.5 text-muted-foreground">{PROVENANCE[k].meaning}</p>
              </div>
            ))}
          </div>
        </header>

        <section>
          <h2 className="text-xl">Woodworking in one minute</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {PRIMER.map((p) => (
              <div key={p.term}><dt className="inline font-medium">{p.term}: </dt><dd className="inline text-muted-foreground">{p.meaning}</dd></div>
            ))}
          </dl>
        </section>

        {EXPLAINERS.map((e) => (
          <section key={e.id} id={`how-${e.id}`} className={cn("scroll-mt-6 rounded-xl border hairline p-5", howTopic === e.id && "border-teal")}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl">{e.title}</h2>
              {e.provenance.map((k) => <ProvenanceBadge key={k} kind={k} />)}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{e.where}</div>
            <p className="mt-3 text-sm">{e.what}</p>
            <h3 className="eyebrow mt-4">The physics</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{e.physics.map((x) => <li key={x}>{x}</li>)}</ul>
            {e.values.length > 0 && (
              <>
                <h3 className="eyebrow mt-4">The numbers and why they're there</h3>
                <div className="mt-1 space-y-1.5 text-sm">
                  {e.values.map((v) => (
                    <div key={v.name} className="rounded-md bg-secondary/40 px-3 py-2">
                      <span className="font-medium">{v.name}</span> <span className="font-mono text-xs">{v.value}</span>
                      <div className="text-xs text-muted-foreground">{v.why} <span className="italic">Source: {v.source}.</span></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h3 className="eyebrow mt-4">How it helps</h3>
            <p className="mt-1 text-sm text-muted-foreground">{e.helps}</p>
            <h3 className="eyebrow mt-4">What it can't tell you</h3>
            <p className="mt-1 text-sm text-muted-foreground">{e.limits}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
