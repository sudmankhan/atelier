import { createFileRoute } from "@tanstack/react-router";
import { Chandelier } from "@/components/Chandelier";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — Learn to build furniture" },
      { name: "description", content: "Pick a piece, change it in 3D, see where it would break, fit it to your wood and print the cut list. Starting with chairs." },
      { property: "og:title", content: "Atelier — Learn to build furniture" },
      { property: "og:description", content: "An interactive furniture-building studio. Starting with chairs: design, test, fit to your boards, and take it to the shop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-baseline justify-between px-10 pt-7 pb-2">
        <div className="font-serif text-xl tracking-tight">Atelier</div>
        <div className="text-xs text-muted-foreground">A furniture-building studio · starting with chairs</div>
      </header>
      <main className="min-h-0 flex-1">
        <Chandelier />
      </main>
    </div>
  );
}
