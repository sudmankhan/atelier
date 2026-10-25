import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createFileRoute } from "@tanstack/react-router";
import { AtelierEntrance } from "@/components/AtelierEntrance";
import { Chandelier } from "@/components/Chandelier";
import { shopSession } from "@/lib/shopSession";
import type { PieceId } from "@/lib/storage/chairProgress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — Learn to build furniture" },
      {
        name: "description",
        content:
          "Pick a piece, change it in 3D, see where it would break, fit it to your wood and print the cut list. Starting with chairs.",
      },
      { property: "og:title", content: "Atelier — Learn to build furniture" },
      {
        property: "og:description",
        content:
          "An interactive furniture-building studio. Starting with chairs: design, test, fit to your boards, and take it to the shop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = Route.useNavigate();
  const reduce = useReducedMotion();
  const [entering, setEntering] = useState<PieceId | null>(null);
  const [entryError, setEntryError] = useState(false);
  const busy = useRef(false);
  const openChair = (chair: PieceId) => {
    if (busy.current) return;
    busy.current = true;
    setEntryError(false);
    if (reduce) void enterWorkshop(chair);
    else setEntering(chair);
  };
  const enterWorkshop = async (chair: PieceId) => {
    shopSession("atelier-workshop-enter", "yes");
    try {
      await navigate({ to: "/workshop", search: { chair } });
    } catch {
      shopSession("atelier-workshop-enter", null);
      setEntering(null);
      busy.current = false;
      setEntryError(true);
    }
  };

  return (
    <AtelierEntrance>
      <div className="collection-page branch-page">
        <a href="#main-content" className="collection-skip">
          Skip to content
        </a>
        <div inert={!!entering}>
          <header className="collection-header">
            <a href="/" className="collection-wordmark" aria-label="Atelier home">
              Atelier<span aria-hidden="true">.</span>
            </a>
            <span className="collection-header-note">Wood, joinery & the craft of furniture</span>
            <span className="branch-header-note">Measure. Mark. Make.</span>
          </header>
          <main id="main-content" className="branch-main">
            <Chandelier interactive={!entering} entering={!!entering} onOpen={openChair} />
          </main>
          {entryError && (
            <p role="alert" className="collection-error">
              The workshop could not open. Please try again.
            </p>
          )}
        </div>
        {entering && (
          <motion.div
            className="collection-enter-wash"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeIn" }}
            onAnimationComplete={() => void enterWorkshop(entering)}
          />
        )}
      </div>
    </AtelierEntrance>
  );
}
