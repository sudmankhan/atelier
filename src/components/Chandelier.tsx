import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { animate, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
import { loadSaved } from "@/lib/furniture/saved";
import type { FurnitureSpec } from "@/lib/furniture/spec";
import type { PieceId } from "@/lib/storage/chairProgress";

const ChairPreview = lazy(() => import("@/components/three/ChairPreview"));

class ModelPreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? (
      <p className="node-preview-fallback">
        Model preview is unavailable on this device. You can still open the workshop.
      </p>
    ) : (
      this.props.children
    );
  }
}

type Study = {
  id: string;
  style: string;
  title: string;
  detail: string;
  chair?: PieceId;
  icon?: string;
  saved?: boolean;
};
const CATEGORIES: { name: string; description: string; studies: Study[] }[] = [
  {
    name: "Chairs",
    description: "Frame, seat, back. Discover the connections that make a chair work.",
    studies: [
      {
        id: "kangaroo",
        style: "Modernist",
        title: "Kangaroo lounge chair",
        detail: "Chandigarh modernism. A leaning teak frame with a caned seat and back.",
        chair: "kangaroo",
        icon: "M-9,7 L-5,-1 L6,-1 M-5,-1 L-2,7 M6,-1 L10,-11 M3,-1 L7,7",
      },
      {
        id: "japanese",
        style: "Japanese",
        title: "Kuro spindle-back",
        detail: "Japanese mingei spirit. Splayed legs, slender spindles and a curved crest rail.",
        chair: "japanese",
        icon: "M-8,-1 L8,-1 M-6,-1 L-9,7 M6,-1 L9,7 M-5,-1 L-5,-10 M0,-1 L0,-10 M5,-1 L5,-10 M-7,-10 Q0,-13 7,-10",
      },
      {
        id: "nordic",
        style: "Nordic",
        title: "Wishbone dining chair",
        detail: "A curved back, a woven seat and a study in lightness. A future furniture study.",
      },
      {
        id: "lab",
        style: "Your own",
        title: "Component lab",
        detail: "Choose a base, a back, joints and wood. Combine the parts, then test your idea.",
        chair: "lab",
        icon: "M-7,-1 L7,-1 M-6,-1 L-6,7 M6,-1 L6,7 M-6,-1 L-6,-10",
      },
    ],
  },
  {
    name: "Tables",
    description: "Surfaces to gather around. Explore a future collection of table studies.",
    studies: [
      {
        id: "trestle",
        style: "Dining",
        title: "Trestle dining table",
        detail: "An oak top on two braced trestles. A future study in span, support and joinery.",
      },
      {
        id: "low",
        style: "Coffee",
        title: "Low slab table",
        detail: "A quiet ash surface with through-tenon legs. A future study in proportion.",
      },
      {
        id: "console",
        style: "Console",
        title: "Frame console",
        detail:
          "A slender walnut frame with a floating shelf. A future study in slender structures.",
      },
    ],
  },
  {
    name: "Beds",
    description: "Rest, supported. A look at the bed frames on our drawing board.",
    studies: [
      {
        id: "platform",
        style: "Platform",
        title: "Low platform bed",
        detail: "A low timber frame with slatted support. A future study in repeatable joinery.",
      },
      {
        id: "poster",
        style: "Four-poster",
        title: "Oak canopy bed",
        detail: "Upright posts and a connected frame. A future study in rails and racking.",
      },
    ],
  },
  {
    name: "Doors",
    description: "Frames, panels and movement. Future studies for the thresholds we make.",
    studies: [
      {
        id: "panel",
        style: "Frame & panel",
        title: "Panelled oak door",
        detail: "Solid timber surrounding a floating panel. A future study in wood movement.",
      },
      {
        id: "sliding",
        style: "Sliding",
        title: "Lattice sliding door",
        detail: "A light timber lattice within a sliding frame. A future study in precision.",
      },
    ],
  },
];
const TURN = Math.PI / 2;
const VIEW = { w: 1000, h: 610 };
const OVERVIEW = [60, 50, 880, 560];
type Point = { x: number; y: number; z: number };
type Kind = "root" | "category" | "style" | "leaf";
type TreeNode = {
  branch?: number;
  slot?: string;
  id: string;
  kind: Kind;
  label: string;
  point: Point;
  parent?: string;
  category?: number;
  study?: Study;
};

function projectPoint(p: Point, rotation: number): Point {
  const x = p.x * Math.cos(rotation) + p.z * Math.sin(rotation);
  const z = -p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
  return { x: 500 + (x * 1100) / (1100 - z * 0.28), y: 380 - p.y * 0.88 + z * 0.12, z };
}

