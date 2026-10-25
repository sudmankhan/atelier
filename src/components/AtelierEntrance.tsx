import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** A fresh invitation on every page load. */
export function AtelierEntrance({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const reduce = useReducedMotion();
  const enter = useRef<HTMLButtonElement>(null);
  const collection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    enter.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (phase === "open")
      collection.current
        ?.querySelector<HTMLElement>(".branch-canvas")
        ?.focus({ preventScroll: true });
  }, [phase]);

  const finish = () => {
    if (phase !== "opening") return;
    setPhase("open");
  };

  return (
    <div className="atelier-entrance-root">
      <motion.div
        ref={collection}
        className="atelier-tree-scene"
        initial={false}
        animate={{
          opacity: phase === "closed" ? 0 : 1,
          scale: reduce || phase !== "closed" ? 1 : 0.96,
        }}
        transition={{ duration: reduce ? 0.15 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        inert={phase !== "open"}
        aria-hidden={phase !== "open"}
      >
        {children}
      </motion.div>
      {phase !== "open" && (
        <motion.section
          className="atelier-welcome"
          aria-labelledby="atelier-welcome-title"
          initial={false}
          animate={{
            opacity: phase === "opening" ? 0 : 1,
            scale: reduce || phase !== "opening" ? 1 : 1.08,
          }}
          transition={{ duration: reduce ? 0.15 : 0.7, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={finish}
        >
          <div className="atelier-welcome-center">
            <h1 id="atelier-welcome-title">
              <button
                ref={enter}
                className="atelier-welcome-enter"
                type="button"
                aria-label="Enter Atelier"
                disabled={phase === "opening"}
                onClick={() => setPhase("opening")}
              >
                <span className="atelier-welcome-wordmark">Atelier</span>
              </button>
            </h1>
          </div>
        </motion.section>
      )}
    </div>
  );
}
