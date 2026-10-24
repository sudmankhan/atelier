import "./r3fDevSourceShim";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { J_FINISHES } from "@/lib/chair/japanese/params";
import { computeJapanese, crestYAt, SLAB_T, type JGeometry } from "@/lib/chair/japanese/geometry";
import type { JPartId } from "@/lib/chair/japanese/parts";
import type { JConnectionId } from "@/lib/chair/japanese/consequences";
import { C3 } from "./ChairModel";

interface JCtxValue {
  ghost: boolean;
  selected: JPartId | null;
  affected: JPartId[];
  hovered: JPartId | null;
  frame: string;
  seat: string;
}
const JCtx = createContext<JCtxValue>({ ghost: false, selected: null, affected: [], hovered: null, frame: "#221e1b", seat: "#d9bd8f" });
const PartCtx = createContext<JPartId>("legs");

function JMat({ seat = false, alert = false }: { seat?: boolean; alert?: boolean }) {
  const c = useContext(JCtx);
  const part = useContext(PartCtx);
  if (c.ghost) return <meshBasicMaterial color={C3.blue} transparent opacity={0.22} depthWrite={false} wireframe />;
  const sel = c.selected === part;
  const hov = c.hovered === part;
  const aff = !sel && c.affected.includes(part);
  const emissive = alert ? C3.alert : sel ? C3.teal : aff ? C3.blue : "#000000";
  const ei = alert ? 0.6 : sel ? 0.4 : aff ? 0.16 : hov ? 0.08 : 0;
  return (
    <meshStandardMaterial
      color={alert ? C3.alert : seat ? c.seat : c.frame}
      roughness={seat ? 0.6 : 0.32}
      metalness={seat ? 0 : 0.08}
      emissive={emissive}
      emissiveIntensity={ei}
    />
  );
}

/** A tapered member between two 3D points (legs, spindles, posts). */
function Taper({ a, b, rTop, rBottom }: { a: THREE.Vector3; b: THREE.Vector3; rTop: number; rBottom: number }) {
  const { pos, quat, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { pos: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), quat, length };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow receiveShadow>
      <cylinderGeometry args={[rTop, rBottom, length, 14]} />
      <JMat />
    </mesh>
  );
}

const NO_RAY = () => undefined;

interface JGroupProps {
  id: JPartId;
  explode: [number, number, number];
  exploded: boolean;
  visible: boolean;
  interactive: boolean;
  onSelect?: ((p: JPartId) => void) | undefined;
  onHover: (p: JPartId | null) => void;
  children: ReactNode;
}

function JGroup({ id, explode, exploded, visible, interactive, onSelect, onHover, children }: JGroupProps) {
  const ref = useRef<THREE.Group>(null);
  const st = useRef({ e: 0, v: visible ? 1 : 0 });
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const s = st.current;
    s.e += ((exploded ? 1 : 0) - s.e) * (1 - Math.exp(-5 * dt));
    s.v += ((visible ? 1 : 0) - s.v) * (1 - Math.exp(-4 * dt));
    if (!ref.current) return;
    const k = s.e + (1 - s.v) * 2.2;
    ref.current.position.set(explode[0] * k, explode[1] * k, explode[2] * k);
    ref.current.visible = s.v > 0.02;
  });
  return (
    <PartCtx.Provider value={id}>
      <group
        ref={ref}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (!interactive) return;
          e.stopPropagation();
          onSelect?.(id);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (!interactive) return;
          e.stopPropagation();
          onHover(id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (!interactive) return;
          onHover(null);
          document.body.style.cursor = "";
        }}
      >
        {children}
      </group>
    </PartCtx.Provider>
  );
}

export interface JapaneseChairModelProps {
  params: JapaneseParams;
  selected?: JPartId | null;
  onSelect?: (p: JPartId) => void;
  exploded?: boolean;
  ghost?: boolean;
  visibleParts?: JPartId[];
  affected?: JPartId[];
  misaligned?: JConnectionId[];
}

const J_EXPLODE: Record<JPartId, [number, number, number]> = {
  legs: [0, -16, 0],
  seatSlab: [0, 8, 0],
  spindles: [0, 24, -6],
  crestRail: [0, 40, -12],
  arms: [0, 18, 14],
  connections: [0, 0, 0],
};

