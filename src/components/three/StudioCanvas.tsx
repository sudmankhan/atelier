import { StressOverlay } from "./StressOverlay";
import type { StressReport } from "@/lib/chair/stress";
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  Line,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
type OrbitControlsImpl = { target: THREE.Vector3; update: () => void };
import { ChairModel, C3, type ChairModelProps } from "./ChairModel";
import { computeGeometry, lerp2 } from "@/lib/chair/geometry";
import type { ChairParams } from "@/lib/chair/params";
import type { CameraPreset } from "@/lib/lessons";
import type { UserMeasurements } from "@/lib/chair/consequences";
import { SitterOverlay } from "./SitterOverlay";

const TARGET = new THREE.Vector3(0, 0.38, -0.05);
const VIEWS: Record<CameraPreset, [number, number, number]> = {
  three: [1.75, 1.15, 2.0],
  front: [0, 0.65, 2.7],
  side: [2.7, 0.6, -0.05],
  back: [-1.6, 1.2, -2.0],
  top: [0.01, 2.9, 0.2],
};

function CameraRig({ preset, n }: { preset: CameraPreset; n: number }) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: OrbitControlsImpl | null;
  };
  const goal = useRef<THREE.Vector3 | null>(null);
  useEffect(() => {
    goal.current = new THREE.Vector3(...VIEWS[preset]);
  }, [preset, n]);
  useFrame((_, raw) => {
    if (!goal.current) return;
    const k = 1 - Math.exp(-4 * Math.min(raw, 0.05));
    camera.position.lerp(goal.current, k);
    if (controls) {
      controls.target.lerp(TARGET, k);
      controls.update();
    }
    if (camera.position.distanceTo(goal.current) < 0.005) goal.current = null;
  });
  return null;
}

function Dimensions({ params }: { params: ChairParams }) {
  const g = computeGeometry(params);
  const s = 0.01;
  const x = (g.frameX + 9) * s;
  const label = (t: string) => <div className="dim-label">{t}</div>;
  const fz = g.frontFoot.z * s + 0.04;
  const sb = lerp2(g.seatRear, g.backTop, 0.35);
  return (
    <group>
      <Line
        points={[
          [x, 0, fz],
          [x, g.seatFront.y * s, fz],
        ]}
        color={C3.blue}
        lineWidth={1.2}
      />
      <Line
        points={[
          [x - 0.03, g.seatFront.y * s, fz],
          [x + 0.03, g.seatFront.y * s, fz],
        ]}
        color={C3.blue}
        lineWidth={1.2}
      />
      <Html position={[x + 0.02, (g.seatFront.y * s) / 2, fz]} center>
        {label(`H ${params.seatHeight.toFixed(1)} cm`)}
      </Html>

      <Line
        points={[
          [-g.frameX * s, 0.02, fz + 0.06],
          [g.frameX * s, 0.02, fz + 0.06],
        ]}
        color={C3.blue}
        lineWidth={1.2}
      />
      <Html position={[0, 0.02, fz + 0.08]} center>
        {label(`W ${params.seatWidth.toFixed(1)} cm`)}
      </Html>

      <Line
        points={[
          [x, (g.seatFront.y + 6) * s, g.seatFront.z * s],
          [x, (g.seatRear.y + 6) * s, g.seatRear.z * s],
        ]}
        color={C3.blue}
        lineWidth={1.2}
        dashed
        dashSize={0.02}
        gapSize={0.01}
      />
      <Html position={[x, (g.seatCenter.y + 10) * s, g.seatCenter.z * s]} center>
        {label(`D ${params.seatDepth.toFixed(1)} cm`)}
      </Html>

      <Html position={[x, sb.y * s, sb.z * s]} center>
        {label(`∠ ${params.backAngle.toFixed(1)}°`)}
      </Html>
      <Line
        points={[
          [x, 0.005, g.rearFoot.z * s],
          [x, 0.005, g.frontFoot.z * s],
        ]}
        color={C3.blue}
        lineWidth={1}
        dashed
        dashSize={0.015}
        gapSize={0.01}
      />
      <Html position={[x, 0.005, ((g.rearFoot.z + g.frontFoot.z) / 2) * s]} center>
        {label(`Footprint ${g.footprintDepth.toFixed(1)} cm`)}
      </Html>
    </group>
  );
}

