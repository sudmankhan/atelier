import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Trash2 } from "lucide-react";
import { SideProfile } from "@/components/SideProfile";
import { BASELINE, PARAM_SPECS, WOODS, type ChairParams } from "@/lib/chair/params";
import { J_BASELINE, J_PARAM_SPECS, type JapaneseParams } from "@/lib/chair/japanese/params";
import { computeGeometry } from "@/lib/chair/geometry";
import { computeJapanese } from "@/lib/chair/japanese/geometry";
import { KNOWLEDGE } from "@/lib/knowledge/library";
import { retrieveSync } from "@/lib/knowledge/retrieve";
import { TECHNIQUES } from "@/lib/techniques";
import { BUILD_STEPS, WALKTHROUGH } from "@/lib/lessons";
import { useWorkshop } from "./store";
import { cn } from "@/lib/utils";

function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto paper">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl px-10 py-12">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 text-5xl leading-[1.05]">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-muted-foreground">{intro}</p>}
        <div className="mt-10">{children}</div>
      </motion.div>
    </div>
  );
}

const EXHIBIT = [
  ["History & purpose", "Associated with Pierre Jeanneret's furniture for Chandigarh, the modernist capital planned in the 1950s. Local teak and cane, simple repeatable construction."],
  ["Low lounge proportions", "A low seat, a deep seat plane and a reclined back — a chair for resting, not for the table."],
  ["Z-shaped side frames", "Each side is one flowing gesture: front leg, seat support, back post, with a rear support kicking back like a tail."],
  ["Seat & back geometry", "The interior angle between seat and back, plus a slight seat slope, sets the posture."],
  ["Teak & woven cane", "A dense, durable frame paired with a light, breathable woven skin."],
  ["Shaped components", "Curves are sawn or bent — each choice trades material, strength and labour."],
  ["Why joinery matters", "Every joint inherits its angle from the frame. Change the form, and every joint changes."],
];

const J_EXHIBIT = [
  ["Mingei spirit", "In the spirit of Japanese folk craft: structure as ornament, proportion as decoration, nothing superfluous."],
  ["Splayed legs", "Four legs kick out in two planes, widening the footprint — stability through stance, not through stretchers."],
  ["The slab seat", "One solid slab is the structural heart: legs socket in below, posts and spindles rise above."],
  ["Spindle back", "Slender spindles between two posts carry a curved crest rail — light to the eye, tied together at the top."],
  ["Black lacquer, pale seat", "Built-up urushi-style lacquer on the frame against a clear, shaped seat slab."],
  ["Wedged joints", "Legs are through-tenoned and wedged into the slab — sitting drives the joint tighter."],
];

const STYLES = [
  { name: "Mid-Century Modern", sub: "Chandigarh Modernism", live: true },
  { name: "Japanese Minimalist", sub: "Mingei-inspired", live: true },
  { name: "Scandinavian", sub: "Coming Soon", live: false },
  { name: "Shaker", sub: "Coming Soon", live: false },
  { name: "Contemporary", sub: "Coming Soon", live: false },
];

