import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, MoveUpRight, Rotate3D } from "lucide-react";
import type { ChairId } from "@/lib/storage/chairProgress";

const ChairPreview = lazy(() => import("@/components/three/ChairPreview"));

const PIECES = [
  {
    id: "kangaroo" as const,
    name: "Kangaroo lounge chair",
    short: "The modernist",
    lineage: "Chandigarh modernism",
    material: "Teak & cane",
    description: "A leaning frame. A woven seat. Discover how a few thoughtful parts become a chair that holds its own.",
    action: "Study this chair",
    path: "A guided place to begin",
    icon: "M18 66 30 35 69 35 M30 35 43 66 M69 35 83 9 M60 35 75 66 M33 29 70 29 80 9",
  },
  {
    id: "japanese" as const,
    name: "Kuro spindle-back",
    short: "The quiet classic",
    lineage: "Japanese mingei spirit",
    material: "Solid wood & black lacquer",
    description: "Splayed legs, slender spindles, a curved crest. Explore a different way to give a chair strength and character.",
    action: "Explore this chair",
    path: "Explore form & joinery",
    icon: "M22 39 78 39 M28 39 18 70 M72 39 82 70 M30 39 27 13 M50 39 50 10 M70 39 73 13 M24 13 Q50 2 76 13",
  },
  {
    id: "lab" as const,
    name: "Your own chair",
    short: "The blank bench",
    lineage: "An experiment in making",
    material: "Your parts. Your wood. Your idea.",
    description: "Start with a possibility. Choose a base, a back and a joint, then find out what makes your design stand up.",
    action: "Open the component lab",
    path: "Choose, combine & test",
    icon: "M23 39 77 39 M28 39 28 70 M72 39 72 70 M28 39 28 11 M72 39 72 11 M28 11 72 11 M50 22 50 34 M44 28 56 28",
  },
];

function ChairSketch({ path }: { path: string }) {
  return <svg viewBox="0 0 100 80" fill="none" aria-hidden="true"><path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

class PreviewBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function CollectionLanding({ onOpen, entering }: { onOpen: (chair: ChairId) => void; entering: boolean }) {
  const [selected, setSelected] = useState<ChairId>("kangaroo");
  const reduce = useReducedMotion();
  const piece = PIECES.find((p) => p.id === selected)!;
  const fallback = <div className="collection-preview-fallback"><ChairSketch path={piece.icon} /><span>A study in form & joinery</span></div>;

  return (
    <main id="main-content" className="collection-main">
      <section className="collection-hero" aria-labelledby="collection-title">
        <div className="collection-intro">
          <p className="collection-eyebrow"><span /> A hands-on furniture studio</p>
          <h1 id="collection-title">Learn the craft.<br />Make it <em>your own.</em></h1>
          <p className="collection-lede">Get to know a chair from the inside out. Explore its parts, shape its form, and see what makes it work — before you make the first cut.</p>
          <button className="collection-primary" disabled={entering} onClick={() => onOpen(selected)}>{piece.action}<ArrowRight size={17} /></button>
          <p className="collection-cta-note">{piece.path} <span aria-hidden="true">·</span> No account needed</p>
          <a className="collection-scroll" href="#choose-piece"><ArrowDown size={14} /> Find your starting point</a>
        </div>

        <motion.div className="collection-exhibit" initial={false} animate={{ opacity: entering ? 0 : 1, scale: entering && !reduce ? 1.12 : 1 }} transition={{ duration: 0.45 }}>
          <div className="collection-exhibit-top"><span>The furniture studies</span><span className="collection-live"><span /> Interactive model</span></div>
          <div className="collection-model" aria-label={`Interactive preview of ${piece.name}`}>
            <PreviewBoundary key={selected} fallback={fallback}>
              <ClientOnly fallback={fallback}>
                <Suspense fallback={fallback}><ChairPreview chair={selected} autoRotate={!reduce} /></Suspense>
              </ClientOnly>
            </PreviewBoundary>
          </div>
          <div className="collection-model-hint"><Rotate3D size={14} /> Drag to look around</div>
          <div className="collection-specimen" aria-live="polite" aria-atomic="true">
            <div><p className="collection-eyebrow">{piece.lineage}</p><h2>{piece.name}</h2><p>{piece.material}</p></div>
            <span className="collection-specimen-mark" aria-hidden="true">a.</span>
          </div>
        </motion.div>
      </section>

      <section id="choose-piece" className="collection-choices" aria-labelledby="choose-title">
        <div className="collection-section-heading"><h2 id="choose-title">Every piece is a place to begin.</h2><span>Choose a study for the bench</span></div>
        <div className="collection-piece-grid" role="group" aria-label="Choose a furniture study">
          {PIECES.map((p) => <button key={p.id} className={`collection-piece ${selected === p.id ? "is-selected" : ""}`} aria-pressed={selected === p.id} onClick={() => setSelected(p.id)} disabled={entering}>
            <div className="collection-piece-icon"><ChairSketch path={p.icon} /></div>
            <div><span className="collection-eyebrow">{p.short}</span><h3>{p.name}</h3><p>{p.path}</p></div>
            <MoveUpRight size={17} aria-hidden="true" />
          </button>)}
        </div>
        <div className="collection-selection" aria-live="polite"><p>{piece.description}</p><button disabled={entering} onClick={() => onOpen(selected)}>Set this piece on the bench <ArrowRight size={15} /></button></div>
      </section>

      <section className="collection-method" aria-label="How Atelier works">
        <p className="collection-eyebrow">From curiosity to craft</p>
        <div><h3>Study the form.</h3><p>Look closer. Understand each part and the job it does.</p></div>
        <div><h3>Make a change.</h3><p>Adjust the design. See how balance and strength respond.</p></div>
        <div><h3>Take it to the shop.</h3><p>Explore the assembly and prepare a cut list for your wood.</p></div>
      </section>
      <footer className="collection-footer"><span className="font-serif">Atelier</span><p>A little understanding. A lasting thing.</p><span>Starting with chairs. More to come.</span></footer>
    </main>
  );
}
