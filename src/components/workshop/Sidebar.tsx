import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CircleHelp, Compass, FlaskConical, FolderOpen, Hammer, Ruler, ScanSearch, Scissors, Sprout } from "lucide-react";
import type { ChairId } from "@/lib/storage/chairProgress";
import { useWorkshop, type Section } from "./store";
import { cn } from "@/lib/utils";

// Main path for a first visit / 3-minute demo: learn → change → build → assemble.
type Nav = { id: Section; label: string; hint: string; icon: typeof Compass };
const LEARN: Nav = { id: "study", label: "Learn the chair", hint: "Guided tour of every part", icon: ScanSearch };
const CHANGE: Nav = { id: "design", label: "Change the chair", hint: "Sliders → see what breaks", icon: Ruler };
const ASSEMBLE: Nav = { id: "build", label: "Assembly order", hint: "Put the build steps in order", icon: Hammer };
const TEMPLATES: Nav = { id: "templates", label: "Templates", hint: "Real-size shapes to trace", icon: Scissors };
const LAB: Nav = { id: "lab", label: "Build your own", hint: "Pick parts, then test it", icon: FlaskConical };
const MAIN: Record<ChairId, Nav[]> = { kangaroo: [LEARN, CHANGE, ASSEMBLE, TEMPLATES], japanese: [CHANGE, ASSEMBLE, TEMPLATES], lab: [LAB] };
const NAME: Record<ChairId, string> = { kangaroo: "Kangaroo lounge chair", japanese: "Kuro spindle-back", lab: "Your own chair" };

const MORE: { id: Section; label: string; icon: typeof Compass }[] = [
  { id: "how", label: "How the numbers work", icon: CircleHelp },
  { id: "projects", label: "Saved designs", icon: FolderOpen },
  { id: "library", label: "Reading library", icon: BookOpen },
  { id: "progress", label: "Your progress", icon: Sprout },
];

export function Sidebar() {
  const { section, setSection, chair } = useWorkshop();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r hairline bg-sidebar">
      <div className="px-6 pt-7 pb-6">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-walnut hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> All furniture
        </Link>
        <div className="mt-4 font-serif text-xl tracking-tight">{NAME[chair]}</div>
        <div className="eyebrow mt-1">Atelier · Chairs</div>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {MAIN[chair].map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "group flex items-start gap-3 rounded-md px-3 py-2 text-left transition-colors",
              section === n.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <n.icon className={cn("mt-0.5 h-4 w-4 shrink-0", section === n.id ? "text-teal" : "")} strokeWidth={1.5} />
            <span>
              <span className="block text-sm">{n.label}</span>
              <span className="block text-[11px] text-muted-foreground">{n.hint}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-auto px-3 pb-5">
        <div className="eyebrow px-3 pb-1.5">More</div>
        {MORE.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-xs transition-colors",
              section === n.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <n.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {n.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
