import "./r3fDevSourceShim";
import { StressOverlay } from "./StressOverlay";
import type { StressReport } from "@/lib/chair/stress";
import { Html, Line } from "@react-three/drei";
import { StudioShell, type StudioShellProps } from "./StudioCanvas";
import { JapaneseChairModel, type JapaneseChairModelProps } from "./JapaneseChairModel";
import { C3 } from "./ChairModel";
import { computeJapanese } from "@/lib/chair/japanese/geometry";
import type { JapaneseParams } from "@/lib/chair/japanese/params";

function JDimensions({ params }: { params: JapaneseParams }) {
  const g = computeJapanese(params);
  const s = 0.01;
  const x = (g.legFootX + 9) * s;
  const label = (t: string) => <div className="dim-label">{t}</div>;
  const fz = g.frontFoot.z * s + 0.04;
  return (
    <group>
      <Line points={[[x, 0, fz], [x, g.seatTop * s, fz]]} color={C3.blue} lineWidth={1.2} />
      <Html position={[x + 0.02, (g.seatTop * s) / 2, fz]} center>{label(`H ${params.seatHeight.toFixed(1)} cm`)}</Html>

      <Line points={[[-g.legTopX * s, 0.02, fz + 0.06], [g.legTopX * s, 0.02, fz + 0.06]]} color={C3.blue} lineWidth={1.2} />
      <Html position={[0, 0.02, fz + 0.08]} center>{label(`W ${params.seatWidth.toFixed(1)} cm`)}</Html>

      <Line points={[[x, g.seatTop * s, g.postBase.z * s], [x, g.postTop.y * s, g.postTop.z * s]]} color={C3.blue} lineWidth={1.2} dashed dashSize={0.02} gapSize={0.01} />
      <Html position={[x, (g.seatTop + params.backHeight / 2) * s, g.postTop.z * s]} center>{label(`Back ${params.backHeight.toFixed(1)} cm`)}</Html>

      <Line points={[[x, 0.005, g.rearFoot.z * s], [x, 0.005, g.frontFoot.z * s]]} color={C3.blue} lineWidth={1} dashed dashSize={0.015} gapSize={0.01} />
      <Html position={[x, 0.005, ((g.rearFoot.z + g.frontFoot.z) / 2) * s]} center>{label(`Footprint ${g.footprintDepth.toFixed(1)} cm`)}</Html>
    </group>
  );
}

export interface JapaneseCanvasProps extends JapaneseChairModelProps {
  ghostParams?: JapaneseParams | null;
  dims?: boolean;
  stress?: StressReport | null;
  camera?: StudioShellProps["camera"];
  onMiss?: () => void;
}

export function JapaneseCanvas({ ghostParams, dims, stress, camera, onMiss, ...model }: JapaneseCanvasProps) {
  return (
    <StudioShell camera={camera} onMiss={onMiss}>
      <JapaneseChairModel {...model} />
      {ghostParams && <JapaneseChairModel params={ghostParams} ghost />}
      {dims && <JDimensions params={model.params} />}
      {stress && !model.exploded && <StressOverlay report={stress} />}
    </StudioShell>
  );
}
