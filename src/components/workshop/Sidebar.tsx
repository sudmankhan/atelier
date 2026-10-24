import { Link } from "@tanstack/react-router";
import { BookOpen, CircleHelp, Compass, FlaskConical, FolderOpen, Hammer, Ruler, ScanSearch, Sprout } from "lucide-react";
import { useWorkshop, type Section } from "./store";
import { cn } from "@/lib/utils";

// Main path for a first visit / 3-minute demo: learn → change → build → assemble.
const MAIN: { id: Section; label: string; hint: string; icon: typeof Compass }[] = [
  { id: "study", label: "Learn a chair", hint: "Guided tour of every part", icon: ScanSearch },
  { id: "design", label: "Change a chair", hint: "Sliders → see what breaks", icon: Ruler },
  { id: "lab", label: "Build your own", hint: "Pick parts, then test it", icon: FlaskConical },
  { id: "build", label: "Assembly order", hint: "Put the build steps in order", icon: Hammer },
];

const MORE: { id: Section; label: string; icon: typeof Compass }[] = [
  { id: "how", label: "How the numbers work", icon: CircleHelp },
  { id: "discover", label: "The two chairs", icon: Compass },
  { id: "projects", label: "Saved designs", icon: FolderOpen },
  { id: "library", label: "Reading library", icon: BookOpen },
  { id: "progress", label: "Your progress", icon: Sprout },
];

export function Sidebar() {
  const { section, setSection } = useWorkshop();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r hairline bg-sidebar">
      <Link to="/" className="px-6 pt-7 pb-6">
        <div className="font-serif text-xl tracking-tight">FORM <span className="italic text-walnut">&</span> GRAIN</div>
        <div className="eyebrow mt-1">The Workshop</div>
      </Link>
      <nav className="flex flex-col gap-0.5 px-3">
        {MAIN.map((n) => (
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