/** A small angular timber volume: its bends, faces and grain turn with the canopy. */
function trunkMesh(rotation: number) {
  const levels = [
    { x: -9, y: -190, z: 6, r: 45 },
    { x: -15, y: -165, z: 2, r: 42 },
    { x: -4, y: -132, z: -5, r: 37 },
    { x: -8, y: -99, z: -2, r: 33 },
    { x: 1, y: -66, z: 7, r: 30 },
    { x: -3, y: -31, z: 3, r: 26 },
    { x: 0, y: 0, z: 0, r: 22 },
  ];
  const sides = 10;
  const rings = levels.map((p) =>
    Array.from({ length: sides }, (_, i) => {
      const angle = (i * Math.PI * 2) / sides;
      return projectPoint(
        { x: p.x + Math.cos(angle) * p.r, y: p.y, z: p.z + Math.sin(angle) * p.r * 0.72 },
        rotation,
      );
    }),
  );
  const colors = [
    "#76543d",
    "#705039",
    "#79563e",
    "#6b4b35",
    "#806047",
    "#76543d",
    "#6e4e38",
    "#7b5940",
    "#72503a",
    "#826047",
  ];
  const faces = rings
    .slice(1)
    .flatMap((ring, level) =>
      ring.map((point, i) => {
        const next = (i + 1) % sides;
        const vertices = [rings[level]![i]!, rings[level]![next]!, ring[next]!, point];
        return {
          id: `${level}-${i}`,
          depth: vertices.reduce((sum, p) => sum + p.z, 0) / 4,
          d: `M${vertices.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" L")}Z`,
          fill: colors[i]!,
        };
      }),
    )
    .sort((a, b) => a.depth - b.depth);
  const grain = Array.from({ length: sides }, (_, i) => ({
    front: Math.sin((i * Math.PI * 2) / sides - rotation) > 0.2,
    d: `M${rings.map((ring) => `${ring[i]!.x.toFixed(3)},${ring[i]!.y.toFixed(3)}`).join(" L")}`,
  })).filter((line) => line.front);
  return { faces, grain };
}

