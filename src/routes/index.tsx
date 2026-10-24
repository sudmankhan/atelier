import { lazy, Suspense } from "react";
import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const HeroChair = lazy(() => import("@/components/three/HeroChair"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FORM & GRAIN — Interactive Chair Design & Woodworking Studio" },
      { name: "description", content: "Design chairs in 3D, see grain and joint stress live, test your own builds and get shop-ready cut lists and angles." },
      { property: "og:title", content: "FORM & GRAIN — Interactive Chair Design & Woodworking Studio" },
      { property: "og:description", content: "Learn chairmaking by changing real chairs and building your own: live grain, joints, stability and shop output." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PILLARS = [
  ["Take great chairs apart", "Explode historic chairs piece by piece in 3D and learn why every part is shaped the way it is.", "study"],
  ["Change them and see what breaks", "Drag the sliders. Joint stress, grain direction, tipping and angles recalculate as you move.", "design"],
  ["Build your own from scratch", "Pick legs, seat, back, joints and wood. See it in 3D, x-ray the joints, then test it.", "lab"],
  ["Take it to the shop", "Cut list with rough and finished sizes, saw and drill angles, and the right glue-up order.", "build"],
] as const;

const CHAIRS = [
  ["Kangaroo lounge chair", "Chandigarh modernism · teak & cane", "A Z-shaped side frame that leans back on its own kickstand."],
  ["Kuro spindle-back armchair", "Japanese mingei spirit · black lacquer", "Splayed legs wedged through a solid seat, with a bent crest rail."],
] as const;

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-10 py-7">
        <div className="font-serif text-xl tracking-tight">
          FORM <span className="italic text-walnut">&</span> GRAIN
        </div>
        <Link to="/workshop" className="text-sm hover:text-teal">Open the workshop →</Link>
      </header>

      <section className="relative grid min-h-[calc(100vh-88px)] items-center md:grid-cols-[1fr_1.1fr]">
        <div className="relative z-10 px-10 pb-16 md:pl-16">
          <div className="eyebrow animate-rise">An interactive chairmaking studio</div>
          <h1 className="mt-6 text-5xl leading-[1.02] animate-rise md:text-7xl" style={{ animationDelay: "0.1s" }}>
            Design chairs that <em className="text-walnut">hold up.</em>
          </h1>
          <p className="mt-7 max-w-md text-muted-foreground animate-rise" style={{ animationDelay: "0.25s" }}>
            Learn chair design the way woodworkers do: by changing a real chair and watching what happens to its joints, grain and balance — then building your own and taking it to the shop.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 animate-rise" style={{ animationDelay: "0.4s" }}>
            <Link to="/workshop" search={{ section: "lab" }} className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm text-primary-foreground hover:opacity-90">
              Build your own chair <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/workshop" search={{ section: "design" }} className="inline-flex items-center gap-2 rounded-md border hairline px-6 py-3.5 text-sm hover:bg-secondary">
              Change a classic chair
            </Link>
          </div>
        </div>
        <div className="relative h-[60vh] md:h-full">
          <div className="absolute inset-0 grid-paper opacity-70" />
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <div className="absolute inset-0"><HeroChair /></div>
            </Suspense>
          </ClientOnly>
        </div>
      </section>

      <section className="border-t hairline px-10 py-16 md:px-16">
        <div className="eyebrow">What you can do</div>
        <div className="mt-6 grid gap-10 md:grid-cols-4">
          {PILLARS.map(([t, d, s], i) => (
            <Link key={t} to="/workshop" search={{ section: s }} className="group block">
              <div className="font-mono text-xs text-measure">0{i + 1}</div>
              <div className="mt-3 font-serif text-2xl group-hover:text-teal">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t hairline px-10 py-16 md:px-16">
        <div className="eyebrow">Chairs on the bench</div>
        <div className="mt-6 grid gap-px bg-border md:grid-cols-3">
          {CHAIRS.map(([n, s, d]) => (
            <div key={n} className="bg-background p-8">
              <div className="font-mono text-[10px] text-measure">{s}</div>
              <div className="mt-2 font-serif text-2xl">{n}</div>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
          <div className="bg-background p-8">
            <div className="font-mono text-[10px] text-measure">Yours</div>
            <div className="mt-2 font-serif text-2xl">Your own chair</div>
            <p className="mt-2 text-sm text-muted-foreground">Start from a blank bench and test it for tipping, loose joints, comfort and wood choice.</p>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-xs text-muted-foreground">
          Both classic chairs are educational reconstructions, not exact copies. Stress and stability numbers are simplified teaching estimates, not a safety certificate.
        </p>
      </section>
    </div>
  );
}