function ChairShowcase({
  eyebrow,
  title,
  intro,
  exhibit,
  profile,
  cta,
  onStudy,
  onDesign,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  exhibit: string[][];
  profile: React.ReactNode;
  cta: string;
  onStudy: () => void;
  onDesign: () => void;
}) {
  return (
    <section>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-2 text-4xl leading-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      <div className="mt-8 grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border hairline bg-card grid-paper p-4">
          {profile}
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span className="font-mono">Side elevation · educational reconstruction</span>
            <span className="font-mono text-measure">cm</span>
          </div>
        </div>
        <div className="flex flex-col">
          <ol className="divide-y hairline border-y hairline">
            {exhibit.map(([t, d], i) => (
              <li key={t} className="flex gap-4 py-3">
                <span className="font-mono text-xs text-measure">0{i + 1}</span>
                <div>
                  <div className="text-sm">{t}</div>
                  <div className="text-xs leading-relaxed text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex gap-2">
            <button onClick={onStudy} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm text-primary-foreground hover:opacity-90">
              {cta} <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onDesign} className="rounded-md border hairline px-5 py-3 text-sm hover:bg-secondary">
              Open in Design Studio
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Discover() {
  const w = useWorkshop();
  return (
    <PageShell eyebrow="Discover · Masterpieces" title="Two chairs, two traditions" intro="Study each chair, then open it in the Design Studio and reshape it while the Master watches the numbers.">
      <ChairShowcase
        eyebrow="Mid-Century Modern · Chandigarh"
        title="The Kangaroo Chair"
        intro="A low teak-and-cane lounge chair associated with Pierre Jeanneret's work for Chandigarh."
        exhibit={EXHIBIT}
        profile={<SideProfile params={BASELINE} typology="kangaroo" width={420} height={300} className="w-full" />}
        cta="Study This Chair"
        onStudy={() => {
          w.setTypology("kangaroo");
          w.updateProgress((p) => ({ ...p, walkStep: 0 }));
          w.setSection("study");
        }}
        onDesign={() => {
          w.setTypology("kangaroo");
          w.setSection("design");
        }}
      />
      <div className="my-16 border-t hairline" />
      <ChairShowcase
        eyebrow="Japanese Minimalist · Mingei-inspired"
        title="The Kuro Armchair"
        intro="A black-lacquered spindle-back armchair with a pale solid seat — splayed legs, wedged joints, a curved crest rail."
        exhibit={J_EXHIBIT}
        profile={<SideProfile params={J_BASELINE} typology="japanese" width={420} height={300} className="w-full" />}
        cta="Design This Chair"
        onStudy={() => {
          w.setTypology("japanese");
          w.setSection("design");
        }}
        onDesign={() => {
          w.setTypology("japanese");
          w.setSection("design");
        }}
      />
      <div className="mt-16">
        <div className="eyebrow">Style categories</div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {STYLES.map((s) => (
            <div
              key={s.name}
              className={cn(
                "flex aspect-[3/4] flex-col justify-between rounded-lg border p-4",
                s.live ? "border-teal bg-card" : "hairline bg-secondary/40 text-muted-foreground",
              )}
            >
              <span className={cn("eyebrow", s.live && "text-teal")}>{s.live ? "Available" : "Coming Soon"}</span>
              <div>
                <div className="font-serif text-lg leading-tight text-foreground/90">{s.name}</div>
                <div className="mt-1 text-[11px]">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function Projects() {
  const w = useWorkshop();
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const da = w.designs.find((d) => d.id === a);
  const db = w.designs.find((d) => d.id === b);
  const comparable = da && db && da.typology === db.typology;
  const specsFor = (t: string) => (t === "kangaroo" ? PARAM_SPECS : J_PARAM_SPECS);
  const woodLabel = (d: (typeof w.designs)[number]) =>
    d.typology === "kangaroo" ? WOODS[(d.params as ChairParams).wood]?.label : (d.params as JapaneseParams).finish;
  return (
    <PageShell eyebrow="My Projects" title="Saved designs" intro="Designs are kept in this browser. Load one to keep working, or pick two of the same chair to compare.">
      {w.designs.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-8 text-center">
          <p className="text-muted-foreground">No saved designs yet.</p>
          <button onClick={() => w.setSection("design")} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Open the Design Studio
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {w.designs.map((d) => (
            <div key={d.id} className="flex gap-4 rounded-xl border hairline bg-card p-4">
              <SideProfile params={d.params} typology={d.typology} width={140} height={100} annotate={false} className="w-32 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-serif text-lg">{d.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {d.typology === "kangaroo" ? "Kangaroo" : "Japanese"} · {new Date(d.savedAt).toLocaleString()} · {woodLabel(d)}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      w.setTypology(d.typology);
                      w.setParams(d.params);
                      w.setSection("design");
                    }}
                    className="rounded-md bg-primary px-2.5 py-1 text-primary-foreground"
                  >
                    Load
                  </button>
                  <button onClick={() => setA(d.id)} className={cn("rounded-md border px-2.5 py-1", a === d.id ? "border-teal bg-teal-soft" : "hairline")}>A</button>
                  <button onClick={() => setB(d.id)} className={cn("rounded-md border px-2.5 py-1", b === d.id ? "border-teal bg-teal-soft" : "hairline")}>B</button>
                  <button onClick={() => w.deleteDesign(d.id)} aria-label="Delete" className="ml-auto rounded-md px-2 py-1 text-muted-foreground hover:text-alert">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {da && db && !comparable && (
        <p className="mt-8 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">A and B are different chairs — pick two designs of the same typology to compare.</p>
      )}
      {comparable && (
        <div className="mt-10 rounded-xl border hairline bg-card p-6">
          <div className="eyebrow">Comparison</div>
          <div className="mt-1 font-serif text-2xl">{da.name} <span className="text-muted-foreground">vs</span> {db.name}</div>
          <div className="mt-4 rounded-lg bg-background grid-paper">
            <SideProfile params={db.params} typology={db.typology} baseline={da.params} width={520} height={260} className="w-full" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Dashed: A · Solid: B</p>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y hairline">
              {specsFor(da.typology).map((s) => (
                <tr key={s.key}>
                  <td className="py-1.5">{s.label}</td>
                  <td className="py-1.5 text-right font-mono text-xs">{(da.params as unknown as Record<string, number>)[s.key]}{s.unit}</td>
                  <td className="py-1.5 text-right font-mono text-xs">{(db.params as unknown as Record<string, number>)[s.key]}{s.unit}</td>
                </tr>
              ))}
              <tr>
                <td className="py-1.5">Footprint depth</td>
                <td className="py-1.5 text-right font-mono text-xs">
                  {da.typology === "kangaroo" ? computeGeometry(da.params as ChairParams).footprintDepth.toFixed(1) : computeJapanese(da.params as JapaneseParams).footprintDepth.toFixed(1)}cm
                </td>
                <td className="py-1.5 text-right font-mono text-xs">
                  {db.typology === "kangaroo" ? computeGeometry(db.params as ChairParams).footprintDepth.toFixed(1) : computeJapanese(db.params as JapaneseParams).footprintDepth.toFixed(1)}cm
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

function TechniqueCard({ id }: { id: string }) {
  const t = TECHNIQUES.find((x) => x.id === id)!;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border hairline bg-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <div>
          <div className="font-serif text-lg">{t.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{t.summary}</div>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="space-y-3 border-t hairline px-5 py-4">
          {t.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-soft font-mono text-[10px] text-teal">{i + 1}</span>
              <div>
                <div className="text-sm">{s.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function Library() {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? retrieveSync(q, {}, 8) : KNOWLEDGE), [q]);
  return (
    <PageShell eyebrow="Learning Library" title="The craft, in principles" intro="Curated woodworking principles and step-by-step technique guides. The Master draws on exactly these entries.">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search — e.g. joinery, recline, cane, splay"
        className="w-full rounded-md border hairline bg-card px-4 py-3 text-sm outline-none focus:border-teal"
      />
      <div className="mt-6 divide-y hairline border-y hairline">
        {results.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nothing in the library matches that yet.</p>}
        {results.map((e) => (
          <article key={e.id} className="grid gap-2 py-5 md:grid-cols-[200px_1fr]">
            <div>
              <div className="font-serif text-xl">{e.topic}</div>
            </div>
            <div>
              <div className="text-sm">{e.principle}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.explanation}</p>
              <div className="mt-2 text-[11px] text-muted-foreground">{e.sourceTitle}</div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-14">
        <div className="eyebrow">Learn the Craft</div>
        <h2 className="mt-1 text-3xl">Technique guides</h2>
        <p className="mt-2 text-xs text-muted-foreground">Step-by-step instruction, in the workshop — no external videos needed.</p>
        <div className="mt-5 space-y-3">
          {TECHNIQUES.map((t) => (
            <TechniqueCard key={t.id} id={t.id} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function ProgressPage() {
  const w = useWorkshop();
  const p = w.progress;
  return (
    <PageShell eyebrow="Apprentice Progress" title="Your apprenticeship" intro="Progress is saved in this browser.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border hairline bg-card p-6">
          <div className="eyebrow">Masterpiece study</div>
          <div className="mt-1 font-serif text-2xl">{p.walkDone ? "Completed" : `Step ${p.walkStep + 1} of ${WALKTHROUGH.length}`}</div>
          <p className="mt-1 text-sm text-muted-foreground">{WALKTHROUGH[p.walkStep]?.title}</p>
          <button onClick={() => w.setSection("study")} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Continue study</button>
        </div>
        <div className="rounded-xl border hairline bg-card p-6">
          <div className="eyebrow">Build From Scratch</div>
          <div className="mt-1 font-serif text-2xl">{p.buildCompleted.length} / {BUILD_STEPS.length} stages</div>
          <ul className="mt-3 space-y-1.5">
            {BUILD_STEPS.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", p.buildCompleted.includes(i) ? "bg-teal text-accent-foreground" : "border hairline")}>
                  {p.buildCompleted.includes(i) && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className={p.buildCompleted.includes(i) ? "" : "text-muted-foreground"}>{s.title}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => w.setSection("build")} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Continue at stage {p.buildStep + 1}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