const smooth = (from: number, to: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** Angular growth, swollen joints and broken bark edges, with stable variation per limb. */
function branchGeometry(
  a: Point,
  b: Point,
  width: number,
  tip: number,
  seed: number,
  progress = 1,
  incoming?: Point,
) {
  if (progress <= 0) return { silhouette: "", grain: "", facet: "" };
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length,
    ny = dx / length;
  const random = (i: number) => {
    const value = Math.sin(seed * 17.13 + i * 91.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const direction = random(0) > 0.5 ? 1 : -1;
  const elbow = Math.min(18, length * 0.08) * direction;
  const stations = [0, 0.12, 0.25, 0.34, 0.43, 0.58, 0.72, 0.84, 0.93, 1];
  const growth = [0, 0.25, 0.85, 1, 0.8, 0.58, 0.65, 0.3, 0.2, 0];
  const incomingLength = incoming ? Math.max(1, Math.hypot(incoming.x, incoming.y)) : 1;
  const steerX = incoming ? (incoming.x / incomingLength) * length - dx : 0;
  const steerY = incoming ? (incoming.y / incomingLength) * length - dy : 0;
  const fullSpine = stations.map((t, i) => {
    const offset =
      growth[i]! * elbow +
      (i === 0 || i === stations.length - 1
        ? 0
        : (random(i + 4) - 0.5) * Math.min(5, length * 0.025));
    // A branch thickens at an elbow, then tapers toward new growth.
    const taper = tip + (width - tip) * Math.pow(1 - t, 1.4);
    const knot = i === 3 || i === 6 ? width * 0.12 : 0;
    return {
      t,
      x: a.x + dx * t + nx * offset + steerX * t * (1 - t) ** 2,
      y: a.y + dy * t + ny * offset + steerY * t * (1 - t) ** 2,
      radius: (taper + knot) / 2,
    };
  });
  const spine = fullSpine.filter((p) => p.t <= progress);
  if (progress < 1) {
    const next = fullSpine[spine.length]!;
    const last = spine[spine.length - 1]!;
    const mix = (progress - last.t) / (next.t - last.t);
    spine.push({
      t: progress,
      x: last.x + (next.x - last.x) * mix,
      y: last.y + (next.y - last.y) * mix,
      radius: tip / 2,
    });
    for (let i = 0; i < spine.length - 1; i++) {
      spine[i] = {
        ...spine[i]!,
        radius: Math.max(tip / 2, spine[i]!.radius * smooth(0, 0.25, progress - spine[i]!.t)),
      };
    }
  }
  const side = (sign: number) =>
    spine.map((p, i) => {
      const rough =
        i === 0 || i === spine.length - 1
          ? 0
          : (random(i + (sign > 0 ? 30 : 60)) - 0.35) * Math.min(1.8, width * 0.16);
      return `${(p.x + nx * (p.radius + rough) * sign).toFixed(3)},${(p.y + ny * (p.radius + rough) * sign).toFixed(3)}`;
    });
  const left = side(1),
    right = side(-1).reverse();
  const grain = spine.map(
    (p) => `${(p.x + nx * p.radius * 0.38).toFixed(3)},${(p.y + ny * p.radius * 0.38).toFixed(3)}`,
  );
  return {
    silhouette: `M${left.join(" L")} L${right.join(" L")} Z`,
    grain: [grain.slice(1, 4), grain.slice(5, 8)]
      .filter((line) => line.length > 1)
      .map((line) => `M${line.join(" L")}`)
      .join(" "),
    facet:
      spine.length > 2
        ? `M${left.slice(1, 7).join(" L")} L${grain.slice(1, 7).reverse().join(" L")} Z`
        : "",
  };
}

function NodeMark({
  node,
  available,
}: {
  node: { kind: Kind; label: string; study?: Study };
  available: boolean;
}) {
  if (node.kind === "root")
    return (
      <>
        <rect className="node-hit" x="-16" y="-16" width="32" height="32" fill="transparent" />
        <circle className="node-focus-halo" r="10" fill="none" />
        <circle className="node-bud" r="5" />
      </>
    );
  const leaf = node.kind === "leaf";
  const labelWidth = Math.max(
    44,
    node.label.length * (leaf ? 4.2 : node.kind === "style" ? 5.2 : 6.6),
  );
  return (
    <>
      <rect
        className="node-hit"
        x={-labelWidth - 10}
        y={leaf ? -34 : -16}
        width={(labelWidth + 10) * 2}
        height={leaf ? 82 : 60}
        fill="transparent"
      />
      <circle className="node-focus-halo" r={8} fill="none" />
      <circle className="node-bud" r={node.kind === "category" ? 3.8 : leaf ? 2.2 : 2.8} />
      {leaf && node.study?.icon && (
        <path
          className="node-icon"
          d={node.study.icon}
          transform="translate(0 -23) scale(0.65)"
          fill="none"
          stroke="var(--branch-bark)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text
        key={node.label}
        className="node-full-label"
        y={leaf ? 19 : 23}
        textAnchor="middle"
        fill="var(--branch-bark)"
        fontSize={node.kind === "category" ? 18 : node.kind === "style" ? 13 : 10}
      >
        {node.label}
      </text>
      {leaf && (
        <text
          key={node.label}
          className="node-mobile-label"
          y="19"
          textAnchor="middle"
          fill="var(--branch-bark)"
        >
          {node.label}
        </text>
      )}
      {leaf && !available && (
        <text
          className="node-preview-label"
          y="33"
          textAnchor="middle"
          fill="var(--branch-bark)"
          fontSize="6.5"
          letterSpacing="1.2"
        >
          ON THE DRAWING BOARD
        </text>
      )}
      <path className="node-label-accent" d={`M-12 ${leaf ? 26 : 30}h24`} fill="none" />
    </>
  );
}

/** Every edge ends at a labelled tip or a real junction. Rotation moves the entire graph. */
export function Chandelier({
  interactive = true,
  entering = false,
  onOpen,
}: {
  interactive?: boolean;
  entering?: boolean;
  onOpen: (chair: PieceId) => void;
}) {
  const [savedDesigns, setSavedDesigns] = useState<FurnitureSpec[]>([]);
  useEffect(() => {
    const refresh = () => setSavedDesigns(loadSaved());
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === "atelier.designs") refresh();
    };
    refresh();
    window.addEventListener("atelier-designs", refresh);
    window.addEventListener("storage", storage);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("atelier-designs", refresh);
      window.removeEventListener("storage", storage);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  const collections = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        studies: [
          ...category.studies,
          ...savedDesigns
            .filter((design) => design.category === category.name)
            .slice()
            .reverse()
            .map((design): Study => ({
              id: `saved-${design.id}`,
              style: "Your own",
              title: design.name,
              detail: design.description,
              chair: `spec:${design.id}`,
              saved: true,
              icon: "M-7,-1 L7,-1 M-6,-1 L-6,7 M6,-1 L6,7 M-6,-1 L-6,-10 M6,-1 L6,-10 M-6,-9 L6,-9",
            })),
        ],
      })),
    [savedDesigns],
  );
  const reduce = useReducedMotion();
  const [ownPages, setOwnPages] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [rotation, setRotation] = useState(0);
  const trunk = useMemo(() => trunkMesh(rotation), [rotation]);
  const [studyId, setStudyId] = useState<string | null>(null);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [growth, setGrowth] = useState<{ parent: string | null; progress: number }>({
    parent: null,
    progress: 1,
  });
  const [pendingPopup, setPendingPopup] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState([...OVERVIEW]);
  const camera = useRef([...OVERVIEW]);
  const resetZoom = () => {
    setFocusedNode(null);
    setPendingPopup(null);
  };
  const popupReturn = useRef<SVGElement | null>(null);
  const popupStudy = collections.flatMap((c) => c.studies).find((s) => s.id === popupId);
  const rotationRef = useRef(0);
  const drag = useRef<{
    x: number;
    y: number;
    id: number;
    rotation: number;
    lastX: number;
    lastTime: number;
    velocity: number;
  } | null>(null);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const velocity = useRef(0);
  const [settle, setSettle] = useState(0);
  const swiped = useRef(false);
  const selected = ((step % 4) + 4) % 4;
  const category = collections[selected]!;
  const turn = (direction: number) => {
    if (!interactive) return;
    resetZoom();
    setStep((n) => n + direction);
    setStudyId(null);
  };
  const selectCategory = (index: number) => {
    let delta = index - selected;
    if (delta > 2) delta -= 4;
    if (delta < -2) delta += 4;
    turn(delta);
  };
  useEffect(() => {
    let previous = rotationRef.current,
      time = performance.now();
    const control = animate(rotationRef.current, -step * TURN, {
      ...(reduce
        ? { type: "tween", duration: 0 }
        : { type: "spring", stiffness: 95, damping: 24, mass: 0.9, velocity: velocity.current }),
      onUpdate: (value) => {
        const now = performance.now();
        if (now > time) velocity.current = (value - previous) / ((now - time) / 1000);
        previous = value;
        time = now;
        rotationRef.current = value;
        setRotation(value);
      },
    });
    animation.current = control;
    return () => control.stop();
  }, [step, reduce, settle]);

  const finishDrag = (cancelled = false) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    if (!swiped.current) {
      setSettle((n) => n + 1);
      return;
    }
    resetZoom();
    const projected = rotationRef.current + (cancelled ? 0 : start.velocity * 0.14);
    const nextStep = Math.round(-projected / TURN);
    velocity.current = cancelled ? 0 : start.velocity;
    setStep(nextStep);
    setStudyId(null);
    setSettle((n) => n + 1);
  };

  const graph = useMemo(() => {
    const nodes: TreeNode[] = [
      { id: "root", kind: "root", label: "Atelier", point: { x: 0, y: 0, z: 0 } },
    ];
    collections.forEach((c, i) => {
      const angle = i * TURN;
      const radial = { x: Math.sin(angle), z: Math.cos(angle) };
      const tangent = { x: Math.cos(angle), z: -Math.sin(angle) };
      const categoryId = `category-${i}`;
      nodes.push({
        id: categoryId,
        kind: "category",
        label: c.name,
        parent: "root",
        category: i,
        branch: i,
        point: { x: radial.x * 280, y: 275 + [0, -24, 20, -10][i]!, z: radial.z * 130 },
      });
      const junction = nodes[nodes.length - 1]!.point;
      const axisLength = Math.hypot(junction.x, junction.y, junction.z);
      const direction = {
        x: junction.x / axisLength,
        y: junction.y / axisLength,
        z: junction.z / axisLength,
      };
      const byStyle = new Map<string, Study[]>();
      for (const study of c.studies)
        byStyle.set(study.style, [...(byStyle.get(study.style) ?? []), study]);
      const groups = [...byStyle.values()];
      groups.forEach((studies, j) => {
        const first = studies[0]!;
        const styleId = first.style === "Your own" ? `style-own-${i}` : `style-${first.id}`;
        const spread = (j - (groups.length - 1) / 2) * 168;
        const reach = 190 + [-16, 22, -8, 12][j % 4]!;
        const point = {
          x: junction.x + direction.x * reach + tangent.x * spread,
          y: junction.y + direction.y * reach,
          z: junction.z + direction.z * reach + tangent.z * spread,
        };
        const extension = {
          x: point.x - junction.x,
          y: point.y - junction.y,
          z: point.z - junction.z,
        };
        const extensionLength = Math.hypot(extension.x, extension.y, extension.z);
        nodes.push({
          id: styleId,
          kind: "style",
          label: first.style,
          point,
          parent: categoryId,
          branch: i,
          study: first,
        });
        const own = first.style === "Your own";
        const saved = studies.filter((study) => study.saved);
        const page = Math.min(ownPages[c.name] ?? 0, Math.max(0, Math.ceil(saved.length / 3) - 1));
        const displayed = own
          ? [
              ...studies.filter((study) => !study.saved).slice(0, 1),
              ...saved.slice(page * 3, page * 3 + 3),
            ]
          : studies;
        const slots = own && saved.length ? 4 : displayed.length;
        displayed.forEach((study, k) => {
          const fan = (k - (slots - 1) / 2) * 160;
          nodes.push({
            id: study.id,
            slot: own ? `${styleId}-slot-${k}` : study.id,
            kind: "leaf",
            label: study.title,
            parent: styleId,
            branch: i,
            study,
            point: {
              x: point.x + (extension.x / extensionLength) * 155 + tangent.x * fan,
              y:
                point.y +
                (extension.y / extensionLength) * 155 +
                (slots > 1 ? ((k % 3) - 1) * 12 : 0),
              z: point.z + (extension.z / extensionLength) * 155 + tangent.z * fan,
            },
          });
        });
      });
    });
    const projected = nodes.map((n) => ({ ...n, screen: projectPoint(n.point, rotation) }));
    const categories = projected.filter((n) => n.kind === "category");
    return projected.map((n) => {
      if (n.kind === "root") return { ...n, opacity: 1 };
      const angle = n.branch! * TURN + rotation;
      const front = Math.cos(angle);
      const junction = categories.find((c) => c.category === n.branch)!;
      let occlusion = 0;
      for (const other of categories) {
        if (other.id === junction.id) continue;
        const gap = Math.abs(junction.screen.x - other.screen.x);
        occlusion = Math.max(
          occlusion,
          (1 - smooth(35, 180, gap)) * smooth(25, 170, other.screen.z - junction.screen.z),
        );
      }
      const depth = 0.5 + 0.5 * smooth(-1, 1, front);
      return { ...n, opacity: depth * (1 - occlusion) };
    });
  }, [rotation, collections, ownPages]);
  const byId = new Map(graph.map((n) => [n.id, n]));
  useEffect(() => {
    if (!focusedNode || graph.some((node) => node.id === focusedNode)) return;
    const own = graph.find(
      (node) => node.kind === "style" && node.branch === selected && node.label === "Your own",
    );
    setFocusedNode(own?.id ?? `category-${selected}`);
    setStudyId(null);
    setPopupId(null);
    setPendingPopup(null);
  }, [graph, focusedNode, selected]);
  const lineage = (id: string) => {
    const chain = [id];
    let node = byId.get(id);
    while (node?.parent) {
      chain.push(node.parent);
      node = byId.get(node.parent);
    }
    return chain;
  };
  const revealed = (n: (typeof graph)[number]) => {
    if (n.kind === "root" || n.kind === "category") return true;
    if (!focusedNode) return false;
    const focus = lineage(focusedNode);
    return n.id === focusedNode || n.parent === focusedNode || focus.includes(n.id);
  };
  const inCanopy = (n: (typeof graph)[number]) => {
    if (!focusedNode) return true;
    const focus = lineage(focusedNode);
    return n.id === focusedNode || n.parent === focusedNode || focus.includes(n.id);
  };

  const branchGrowth = (n: (typeof graph)[number]) => {
    if (reduce || !focusedNode || n.parent !== focusedNode) return 1;
    const progress = growth.parent === focusedNode ? growth.progress : 0;
    const siblings = graph.filter((sibling) => sibling.parent === focusedNode);
    const index = siblings.findIndex((sibling) => sibling.id === n.id);
    const delay = Math.max(0, index) * 0.065;
    return smooth(delay, 0.78 + delay, progress);
  };

  useEffect(() => {
    if (!focusedNode) return;
    const parent = focusedNode;
    const control = animate(0, 1, {
      duration: reduce ? 0 : 0.95,
      ease: "linear",
      onUpdate: (progress) => setGrowth({ parent, progress }),
    });
    return () => control.stop();
  }, [focusedNode, reduce]);

  const focused = byId.get(focusedNode ?? "");
  const canopy = focused
    ? graph.filter((n) => revealed(n) && (n.id === focused.id || n.parent === focused.id))
    : [];
  const bounds = canopy.map((n) => n.screen);
  const x0 = bounds.length ? Math.min(...bounds.map((p) => p.x)) - 48 : 0;
  const y0 = bounds.length ? Math.min(...bounds.map((p) => p.y)) - 56 : 0;
  const x1 = bounds.length ? Math.max(...bounds.map((p) => p.x)) + 48 : VIEW.w;
  const y1 = bounds.length ? Math.max(...bounds.map((p) => p.y)) + 48 : VIEW.h;
  const width = focused ? Math.max(300, x1 - x0) : OVERVIEW[2]!;
  const height = focused ? Math.max(220, y1 - y0) : OVERVIEW[3]!;
  const cx = focused ? x0 - (width - (x1 - x0)) / 2 : OVERVIEW[0]!;
  const cy = focused ? y0 - (height - (y1 - y0)) / 2 : OVERVIEW[1]!;
  const goToNode = (id: string) => {
    setPendingPopup(null);
    const node = byId.get(id);
    if (!node || node.kind === "root") {
      setStudyId(null);
      resetZoom();
      return;
    }
    if (node.branch !== selected) selectCategory(node.branch!);
    setFocusedNode(id);
    setStudyId(node.kind === "leaf" ? id : null);
  };
  const stepBack = () => goToNode(focused?.parent ?? "root");
  const trail = focusedNode
    ? lineage(focusedNode)
        .reverse()
        .flatMap((id) => {
          const node = byId.get(id);
          return node ? [node] : [];
        })
    : [];

  useEffect(() => {
    const from = [...camera.current];
    const target = [cx, cy, width, height];
    const control = animate(0, 1, {
      duration: reduce ? 0 : 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (progress) => {
        const value = from.map((v, i) => v + (target[i]! - v) * progress);
        camera.current = value;
        setViewBox(value);
      },
    });
    return () => control.stop();
  }, [cx, cy, width, height, reduce]);

  useEffect(() => {
    if (!pendingPopup) return;
    const timer = window.setTimeout(
      () => {
        setPopupId(pendingPopup);
        setPendingPopup(null);
      },
      reduce ? 0 : 550,
    );
    return () => window.clearTimeout(timer);
  }, [pendingPopup, reduce]);

  const ownStyle =
    focused?.kind === "style" && focused.label === "Your own"
      ? focused
      : focused?.kind === "leaf"
        ? byId.get(focused.parent!)
        : undefined;
  const ownDesigns = category.studies.filter((study) => study.saved);
  const ownPageCount = Math.ceil(ownDesigns.length / 3);
  const ownPage = Math.min(ownPages[category.name] ?? 0, Math.max(0, ownPageCount - 1));
  const pageDesigns = (direction: number) => {
    if (!ownStyle || ownPageCount < 2) return;
    goToNode(ownStyle.id);
    setOwnPages((pages) => ({
      ...pages,
      [category.name]: (ownPage + direction + ownPageCount) % ownPageCount,
    }));
  };

  return (
    <section
      className={`branch-experience node-collection ${entering ? "is-entering" : ""}`}
      aria-label="Furniture collection tree"
      inert={!interactive}
    >
      <div
        className="branch-canvas"
        role="region"
        aria-label="Rotating branch tree. Swipe left or right, or use the arrow keys to explore."
        tabIndex={interactive ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === "Escape" && focusedNode) {
            e.preventDefault();
            stepBack();
            return;
          }
          if (e.target === e.currentTarget && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            turn(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 || !interactive) return;
          animation.current?.stop();
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            id: e.pointerId,
            rotation: rotationRef.current,
            lastX: e.clientX,
            lastTime: performance.now(),
            velocity: 0,
          };
          swiped.current = false;
        }}
        onPointerMove={(e) => {
          const start = drag.current;
          if (!start || start.id !== e.pointerId) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (!swiped.current && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.2) {
            drag.current = null;
            return;
          }
          if (!swiped.current && (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy))) return;
          swiped.current = true;
          if (!e.currentTarget.hasPointerCapture?.(e.pointerId))
            e.currentTarget.setPointerCapture?.(e.pointerId);
          const now = performance.now();
          const sensitivity = TURN / Math.max(150, e.currentTarget.clientWidth * 0.3);
          start.velocity = Math.max(
            -6,
            Math.min(
              6,
              ((e.clientX - start.lastX) * sensitivity) /
                Math.max(0.016, (now - start.lastTime) / 1000),
            ),
          );
          start.lastX = e.clientX;
          start.lastTime = now;
          const value = start.rotation + dx * sensitivity;
          rotationRef.current = value;
          setRotation(value);
        }}
        onPointerUp={(e) => {
          finishDrag();
          if (e.currentTarget.hasPointerCapture?.(e.pointerId))
            e.currentTarget.releasePointerCapture?.(e.pointerId);
        }}
        onPointerCancel={() => finishDrag(true)}
        onLostPointerCapture={() => finishDrag(true)}
      >
        <svg
          viewBox={viewBox.map((n) => n.toFixed(3)).join(" ")}
          className="branch-tree"
          role="group"
          aria-label="Atelier trunk rising into Chairs, Tables, Beds and Doors"
        >
          <g fill="var(--branch-bark)">
            {(() => {
              return (
                <g className="tree-trunk" aria-hidden="true">
                  {trunk.faces.map((face) => (
                    <path key={face.id} d={face.d} fill={face.fill} />
                  ))}
                  {trunk.grain.map((line, i) => (
                    <path
                      key={i}
                      d={line.d}
                      fill="none"
                      stroke="#b5906b"
                      strokeWidth=".7"
                      opacity=".28"
                    />
                  ))}
                </g>
              );
            })()}
            {[...graph]
              .filter((n) => n.parent && revealed(n) && revealed(byId.get(n.parent)!))
              .sort((a, b) => a.screen.z - b.screen.z)
              .map((n) => {
                const parent = byId.get(n.parent!)!;
                const seed = [...n.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
                const width = n.kind === "category" ? 36 : n.kind === "style" ? 14 : 5.6;
                const tip = n.kind === "category" ? 15.5 : n.kind === "style" ? 5.8 : 2;
                const grandparent = byId.get(parent.parent ?? "");
                const incoming = grandparent
                  ? {
                      x: parent.screen.x - grandparent.screen.x,
                      y: parent.screen.y - grandparent.screen.y,
                      z: 0,
                    }
                  : { x: 0, y: -1, z: 0 };
                const wood = branchGeometry(
                  parent.screen,
                  n.screen,
                  width,
                  tip,
                  seed,
                  branchGrowth(n),
                  incoming,
                );
                return (
                  <g
                    key={n.slot ?? n.id}
                    opacity={Math.min(1, n.opacity * 1.2) * (inCanopy(n) ? 1 : 0.42)}
                  >
                    <path d={wood.silhouette} />
                    <path d={wood.facet} fill="#30251f" opacity="0.16" />
                    <path
                      d={wood.grain}
                      fill="none"
                      stroke="var(--branch-paper)"
                      strokeWidth="0.6"
                      opacity="0.32"
                      strokeLinecap="butt"
                    />
                  </g>
                );
              })}
          </g>
          {[...graph]
            .filter((n) => n.kind !== "root")
            .sort((a, b) => a.screen.z - b.screen.z)
            .map((n) => {
              const open = revealed(n);
              const canopy = inCanopy(n);
              const active = n.category === selected || n.study?.id === studyId;
              const available = !!n.study?.chair;
              const arrival = smooth(0.72, 1, branchGrowth(n));
              const visible = open && n.opacity > 0.08 && arrival > 0.05;
              const activate = () => {
                if (!interactive || !visible || swiped.current) return;
                goToNode(n.id);
                if (n.kind === "leaf" && n.study) {
                  if (reduce) setPopupId(n.study.id);
                  else setPendingPopup(n.study.id);
                }
              };
              return (
                <g
                  key={n.slot ?? n.id}
                  className={`branch-node node-${n.kind} ${n.study?.saved ? "node-saved" : ""} ${active ? "is-selected" : ""} ${canopy ? "" : "is-dim"}`}
                  transform={`translate(${n.screen.x} ${n.screen.y})`}
                  role="button"
                  tabIndex={interactive && visible ? 0 : -1}
                  aria-hidden={!visible}
                  opacity={visible ? n.opacity * (canopy ? 1 : 0.28) * arrival : 0}
                  style={{ pointerEvents: visible ? "auto" : "none" }}
                  aria-label={
                    n.kind === "root"
                      ? "Atelier collection"
                      : n.kind === "leaf"
                        ? `${n.label}${available ? "" : ", preview only"}`
                        : n.label
                  }
                  aria-pressed={active}
                  onClick={(e) => {
                    popupReturn.current = e.currentTarget;
                    activate();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      swiped.current = false;
                      popupReturn.current = e.currentTarget;
                      activate();
                    }
                  }}
                >
                  <NodeMark node={n} available={available} />
                </g>
              );
            })}
        </svg>
      </div>
      {focusedNode && (
        <div className="node-zoom-navigation">
          <button className="node-zoom-back" onClick={stepBack}>
            <ArrowLeft size={13} />
            {focused?.parent && focused.parent !== "root" ? "Back" : "Back to the collection"}
          </button>
          <nav className="node-breadcrumbs" aria-label="Tree path">
            {trail.map((node, index) => (
              <span key={node.id}>
                {index > 0 && (
                  <span className="node-path-separator" aria-hidden="true">
                    /
                  </span>
                )}
                {node.id === focusedNode ? (
                  <span aria-current="location">{node.label}</span>
                ) : (
                  <button
                    onClick={() => goToNode(node.id)}
                    aria-label={
                      node.kind === "root" ? "Return to collection" : `Return to ${node.label}`
                    }
                  >
                    {node.kind === "root" ? "Collection" : node.label}
                  </button>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}
      {ownStyle?.label === "Your own" && ownPageCount > 1 && (
        <nav className="own-design-pagination" aria-label="Browse your saved designs">
          <button type="button" onClick={() => pageDesigns(-1)} aria-label="Previous saved designs">
            <ChevronLeft size={15} />
          </button>
          <span>Your designs</span>
          <button type="button" onClick={() => pageDesigns(1)} aria-label="Next saved designs">
            <ChevronRight size={15} />
          </button>
          <span className="sr-only" aria-live="polite">
            {ownDesigns
              .slice(ownPage * 3, ownPage * 3 + 3)
              .map((study) => study.title)
              .join(", ")}
          </span>
        </nav>
      )}
      <nav className="branch-navigation" aria-label="Explore furniture branches">
        <button type="button" onClick={() => turn(-1)} aria-label="Previous branch">
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="branch-swipe">
            <MoveHorizontal size={15} /> Drag to turn the collection
          </span>
          <div className="branch-dots">
            {collections.map((c, i) => (
              <button
                key={c.name}
                onClick={() => selectCategory(i)}
                aria-label={`Show ${c.name} branch`}
                aria-current={i === selected ? "true" : undefined}
              >
                <span />
              </button>
            ))}
          </div>
          <p className="node-current-category" aria-live="polite">
            {category.name}
          </p>
        </div>
        <button type="button" onClick={() => turn(1)} aria-label="Next branch">
          <ArrowRight size={18} />
        </button>
      </nav>
      <Dialog
        open={!!popupStudy}
        onOpenChange={(open) => {
          if (!open) setPopupId(null);
        }}
      >
        <DialogContent
          className={`node-piece-popup ${reduce ? "node-popup-reduced" : ""}`}
          inert={entering}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            popupReturn.current?.focus({ preventScroll: true });
          }}
        >
          {popupStudy && (
            <>
              <p className="branch-eyebrow">
                {popupStudy.saved ? "Your saved design" : `${popupStudy.style} / Furniture study`}
              </p>
              <div className="node-piece-preview">
                {popupStudy.chair ? (
                  <ModelPreviewBoundary key={popupStudy.id}>
                    <ClientOnly
                      fallback={<p className="node-preview-fallback">Preparing the model…</p>}
                    >
                      <Suspense
                        fallback={<p className="node-preview-fallback">Preparing the model…</p>}
                      >
                        <ChairPreview chair={popupStudy.chair} autoRotate={!reduce} />
                      </Suspense>
                    </ClientOnly>
                  </ModelPreviewBoundary>
                ) : (
                  <div className="node-preview-fallback">
                    <span className="node-drawing-mark" aria-hidden="true">
                      ✳
                    </span>
                    <span>On the drawing board</span>
                  </div>
                )}
              </div>
              <DialogTitle className="node-piece-title">{popupStudy.title}</DialogTitle>
              <DialogDescription>{popupStudy.detail}</DialogDescription>
              {popupStudy.chair ? (
                <button
                  className="node-piece-open"
                  disabled={entering}
                  onClick={() => onOpen(popupStudy.chair!)}
                >
                  Set this piece on the bench <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button className="node-piece-open" disabled>
                    Coming soon · preview only
                  </button>
                  <p className="node-demo-note">Demo collection · workshop not available yet</p>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
