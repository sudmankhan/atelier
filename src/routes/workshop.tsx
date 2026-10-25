import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { shopSession } from "@/lib/shopSession";
import { createFileRoute } from "@tanstack/react-router";
import { WorkshopProvider, useWorkshop, type Section } from "@/components/workshop/store";
import { Sidebar } from "@/components/workshop/Sidebar";
import { Stage } from "@/components/workshop/Stage";
import { Bench } from "@/components/workshop/Bench";
import { Discover, Library, ProgressPage, Projects } from "@/components/workshop/Pages";
import { ComponentLab } from "@/components/workshop/ComponentLab";
import { HowItWorks } from "@/components/workshop/HowItWorks";
import { Templates } from "@/components/workshop/Templates";
import { CHAIR_IDS, isSpecPiece, type PieceId } from "@/lib/storage/chairProgress";
import { findSpec } from "@/lib/furniture/saved";
import { MissingDesign, SpecWorkshop } from "@/components/workshop/SpecWorkshop";
import { arSearch } from "@/lib/furniture/arLink";
import { parseSharedDesign } from "@/lib/furniture/chairARLink";
import type { LabDesign } from "@/lib/lab";
import type { AnyParams } from "@/components/workshop/store";

const SECTIONS: Section[] = ["discover", "study", "design", "build", "lab", "projects", "library", "progress", "how", "templates"];

export const Route = createFileRoute("/workshop")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { section?: Section; chair?: PieceId; dims?: string; ar?: 1; design?: string } => {
    const c = typeof s["chair"] === "string" ? s["chair"] : "";
    const chair = CHAIR_IDS.includes(c as never) ? (c as PieceId) : isSpecPiece(c) && /^spec:[a-z0-9-]+$/.test(c) ? (c as PieceId) : undefined;
    const design = parseSharedDesign(chair ?? "kangaroo", s["design"]);
    return { section: SECTIONS.includes(s["section"] as Section) ? (s["section"] as Section) : undefined, chair, design: design ? s["design"] as string : undefined, ...arSearch(s) };
  },
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
  const reduce = useReducedMotion();
  const [enter] = useState(() => shopSession("atelier-workshop-enter") === "yes");
  useEffect(() => { shopSession("atelier-workshop-enter", null); }, []);
  const { section, chair = "kangaroo", dims, ar, design } = Route.useSearch();
  if (isSpecPiece(chair)) {
    const spec = findSpec(chair.slice(5));
    return spec ? <SpecWorkshop key={chair} spec={spec} initialDims={dims} autoOpenAR={ar === 1} /> : <MissingDesign />;
  }
  const start: Section = chair === "lab" ? "lab" : (section ?? (chair === "kangaroo" ? "study" : "design"));
  const shared = parseSharedDesign(chair, design);
  return (
    <WorkshopProvider key={`${chair}-${design ?? ""}`} initialSection={start} chair={chair} initialParams={chair !== "lab" ? shared as AnyParams | undefined : undefined}>
      <motion.div initial={enter ? { opacity: 0, y: reduce ? 0 : 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0.15 : 0.45, ease: "easeOut" }} className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <Center labDesign={chair === "lab" ? shared as LabDesign | undefined : undefined} autoOpenAR={ar === 1} />
        {chair !== "lab" && <Bench />}
      </motion.div>
    </WorkshopProvider>
  );
}

function Center({ labDesign, autoOpenAR }: { labDesign?: LabDesign; autoOpenAR: boolean }) {
  const { section } = useWorkshop();
  if (section === "discover") return <Discover />;
  if (section === "projects") return <Projects />;
  if (section === "lab") return <ComponentLab initialDesign={labDesign} autoOpenAR={autoOpenAR} />;
  if (section === "library") return <Library />;
  if (section === "progress") return <ProgressPage />;
  if (section === "how") return <HowItWorks />;
  if (section === "templates") return <Templates />;
  return <Stage autoOpenAR={autoOpenAR} />;
}
