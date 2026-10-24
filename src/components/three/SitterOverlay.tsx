import { useEffect, useMemo, useRef } from "react";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { computeGeometry } from "@/lib/chair/geometry";
import { POST_LEAN } from "@/lib/chair/japanese/geometry";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import type { ChairParams, Typology } from "@/lib/chair/params";
import type { UserMeasurements } from "@/lib/chair/consequences";
import { evaluateSitterFit, resolveSitter, type FitArea } from "@/lib/chair/fit";

type PointName =
  | "hipL"
  | "hipR"
  | "kneeL"
  | "kneeR"
  | "ankleL"
  | "ankleR"
  | "toeL"
  | "toeR"
  | "shoulderL"
  | "shoulderR"
  | "elbowL"
  | "elbowR"
  | "handL"
  | "handR"
  | "hipCenter"
  | "shoulderCenter"
  | "head";

type Pose = Record<PointName, THREE.Vector3>;
type SegmentName =
  | "pelvis"
  | "torso"
  | "shoulders"
  | "leftThigh"
  | "rightThigh"
  | "leftShin"
  | "rightShin"
  | "leftFoot"
  | "rightFoot"
  | "leftUpperArm"
  | "rightUpperArm"
  | "leftForearm"
  | "rightForearm";

const SEGMENTS: { id: SegmentName; a: PointName; b: PointName; radius: number }[] = [
  { id: "pelvis", a: "hipL", b: "hipR", radius: 0.045 },
  { id: "torso", a: "hipCenter", b: "shoulderCenter", radius: 0.055 },
  { id: "shoulders", a: "shoulderL", b: "shoulderR", radius: 0.038 },
  { id: "leftThigh", a: "hipL", b: "kneeL", radius: 0.038 },
  { id: "rightThigh", a: "hipR", b: "kneeR", radius: 0.038 },
  { id: "leftShin", a: "kneeL", b: "ankleL", radius: 0.032 },
  { id: "rightShin", a: "kneeR", b: "ankleR", radius: 0.032 },
  { id: "leftFoot", a: "ankleL", b: "toeL", radius: 0.028 },
  { id: "rightFoot", a: "ankleR", b: "toeR", radius: 0.028 },
  { id: "leftUpperArm", a: "shoulderL", b: "elbowL", radius: 0.026 },
  { id: "rightUpperArm", a: "shoulderR", b: "elbowR", radius: 0.026 },
  { id: "leftForearm", a: "elbowL", b: "handL", radius: 0.022 },
  { id: "rightForearm", a: "elbowR", b: "handR", radius: 0.022 },
];

const BODY = "#728995";
const JOINT = "#d8c4a9";
const DIM = "#66859A";
const LOAD = "#B5654A";

interface SitterOverlayProps {
  typology: Typology;
  params: ChairParams | JapaneseParams;
  measurements: UserMeasurements;
  runKey: number;
}

