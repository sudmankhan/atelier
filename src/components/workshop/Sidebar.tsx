import { Link } from "@tanstack/react-router";
import { BookOpen, CircleHelp, Compass, FlaskConical, FolderOpen, Hammer, Ruler, ScanSearch, Sprout } from "lucide-react";
import { useWorkshop, type Section } from "./store";
import { BUILD_STEPS } from "@/lib/lessons";
import { cn } from "@/lib/utils";

const NAV: { id: Section; label: string; icon: typeof Compass }[] = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "study", label: "Anatomy walkthrough", icon: ScanSearch },
  { id: "design", label: "Parametric Studio", icon: Ruler },
  { id: "build", label: "Assembly order", icon: Hammer },
  { id: "lab", label: "Component Lab", icon: FlaskConical },
  { id: "projects", label: "My Projects", icon: FolderOpen },
  { id: "library", label: "Learning Library", icon: BookOpen },
  { id: "progress", label: "Apprentice Progress", icon: Sprout },
  { id: "how", label: "How it works", icon: CircleHelp },
];

export function Sidebar() {
  const { section, setSection, progress } = useWorkshop();
  const pct = Math.round((progress.buildCompleted.length / BUILD_STEPS.length) * 100);
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r hairline bg-sidebar">
      <Link to="/" className="px-6 pt-7 pb-8">
        <div className="font-serif text-xl tracking-tight">FORM <span className="italic text-walnut">&</span> GRAIN</div>
        <div className="eyebrow mt-1">The Workshop</div>
      </Link>
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
              section === n.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <n.icon className={cn("h-4 w-4", section === n.id ? "text-teal" : "")} strokeWidth={1.5} />
            {n.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t hairline px-6 py-5">
        <div className="eyebrow">Apprenticeship</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-teal transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{pct}% of the build complete</div>
      </div>
    </aside>
  );
}
