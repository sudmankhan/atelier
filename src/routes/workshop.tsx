import { createFileRoute } from "@tanstack/react-router";
import { WorkshopProvider, useWorkshop, type Section } from "@/components/workshop/store";
import { Sidebar } from "@/components/workshop/Sidebar";
import { Stage } from "@/components/workshop/Stage";
import { Bench } from "@/components/workshop/Bench";
import { Discover, Library, ProgressPage, Projects } from "@/components/workshop/Pages";
import { ComponentLab } from "@/components/workshop/ComponentLab";
import { HowItWorks } from "@/components/workshop/HowItWorks";
import { Templates } from "@/components/workshop/Templates";
import { CHAIR_IDS, type ChairId } from "@/lib/storage/chairProgress";

const SECTIONS: Section[] = ["discover", "study", "design", "build", "lab", "projects", "library", "progress", "how", "templates"];

export const Route = createFileRoute("/workshop")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { section?: Section; chair?: ChairId } => ({
    section: SECTIONS.includes(s["section"] as Section) ? (s["section"] as Section) : undefined,
    chair: CHAIR_IDS.includes(s["chair"] as ChairId) ? (s["chair"] as ChairId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "The Workshop — Atelier" },
      { name: "description", content: "Inspect, reshape and assemble a Kangaroo-inspired lounge chair in an interactive 3D woodworking studio." },
      { property: "og:title", content: "The Workshop — Atelier" },
      { property: "og:description", content: "Inspect, reshape and assemble a Kangaroo-inspired lounge chair in 3D, with a master woodworker to guide you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkshopPage,
});

function WorkshopPage() {
  const { section, chair = "kangaroo" } = Route.useSearch();
  const start: Section = chair === "lab" ? "lab" : (section ?? (chair === "kangaroo" ? "study" : "design"));
  return (
    <WorkshopProvider key={chair} initialSection={start} chair={chair}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <Center />
        {chair !== "lab" && <Bench />}
      </div>
    </WorkshopProvider>
  );
}

function Center() {
  const { section } = useWorkshop();
  if (section === "discover") return <Discover />;
  if (section === "projects") return <Projects />;
  if (section === "lab") return <ComponentLab />;
  if (section === "library") return <Library />;
  if (section === "progress") return <ProgressPage />;
  if (section === "how") return <HowItWorks />;
  if (section === "templates") return <Templates />;
  return <Stage />;
}
