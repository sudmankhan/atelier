import { motion } from "framer-motion";
import { computeGeometry, sideProfilePaths } from "@/lib/chair/geometry";
import { BASELINE, type ChairParams, type Typology } from "@/lib/chair/params";
import { computeJapanese, japaneseSideProfilePaths } from "@/lib/chair/japanese/geometry";
import { J_BASELINE, type JapaneseParams } from "@/lib/chair/japanese/params";

interface Props {
  params: ChairParams | JapaneseParams;
  typology?: Typology;
  baseline?: ChairParams | JapaneseParams | null;
  width?: number;
  height?: number;
  annotate?: boolean;
  className?: string;
}

/** 2D side-elevation drawing generated from the same geometry as the 3D model. */
export function SideProfile({ params, typology = "kangaroo", baseline, width = 320, height = 220, annotate = true, className }: Props) {
  if (typology === "japanese") return <JapaneseProfile params={params as JapaneseParams} baseline={(baseline ?? J_BASELINE) as JapaneseParams} width={width} height={height} annotate={annotate} className={className} />;
  return <KangarooProfile params={params as ChairParams} baseline={baseline === undefined ? BASELINE : (baseline as ChairParams | null)} width={width} height={height} annotate={annotate} className={className} />;
}

function KangarooProfile({ params, baseline, width, height, annotate, className }: { params: ChairParams; baseline: ChairParams | null; width: number; height: number; annotate: boolean; className?: string }) {
  const scale = Math.min(width / 150, height / 115);
  const oz = width * 0.56;
  const fy = height - 18;
  const g = computeGeometry(params);
  const cur = sideProfilePaths(g, scale, oz, fy);
  const base = baseline ? sideProfilePaths(computeGeometry(baseline), scale, oz, fy) : null;
  const X = (z: number) => oz + z * scale;
  const Y = (y: number) => fy - y * scale;
  const t = { type: "spring" as const, stiffness: 120, damping: 20 };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Side elevation of the chair">
      <line x1={8} x2={width - 8} y1={fy} y2={fy} className="stroke-foreground/25" strokeWidth={1} />
      {base && (
        <g className="stroke-measure" fill="none" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.7}>
          <path d={base.frame} />
          <path d={base.rear} />
        </g>
      )}
      <g className="stroke-walnut" fill="none" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        <motion.path animate={{ d: cur.frame }} transition={t} initial={false} />
        <motion.path animate={{ d: cur.rear }} transition={t} initial={false} />
      </g>
      {annotate && (
        <g className="fill-measure font-mono" fontSize={9}>
          <line x1={X(g.frontFoot.z) + 12} x2={X(g.frontFoot.z) + 12} y1={fy} y2={Y(g.seatFront.y)} className="stroke-measure" strokeWidth={0.8} />
          <text x={X(g.frontFoot.z) + 16} y={Y(g.seatFront.y / 2)}>{params.seatHeight.toFixed(0)}</text>
          <text x={X(g.backTop.z) - 4} y={Y(g.backTop.y) - 6} textAnchor="middle">{params.backAngle.toFixed(0)}°</text>
          <text x={(X(g.rearFoot.z) + X(g.frontFoot.z)) / 2} y={fy + 12} textAnchor="middle">{g.footprintDepth.toFixed(0)} cm</text>
        </g>
      )}
    </svg>
  );
}

function JapaneseProfile({ params, baseline, width, height, annotate, className }: { params: JapaneseParams; baseline: JapaneseParams | null; width: number; height: number; annotate: boolean; className?: string }) {
  const scale = Math.min(width / 130, height / 110);
  const oz = width * 0.52;
  const fy = height - 18;
  const g = computeJapanese(params);
  const cur = japaneseSideProfilePaths(g, params, scale, oz, fy);
  const base = baseline ? japaneseSideProfilePaths(computeJapanese(baseline), baseline, scale, oz, fy) : null;
  const X = (z: number) => oz + z * scale;
  const Y = (y: number) => fy - y * scale;
  const t = { type: "spring" as const, stiffness: 120, damping: 20 };
  const paths: (keyof typeof cur)[] = ["frontLeg", "rearLeg", "seat", "post", "crest", "arm"];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Side elevation of the chair">
      <line x1={8} x2={width - 8} y1={fy} y2={fy} className="stroke-foreground/25" strokeWidth={1} />
      {base && (
        <g className="stroke-measure" fill="none" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.7}>
          {paths.map((k) => <path key={k} d={base[k]} />)}
        </g>
      )}
      <g className="stroke-walnut" fill="none" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        {paths.map((k) => <motion.path key={k} animate={{ d: cur[k] }} transition={t} initial={false} />)}
      </g>
      {annotate && (
        <g className="fill-measure font-mono" fontSize={9}>
          <line x1={X(g.frontFoot.z) + 12} x2={X(g.frontFoot.z) + 12} y1={fy} y2={Y(g.seatTop)} className="stroke-measure" strokeWidth={0.8} />
          <text x={X(g.frontFoot.z) + 16} y={Y(g.seatTop / 2)}>{params.seatHeight.toFixed(0)}</text>
          <text x={X(g.postTop.z) - 4} y={Y(g.overallHeight) + 4} textAnchor="middle">{params.backHeight.toFixed(0)} back</text>
          <text x={(X(g.rearFoot.z) + X(g.frontFoot.z)) / 2} y={fy + 12} textAnchor="middle">{g.footprintDepth.toFixed(0)} cm</text>
        </g>
      )}
    </svg>
  );
}