export function SitterOverlay({ typology, params, measurements, runKey }: SitterOverlayProps) {
  const elapsed = useRef(0);
  const segmentRefs = useRef<Partial<Record<SegmentName, THREE.Mesh>>>({});
  const jointRefs = useRef<Partial<Record<PointName, THREE.Mesh>>>({});
  const dimensionsRef = useRef<THREE.Group>(null);
  const loadRef = useRef<THREE.Group>(null);
  const sitter = resolveSitter(measurements);
  const fit = useMemo(
    () => evaluateSitterFit(typology, params, measurements),
    [typology, params, measurements],
  );
  const layout = useMemo(() => buildLayout(typology, params, sitter), [typology, params, sitter]);

  useEffect(() => {
    elapsed.current = 0;
  }, [runKey]);

  useFrame((_, delta) => {
    elapsed.current = Math.min(2.6, elapsed.current + Math.min(delta, 0.05));
    const raw = Math.min(1, elapsed.current / 2.4);
    const t = raw * raw * (3 - 2 * raw);
    const pose = interpolatePose(layout.standing, layout.seated, t);

    for (const segment of SEGMENTS) {
      const mesh = segmentRefs.current[segment.id];
      if (mesh) placeSegment(mesh, pose[segment.a], pose[segment.b], segment.radius);
    }
    for (const name of Object.keys(jointRefs.current) as PointName[]) {
      jointRefs.current[name]?.position.copy(pose[name]);
    }
    if (dimensionsRef.current) dimensionsRef.current.visible = raw > 0.62;
    if (loadRef.current) loadRef.current.visible = raw > 0.78;
  });

  const conflicts = fit.filter((result) => result.level !== "ok");
  const loadN = Math.round(sitter.massKg * 9.81);

  return (
    <group renderOrder={20}>
      {SEGMENTS.map((segment) => (
        <mesh
          key={segment.id}
          ref={(node) => {
            if (node) segmentRefs.current[segment.id] = node;
          }}
          castShadow
        >
          <cylinderGeometry args={[1, 1, 1, 10]} />
          <meshStandardMaterial color={BODY} roughness={0.72} transparent opacity={0.82} />
        </mesh>
      ))}
      {(Object.keys(layout.seated) as PointName[]).map((name) => (
        <mesh
          key={name}
          ref={(node) => {
            if (node) jointRefs.current[name] = node;
          }}
          scale={name === "head" ? 0.075 : 0.045}
        >
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial
            color={name === "head" ? JOINT : BODY}
            roughness={0.75}
            transparent
            opacity={0.86}
          />
        </mesh>
      ))}

      <group ref={dimensionsRef} visible={false}>
        <Dimension
          a={layout.seated.ankleR}
          b={layout.seated.kneeR}
          label={`${sitter.poplitealHeight} cm knee height`}
        />
        <Dimension
          a={layout.seated.hipR}
          b={layout.seated.kneeR}
          label={`${sitter.thighLength} cm thigh`}
        />
        <Dimension
          a={layout.seated.hipL}
          b={layout.seated.hipR}
          label={`${sitter.hipBreadth} cm hips`}
        />
        <Dimension
          a={layout.hipCenter}
          b={layout.shoulderCenter}
          label={`${sitter.torsoHeight} cm torso`}
        />

        {conflicts.map((result) => {
          const position = layout.conflictPositions[result.id];
          const color = result.level === "conflict" ? LOAD : "#C9963B";
          return (
            <group key={result.id} position={position}>
              <mesh>
                <sphereGeometry args={[0.065, 18, 12]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} depthTest={false} />
              </mesh>
              <Html
                position={[0.08, 0.06, 0]}
                center={false}
                distanceFactor={1.3}
                zIndexRange={[8, 0]}
              >
                <div
                  className="w-48 rounded-md border bg-card/95 px-2 py-1.5 text-[10px] leading-snug shadow-sm"
                  style={{ borderColor: color, color }}
                >
                  <div className="font-semibold">{result.title}</div>
                  <div className="mt-0.5 text-foreground/75">{result.detail}</div>
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      <group ref={loadRef} visible={false}>
        <Line
          points={[layout.shoulderCenter, layout.hipCenter, layout.seatContact]}
          color={LOAD}
          lineWidth={2}
          dashed
          dashSize={0.025}
          gapSize={0.012}
          depthTest={false}
        />
        <mesh position={layout.seatContact} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.025, 0.07, 10]} />
          <meshBasicMaterial color={LOAD} depthTest={false} />
        </mesh>
        <Html position={layout.hipCenter} center distanceFactor={1.3} zIndexRange={[7, 0]}>
          <div className="whitespace-nowrap rounded border border-alert bg-card/95 px-2 py-1 font-mono text-[10px] text-alert shadow-sm">
            ≈ {loadN} N seated load · illustrative path
          </div>
        </Html>
      </group>
    </group>
  );
}

function Dimension({ a, b, label }: { a: THREE.Vector3; b: THREE.Vector3; label: string }) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <group>
      <Line
        points={[a, b]}
        color={DIM}
        lineWidth={1.3}
        dashed
        dashSize={0.018}
        gapSize={0.009}
        depthTest={false}
      />
      <Html position={mid} center distanceFactor={1.4} zIndexRange={[6, 0]}>
        <div className="dim-label">{label}</div>
      </Html>
    </group>
  );
}