export interface StudioShellProps {
  camera?: { preset: CameraPreset; n: number };
  onMiss?: () => void;
  autoRotate?: boolean;
  controls?: boolean;
  initial?: CameraPreset;
  children: React.ReactNode;
}

/** Shared stage: lights, floor, shadows, camera rig. Models render as children. */
export function StudioShell({
  camera,
  onMiss,
  autoRotate,
  controls = true,
  initial = "three",
  children,
}: StudioShellProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: VIEWS[initial], fov: 34, near: 0.05, far: 40 }}
      onPointerMissed={onMiss}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <color attach="background" args={["#F1ECE3"]} />
      <fog attach="fog" args={["#F1ECE3", 4, 11]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[2.5, 4, 2]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-1.5, 1.5, 1.5, -1.5, 0.1, 10]} />
      </directionalLight>
      <directionalLight position={[-3, 2, -1]} intensity={0.5} color="#f3dcc0" />
      <Environment resolution={256}>
        <Lightformer
          intensity={1.6}
          position={[0, 5, 0]}
          rotation-x={Math.PI / 2}
          scale={[8, 8, 1]}
        />
        <Lightformer
          intensity={0.9}
          color="#f6e6d0"
          position={[-4, 1.5, 1]}
          rotation-y={Math.PI / 2}
          scale={[8, 2, 1]}
        />
        <Lightformer
          intensity={0.6}
          color="#d9e6e2"
          position={[4, 1.5, -1]}
          rotation-y={-Math.PI / 2}
          scale={[8, 2, 1]}
        />
      </Environment>

      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.001, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#E9E1D4" roughness={0.95} />
      </mesh>
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.45}
        scale={3}
        blur={2.4}
        far={1.2}
        color="#30251F"
      />

      <Suspense fallback={null}>{children}</Suspense>

      {controls && (
        <OrbitControls
          makeDefault
          target={TARGET}
          enablePan
          minDistance={0.8}
          maxDistance={4.5}
          maxPolarAngle={Math.PI / 2 - 0.04}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping
        />
      )}
      {camera && <CameraRig preset={camera.preset} n={camera.n} />}
    </Canvas>
  );
}

export interface StudioCanvasProps extends ChairModelProps {
  ghostParams?: ChairParams | null;
  dims?: boolean;
  stress?: StressReport | null;
  stressGrain?: boolean;
  stressLabels?: boolean;
  stressAnimateKey?: number;
  camera?: { preset: CameraPreset; n: number };
  onMiss?: () => void;
  autoRotate?: boolean;
  controls?: boolean;
  initial?: CameraPreset;
  sitter?: { measurements: UserMeasurements; runKey: number } | null;
}

export function StudioCanvas({
  ghostParams,
  dims,
  stress,
  stressGrain = true,
  stressLabels = true,
  stressAnimateKey,
  camera,
  onMiss,
  autoRotate,
  controls = true,
  initial = "three",
  sitter,
  ...chair
}: StudioCanvasProps) {
  return (
    <StudioShell
      camera={camera}
      onMiss={onMiss}
      autoRotate={autoRotate}
      controls={controls}
      initial={initial}
    >
      <ChairModel {...chair} />
      {ghostParams && <ChairModel params={ghostParams} ghost />}
      {dims && <Dimensions params={chair.params} />}
      {stress && !chair.exploded && (
        <StressOverlay
          report={stress}
          showGrain={stressGrain}
          showLabels={stressLabels}
          animateKey={stressAnimateKey}
        />
      )}
      {sitter && !chair.exploded && (
        <SitterOverlay
          typology="kangaroo"
          params={chair.params}
          measurements={sitter.measurements}
          runKey={sitter.runKey}
        />
      )}
    </StudioShell>
  );
}