function seatGeometry(W: number, D: number) {
  const r = 6;
  const x = -W / 2, y = -D / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + W - r, y);
  s.absarc(x + W - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + W, y + D - r);
  s.absarc(x + W - r, y + D - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + D);
  s.absarc(x + r, y + D - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: SLAB_T, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function JapaneseChairModel({
  params,
  selected = null,
  onSelect,
  exploded = false,
  ghost = false,
  visibleParts,
  affected = [],
  misaligned = [],
}: JapaneseChairModelProps) {
  const g: JGeometry = useMemo(() => computeJapanese(params), [params]);
  const [hovered, setHovered] = useState<JPartId | null>(null);
  const fin = J_FINISHES[params.finish];
  const vis = (p: JPartId) => (visibleParts ? visibleParts.includes(p) : true);
  const interactive = !ghost && Boolean(onSelect);
  const rc = ghost ? NO_RAY : THREE.Mesh.prototype.raycast;

  const halfW = params.seatWidth / 2;
  const halfD = params.seatDepth / 2;
  const top = params.seatHeight;
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  const legs = useMemo(() => {
    const tx = g.legTopX, fx = g.legFootX;
    return [
      { a: v(-fx, 0, g.frontFoot.z), b: v(-tx, top, g.frontLegTop.z) },
      { a: v(fx, 0, g.frontFoot.z), b: v(tx, top, g.frontLegTop.z) },
      { a: v(-fx, 0, g.rearFoot.z), b: v(-tx, top, g.rearLegTop.z) },
      { a: v(fx, 0, g.rearFoot.z), b: v(tx, top, g.rearLegTop.z) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, top]);

  const seat = useMemo(() => seatGeometry(params.seatWidth, params.seatDepth), [params.seatWidth, params.seatDepth]);

  const crest = useMemo(() => {
    const px = halfW - 3;
    const pts = [
      v(-px, g.postTop.y, g.postTop.z),
      v(-px / 2, g.postTop.y + (g.crestMid.y - g.postTop.y) * 0.75, g.postTop.z + (g.crestMid.z - g.postTop.z) * 0.75),
      v(0, g.crestMid.y, g.crestMid.z),
      v(px / 2, g.postTop.y + (g.crestMid.y - g.postTop.y) * 0.75, g.postTop.z + (g.crestMid.z - g.postTop.z) * 0.75),
      v(px, g.postTop.y, g.postTop.z),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), 48, 1.5, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, halfW]);

  const arms = useMemo(() => {
    const x = g.legTopX;
    return [-1, 1].map((s) => {
      const pts = [
        v(s * x, g.armFront.y, g.armFront.z),
        v(s * x, (g.armFront.y + g.armBack.y) / 2 + 1.5, (g.armFront.z + g.armBack.z) / 2),
        v(s * x, g.armBack.y, g.armBack.z),
      ];
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), 24, 1.25, 10);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g]);

  const spindles = useMemo(() => {
    const out: { a: THREE.Vector3; b: THREE.Vector3; post: boolean }[] = [];
    const px = halfW - 3;
    out.push({ a: v(-px, top, g.postBase.z), b: v(-px, g.postTop.y, g.postTop.z), post: true });
    out.push({ a: v(px, top, g.postBase.z), b: v(px, g.postTop.y, g.postTop.z), post: true });
    for (let i = 1; i <= params.spindles; i++) {
      const x = -px + (2 * px * i) / (params.spindles + 1);
      const c = crestYAt(g, halfW, x);
      out.push({ a: v(x, top, g.postBase.z + 1), b: v(x, c.y - 1, c.z), post: false });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, halfW, params.spindles, top]);

  const pins: { id: JConnectionId; pos: [number, number, number] }[] = [
    { id: "legJoints", pos: [-g.legTopX, top + 0.4, g.frontLegTop.z] },
    { id: "legJoints", pos: [g.legTopX, top + 0.4, g.frontLegTop.z] },
    { id: "legJoints", pos: [-g.legTopX, top + 0.4, g.rearLegTop.z] },
    { id: "legJoints", pos: [g.legTopX, top + 0.4, g.rearLegTop.z] },
    { id: "armJoints", pos: [-g.legTopX, g.armBack.y, g.armBack.z] },
    { id: "armJoints", pos: [g.legTopX, g.armBack.y, g.armBack.z] },
  ];

  const common = { exploded, interactive, onSelect, onHover: setHovered };

  return (
    <JCtx.Provider value={{ ghost, selected, affected, hovered, frame: fin.frame, seat: fin.seat }}>
      <group scale={0.01}>
        <JGroup id="legs" explode={J_EXPLODE.legs} visible={vis("legs")} {...common}>
          {legs.map((l, i) => (
            <Taper key={i} a={l.a} b={l.b} rTop={1.4} rBottom={1.9} />
          ))}
        </JGroup>

        <JGroup id="seatSlab" explode={J_EXPLODE.seatSlab} visible={vis("seatSlab")} {...common}>
          <mesh geometry={seat} position={[0, top - SLAB_T, 0]} castShadow receiveShadow raycast={rc}>
            <JMat seat />
          </mesh>
        </JGroup>

        <JGroup id="spindles" explode={J_EXPLODE.spindles} visible={vis("spindles")} {...common}>
          {spindles.map((s, i) => (
            <Taper key={i} a={s.a} b={s.b} rTop={s.post ? 1.5 : 0.65} rBottom={s.post ? 1.8 : 0.85} />
          ))}
        </JGroup>

        <JGroup id="crestRail" explode={J_EXPLODE.crestRail} visible={vis("crestRail")} {...common}>
          <mesh geometry={crest} castShadow receiveShadow raycast={rc}>
            <JMat />
          </mesh>
        </JGroup>

        <JGroup id="arms" explode={J_EXPLODE.arms} visible={vis("arms")} {...common}>
          {arms.map((geo, i) => (
            <mesh key={i} geometry={geo} castShadow receiveShadow raycast={rc}>
              <JMat />
            </mesh>
          ))}
        </JGroup>

        <JGroup id="connections" explode={J_EXPLODE.connections} visible={vis("connections")} {...common}>
          {pins.map((pin, i) => (
            <mesh key={i} position={pin.pos} castShadow raycast={rc}>
              <sphereGeometry args={[1.5, 14, 12]} />
              <JMat alert={misaligned.includes(pin.id)} />
            </mesh>
          ))}
        </JGroup>
      </group>
    </JCtx.Provider>
  );
}