function buildLayout(
  typology: Typology,
  params: ChairParams | JapaneseParams,
  sitter: ReturnType<typeof resolveSitter>,
) {
  const isK = typology === "kangaroo";
  const k = isK ? computeGeometry(params as ChairParams) : null;
  const seatY = params.seatHeight * 0.01;
  const seatFrontZ = params.seatDepth * 0.005;
  const seatRearZ = -params.seatDepth * 0.005;
  const seatWidth = params.seatWidth * 0.01;
  const hipZ = seatRearZ + 0.1;
  const hipY = seatY + 0.075;
  const kneeY = Math.max(seatY + 0.025, sitter.poplitealHeight * 0.01 + 0.025);
  const thighVertical = kneeY - hipY;
  const thighRun = Math.sqrt(
    Math.max(0.04, Math.pow(sitter.thighLength * 0.01, 2) - thighVertical * thighVertical),
  );
  const kneeZ = hipZ + thighRun;
  const ankleY = Math.max(0.035, kneeY - sitter.poplitealHeight * 0.01);
  const backRecline = THREE.MathUtils.degToRad(isK ? k!.backRecline : POST_LEAN);
  const torso = sitter.torsoHeight * 0.01;
  const shoulderCenter = new THREE.Vector3(
    0,
    hipY + Math.cos(backRecline) * torso,
    hipZ - Math.sin(backRecline) * torso,
  );
  const hipCenter = new THREE.Vector3(0, hipY, hipZ);
  // Keep the body at its true breadth even when it exceeds the chair so the
  // side conflict remains visible instead of squeezing the mannequin to fit.
  const hipHalf = sitter.hipBreadth * 0.005;
  const shoulderHalf = Math.max(0.15, hipHalf * 1.08);
  const head = shoulderCenter.clone().add(new THREE.Vector3(0, 0.13, -0.015));

  const seated: Pose = {
    hipL: new THREE.Vector3(-hipHalf, hipY, hipZ),
    hipR: new THREE.Vector3(hipHalf, hipY, hipZ),
    kneeL: new THREE.Vector3(-hipHalf * 0.82, kneeY, kneeZ),
    kneeR: new THREE.Vector3(hipHalf * 0.82, kneeY, kneeZ),
    ankleL: new THREE.Vector3(-hipHalf * 0.82, ankleY, kneeZ + 0.025),
    ankleR: new THREE.Vector3(hipHalf * 0.82, ankleY, kneeZ + 0.025),
    toeL: new THREE.Vector3(-hipHalf * 0.82, ankleY, kneeZ + 0.17),
    toeR: new THREE.Vector3(hipHalf * 0.82, ankleY, kneeZ + 0.17),
    shoulderL: shoulderCenter.clone().add(new THREE.Vector3(-shoulderHalf, 0, 0)),
    shoulderR: shoulderCenter.clone().add(new THREE.Vector3(shoulderHalf, 0, 0)),
    elbowL: shoulderCenter.clone().add(new THREE.Vector3(-shoulderHalf - 0.025, -0.2, 0.1)),
    elbowR: shoulderCenter.clone().add(new THREE.Vector3(shoulderHalf + 0.025, -0.2, 0.1)),
    handL: new THREE.Vector3(-hipHalf, hipY + 0.08, hipZ + 0.22),
    handR: new THREE.Vector3(hipHalf, hipY + 0.08, hipZ + 0.22),
    hipCenter,
    shoulderCenter,
    head,
  };

  const standZ = seatFrontZ + 0.52;
  const standHipY = sitter.poplitealHeight * 0.01 + sitter.thighLength * 0.01;
  const standingShoulderY = standHipY + torso;
  const standing: Pose = {
    hipL: new THREE.Vector3(-hipHalf, standHipY, standZ),
    hipR: new THREE.Vector3(hipHalf, standHipY, standZ),
    kneeL: new THREE.Vector3(-hipHalf * 0.82, sitter.poplitealHeight * 0.01, standZ),
    kneeR: new THREE.Vector3(hipHalf * 0.82, sitter.poplitealHeight * 0.01, standZ),
    ankleL: new THREE.Vector3(-hipHalf * 0.82, 0.04, standZ),
    ankleR: new THREE.Vector3(hipHalf * 0.82, 0.04, standZ),
    toeL: new THREE.Vector3(-hipHalf * 0.82, 0.04, standZ + 0.15),
    toeR: new THREE.Vector3(hipHalf * 0.82, 0.04, standZ + 0.15),
    shoulderL: new THREE.Vector3(-shoulderHalf, standingShoulderY, standZ),
    shoulderR: new THREE.Vector3(shoulderHalf, standingShoulderY, standZ),
    elbowL: new THREE.Vector3(-shoulderHalf - 0.02, standingShoulderY - 0.22, standZ),
    elbowR: new THREE.Vector3(shoulderHalf + 0.02, standingShoulderY - 0.22, standZ),
    handL: new THREE.Vector3(-shoulderHalf - 0.02, standingShoulderY - 0.43, standZ),
    handR: new THREE.Vector3(shoulderHalf + 0.02, standingShoulderY - 0.43, standZ),
    hipCenter: new THREE.Vector3(0, standHipY, standZ),
    shoulderCenter: new THREE.Vector3(0, standingShoulderY, standZ),
    head: new THREE.Vector3(0, standingShoulderY + 0.13, standZ),
  };

  const seatContact = new THREE.Vector3(0, seatY + 0.015, hipZ);
  const conflictPositions: Record<FitArea, THREE.Vector3> = {
    seatHeight: new THREE.Vector3(hipHalf + 0.1, Math.max(0.05, ankleY), kneeZ + 0.02),
    seatDepth: new THREE.Vector3(0, seatY + 0.055, seatFrontZ),
    seatWidth: new THREE.Vector3(seatWidth / 2, hipY, hipZ),
  };

  return { standing, seated, hipCenter, shoulderCenter, seatContact, conflictPositions };
}

function interpolatePose(a: Pose, b: Pose, t: number): Pose {
  const result = {} as Pose;
  for (const name of Object.keys(a) as PointName[]) result[name] = a[name].clone().lerp(b[name], t);
  return result;
}

function placeSegment(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, radius: number) {
  const direction = b.clone().sub(a);
  const length = Math.max(0.001, direction.length());
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.scale.set(radius, length, radius);
}
