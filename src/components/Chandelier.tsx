import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { chairSummary, formatTime, type PieceId } from "@/lib/storage/chairProgress";
import { SPECS } from "@/lib/furniture/spec";

const ChairPreview = lazy(() => import("@/components/three/ChairPreview"));

// Scene colours match the app tokens in styles.css (cream / espresso / walnut / teal).
const C = { ink: "#30251F", wal: "#76543D", teal: "#547D75", mute: "#8C7B6C", line: "#B9A894" };

interface Node {
  id: string;
  p: string | null;
  x: number;
  y: number;
  r: number;
  label: string;
  fs: number;
  serif?: boolean;
  off?: boolean;
  chair?: PieceId;
  fromFile?: boolean;
  icon?: string;
  desc?: string;
}

// World is 1000 × 720. Deeper levels are deliberately tiny until you zoom into them.
const NODES: Node[] = [
  { id: "root", p: null, x: 500, y: 110, r: 9, label: "Atelier", fs: 30, serif: true },
  { id: "chairs", p: "root", x: 560, y: 300, r: 6, label: "Chairs", fs: 20 },
  { id: "tables", p: "root", x: 170, y: 280, r: 5, label: "Tables · soon", fs: 15, off: true },
  { id: "beds", p: "root", x: 340, y: 330, r: 5, label: "Beds · soon", fs: 15, off: true },
  { id: "doors", p: "root", x: 840, y: 290, r: 5, label: "Doors · soon", fs: 15, off: true },
  { id: "mod", p: "chairs", x: 470, y: 440, r: 3.6, label: "Modernist", fs: 10 },
  { id: "jap", p: "chairs", x: 545, y: 465, r: 3.6, label: "Japanese", fs: 10 },
  { id: "nor", p: "chairs", x: 615, y: 440, r: 3.6, label: "Nordic", fs: 10 },
  { id: "own", p: "chairs", x: 685, y: 465, r: 3.6, label: "Your own", fs: 10 },
  { id: "kang", p: "mod", x: 468, y: 530, r: 2, label: "Kangaroo lounge chair", fs: 5.2, chair: "kangaroo", icon: "M-9,7 L-5,-1 L6,-1 M-5,-1 L-2,7 M6,-1 L10,-11 M3,-1 L7,7",
    desc: "Chandigarh modernism. A Z-shaped teak frame that leans back on its own kickstand, with a caned seat and back." },
  { id: "kuro", p: "jap", x: 543, y: 556, r: 2, label: "Kuro spindle-back", fs: 5.2, chair: "japanese", icon: "M-8,-1 L8,-1 M-6,-1 L-9,7 M6,-1 L9,7 M-5,-1 L-5,-10 M0,-1 L0,-10 M5,-1 L5,-10 M-7,-10 Q0,-13 7,-10",
    desc: "Japanese mingei spirit. Splayed legs wedged through a solid seat, a bent crest rail and black lacquer." },
  { id: "lab", p: "own", x: 683, y: 556, r: 2, label: "Your own chair", fs: 5.2, chair: "lab", icon: "M-7,-1 L7,-1 M-6,-1 L-6,7 M6,-1 L6,7 M-6,-1 L-6,-10",
    desc: "Start from a blank bench: pick a base, back, joints and wood, then test it for tipping and wobble." },
];
// Pieces described in data files hang under their style automatically.
const STYLE_NODE: Record<string, string> = { Nordic: "nor", Modernist: "mod", Japanese: "jap" };
const LADDER = "M-7,-1 L7,-1 M-6,-1 L-6,7 M6,-1 L6,7 M-6,-1 L-6,-12 M6,-1 L6,-12 M-6,-10 L6,-10 M-6,-7 L6,-7 M-6,-4 L6,-4";
SPECS.forEach((s, i) => {
  const parent = NODES.find((n) => n.id === (STYLE_NODE[s.style] ?? "nor"))!;
  NODES.push({ id: `spec-${s.id}`, p: parent.id, x: parent.x - 2 + i * 14, y: parent.y + 90, r: 2, label: s.name.replace(/^Nordic /, "").replace(/^./, (c) => c.toUpperCase()), fs: 5.2, chair: `spec:${s.id}`, icon: LADDER, desc: s.description, fromFile: true });
});
const BY = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>;
const kids = (id: string) => NODES.filter((n) => n.p === id);
const descendants = (id: string): Node[] => kids(id).flatMap((k) => [k, ...descendants(k.id)]);
const ancestors = (id: string): string[] => {
  const out: string[] = [];
  let n = BY[id];
  while (n?.p) { out.push(n.p); n = BY[n.p]; }
  return out;
};
type VB = [number, number, number, number];

function fitBox(id: string, aspect: number): VB {
  const n = BY[id]!;
  let x0: number, x1: number, y0: number, y1: number;
  if (n.chair) { x0 = n.x - 40; x1 = n.x + 40; y0 = n.y - 30; y1 = n.y + 30; }
  else {
    const s = [n, ...descendants(id)];
    const pad = id === "root" ? 70 : 28;
    x0 = Math.min(...s.map((m) => m.x)) - pad; x1 = Math.max(...s.map((m) => m.x)) + pad;
    y0 = Math.min(...s.map((m) => m.y)) - pad - (id === "root" ? 80 : 10); y1 = Math.max(...s.map((m) => m.y)) + pad + (id === "root" ? 20 : 30);
  }
  let w = x1 - x0, h = y1 - y0;
  if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; y0 -= (nh - h) / 2; h = nh; }
  return [x0, y0, w, h];
}

export function Chandelier() {
  const navigate = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1000 / 720);
  const [focus, setFocus] = useState("root");
  const [vb, setVb] = useState<VB>([0, 0, 1000, 720]);
  const vbRef = useRef(vb);
  vbRef.current = vb;
  const anim = useRef(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAspect(el.clientWidth / Math.max(1, el.clientHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Glide the camera (viewBox) to the focused branch.
  useEffect(() => {
    const to = fitBox(focus, aspect), from = vbRef.current, t0 = performance.now(), D = 700;
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(anim.current);
    if (reduce) { setVb(to); return; }
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / D), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setVb(from.map((v, i) => v + (to[i]! - v) * e) as VB);
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim.current);
  }, [focus, aspect]);

  const keep = useMemo(() => new Set([focus, ...descendants(focus).map((d) => d.id)]), [focus]);
  const up = useMemo(() => new Set(ancestors(focus)), [focus]);
  const back = useCallback(() => { const p = BY[focus]?.p; if (p) setFocus(p); }, [focus]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") back(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [back]);

  const leaf = BY[focus]?.chair ? BY[focus]! : null;
  const trail = [...ancestors(focus)].reverse().concat(focus).map((id) => BY[id]!);
  const open = (chair: PieceId) => navigate({ to: "/workshop", search: { chair } });

  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden">
      <div className="absolute left-6 top-4 z-10 flex items-center gap-2 text-xs text-muted-foreground">
        {focus !== "root" && (
          <button onClick={back} className="mr-1 flex items-center gap-1 text-walnut hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
        )}
        {focus !== "root" && trail.map((n, i) => (
          <span key={n.id} className="flex items-center gap-2">
            {i > 0 && <span className="opacity-50">/</span>}
            {i < trail.length - 1 ? <button onClick={() => setFocus(n.id)} className="hover:text-foreground">{n.label.replace(" · soon", "")}</button> : <span className="text-foreground">{n.label}</span>}
          </span>
        ))}
      </div>

      <svg viewBox={vb.join(" ")} preserveAspectRatio="xMidYMid meet" className="h-full w-full" onClick={back} role="img" aria-label="Choose what to build">
        <style>{`.cn{transition:opacity .45s,filter .45s}.cn.dim{opacity:.2;filter:blur(2.2px)}.cn.anc{opacity:.5}
          @media (prefers-reduced-motion:no-preference){.sway{animation:sw 5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 0}@keyframes sw{0%,100%{transform:rotate(-.6deg)}50%{transform:rotate(.6deg)}}}`}</style>
        <line x1={300} y1={30} x2={700} y2={30} stroke={C.line} strokeWidth={1} />
        <path d={`M500 30 L500 ${BY["root"]!.y - BY["root"]!.r}`} stroke={C.line} strokeWidth={1} fill="none" />
        {NODES.filter((n) => n.p).map((n) => {
          const p = BY[n.p!]!;
          const lit = keep.has(n.id) || up.has(n.id);
          if (leaf?.id === n.id) return null;
          // Strings leave from just under the parent's label so they never cross text.
          const sy = p.y + p.r + p.fs * 1.5;
          return (
            <g key={`s-${n.id}`}>
              <path className={`cn ${lit ? "" : "dim"}`} fill="none" stroke={C.line} strokeWidth={n.chair ? 0.35 : n.p === "root" ? 0.9 : 0.55}
                d={`M${p.x} ${sy} Q${p.x} ${sy + (n.y - sy) * 0.35} ${(p.x + n.x) / 2} ${(sy + n.y) / 2} T${n.x} ${n.y - n.r}`} />
            </g>
          );
        })}
        {NODES.map((n) => {
          const cls = `cn ${keep.has(n.id) ? "" : up.has(n.id) ? "anc" : "dim"}`;
          const hidden = leaf?.id === n.id; // the open chair is shown as the card instead
          const ty = n.chair ? n.r + 30 : n.r + n.fs * 1.15;
          return (
            <g key={n.id} className={cls} transform={`translate(${n.x} ${n.y})`} style={{ cursor: n.off ? "default" : "pointer", opacity: hidden ? 0 : undefined }}
              onClick={(e) => { e.stopPropagation(); if (!n.off) setFocus(n.id); }}>
              <g className={n.chair ? "" : "sway"}>
                <circle r={n.r} fill={n.off ? C.line : n.chair ? C.teal : C.wal} />
                <circle r={n.r * 0.35} cx={-n.r * 0.3} cy={-n.r * 0.3} fill="#fff" opacity={0.35} />
              </g>
              {n.icon && <path d={n.icon} transform={`translate(0 ${n.r + 14}) scale(0.9)`} stroke={C.ink} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              <text y={ty} textAnchor="middle" fontSize={n.fs} fill={n.off ? C.mute : C.ink} fontFamily={n.serif ? "Fraunces, Georgia, serif" : "Manrope, system-ui, sans-serif"}>{n.label}</text>
            </g>
          );
        })}
      </svg>

      {focus === "root" && (
        <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm text-muted-foreground">Learn to build furniture, one piece at a time. Click a bead to look closer.</p>
      )}

      {leaf && <ChairCard key={leaf.id} n={leaf} onOpen={() => open(leaf.chair!)} />}
    </div>
  );
}

function ChairCard({ n, onOpen }: { n: Node; onOpen: () => void }) {
  const [s, setS] = useState<ReturnType<typeof chairSummary> | null>(null);
  useEffect(() => setS(chairSummary(n.chair!)), [n.chair]);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="pointer-events-auto w-[340px] animate-rise rounded-2xl bg-card/95 p-4 shadow-sm backdrop-blur" onClick={(e) => e.stopPropagation()}>
        <div className="h-56 overflow-hidden rounded-xl">
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <ChairPreview chair={n.chair!} />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="mt-3 font-serif text-2xl">{n.label}</div>
        {n.fromFile && <div className="mt-1 inline-block rounded-full border border-teal/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal">Made from a data file</div>}
        <p className="mt-1 text-sm text-muted-foreground">{n.desc}</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-teal transition-all duration-700" style={{ width: `${s?.pct ?? 0}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{s ? `${s.pct}% done` : "…"}</span>
          <span>{s ? formatTime(s.seconds) : ""}</span>
        </div>
        {s?.next && <p className="mt-1 text-xs text-muted-foreground">Next: {s.next.label.toLowerCase()}</p>}
        <button onClick={onOpen} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:opacity-90">
          Open this chair <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
