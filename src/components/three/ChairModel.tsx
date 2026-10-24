import "./r3fDevSourceShim";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ChairParams } from "@/lib/chair/params";
import { computeGeometry, lerp2, type V2 } from "@/lib/chair/geometry";
import type { PartId } from "@/lib/chair/parts";
import type { ConnectionId } from "@/lib/chair/consequences";
import { caneTexture, woodTexture } from "./textures";

// 3D palette (scene-only; UI colours live in the design system)
export const C3 = { teal: "#547D75", blue: "#66859A", alert: "#B5654A", pin: "#4a3324" };

interface ChairCtxValue {
  ghost: boolean;
  selected: PartId | null;
  affected: PartId[];
  hovered: PartId | null;
  wood: THREE.Texture | null;
  cane: THREE.Texture | null;
}
const ChairCtx = createContext<ChairCtxValue>({ ghost: false, selected: null, affected: [], hovered: null, wood: null, cane: null });
const PartCtx = createContext<PartId>("sideFrame");

function Mat({ kind, alert = false }: { kind: "wood" | "cane" | "pin"; alert?: boolean }) {
  const c = useContext(ChairCtx);
  const part = useContext(PartCtx);
  if (c.ghost)
    return <meshBasicMaterial color={C3.blue} transparent opacity={kind === "cane" ? 0.06 : 0.22} depthWrite={false} wireframe={kind !== "cane"} />;
  const sel = c.selected === part;
  const hov = c.hovered === part;
  const aff = !sel && c.affected.includes(part);
  const emissive = alert ? C3.alert : sel ? C3.teal : aff ? C3.blue : "#000000";
  const ei = alert ? 0.6 : sel ? 0.45 : aff ? 0.18 : hov ? 0.1 : 0;
  if (kind === "cane")
    return (
      <meshStandardMaterial
        map={c.cane}
        alphaTest={0.4}
        side={THREE.DoubleSide}
        roughness={0.8}
        color={sel ? "#cfe3dc" : "#ffffff"}
        emissive={hov && !sel ? "#ffffff" : emissive}
        emissiveIntensity={ei}
      />
    );
  return (
    <meshStandardMaterial
      map={kind === "wood" ? c.wood : null}
      color={kind === "pin" ? (alert ? C3.alert : C3.pin) : sel ? "#d7e6e1" : "#ffffff"}
      roughness={kind === "pin" ? 0.4 : 0.55}
      metalness={0}
      emissive={hov && !sel ? "#ffffff" : emissive}
      emissiveIntensity={ei}
    />
  );
}

/** A straight member between two 3D points. */
function Strut({ a, b, r = 1.6, kind = "wood" as const }: { a: THREE.Vector3; b: THREE.Vector3; r?: number; kind?: "wood" | "pin" }) {
  const { pos, quat, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { pos: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), quat, length };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, length, 14]} />
      <Mat kind={kind} />
    </mesh>
  );
}

const NO_RAY = () => undefined;
const v3 = (x: number, p: V2) => new THREE.Vector3(x, p.y, p.z);

interface PartGroupProps {
  id: PartId;
  explode: [number, number, number];
  exploded: boolean;
  visible: boolean;
  interactive: boolean;
  onSelect?: ((p: PartId) => void) | undefined;
  onHover: (p: PartId | null) => void;
  children: ReactNode;
}

function PartGroup({ id, explode, exploded, visible, interactive, onSelect, onHover, children }: PartGroupProps) {
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

export interface ChairModelProps {
  params: ChairParams;
  selected?: PartId | null;
  onSelect?: (p: PartId) => void;
  exploded?: boolean;
  ghost?: boolean;
  visibleParts?: PartId[];
  affected?: PartId[];
  misaligned?: ConnectionId[];
}

const EXPLODE: Record<PartId, [number, number, number]> = {
  sideFrame: [0, 0, 0],
  rails: [0, -10, 18],
  seat: [0, 22, 10],
  backrest: [0, 16, -26],
  cane: [0, 44, 4],
  connections: [0, 0, 0],
};

export function ChairModel({
  params,
  selected = null,
  onSelect,
  exploded = false,
  ghost = false,
  visibleParts,
  affected = [],
  misaligned = [],
}: ChairModelProps) {
  const g = useMemo(() => computeGeometry(params), [params]);
  const [hovered, setHovered] = useState<PartId | null>(null);
  const wood = useMemo(() => (ghost ? null : woodTexture(params.wood)), [ghost, params.wood]);
  const cane = useMemo(() => (ghost ? null : caneTexture()), [ghost]);
  const vis = (p: PartId) => (visibleParts ? visibleParts.includes(p) : true);
  const interactive = !ghost && Boolean(onSelect);
  const rc = ghost ? NO_RAY : THREE.Mesh.prototype.raycast;
  const W = params.seatWidth;
  const fx = g.frameX;

  // Side-frame curves: front leg → seat → back post, plus rear support
  const frameGeoms = useMemo(() => {
    const pts = (x: number) => [
      v3(x, g.frontFoot),
      v3(x, lerp2(g.frontFoot, g.seatFront, 0.55)),
      v3(x, g.seatFront),
      v3(x, lerp2(g.seatFront, g.seatRear, 0.5)),
      v3(x, g.seatRear),
      v3(x, g.backMid),
      v3(x, g.backTop),
    ];
    const rear = (x: number) => [v3(x, g.rearJoint), v3(x, lerp2(g.rearJoint, g.rearFoot, 0.5)), v3(x, g.rearFoot)];
    return [-fx, fx].map((x) => ({
      main: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts(x), false, "centripetal", 0.4), 160, 1.9, 12),
      rear: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rear(x), false, "centripetal"), 40, 1.8, 12),
    }));
  }, [g, fx]);

  // Backrest cane: bowed plane
  const backCane = useMemo(() => {
    const geo = new THREE.PlaneGeometry(W - 6, g.backrestLength - 5, 16, 16);
    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / (W - 6);
      pos.setZ(i, -Math.cos(x * Math.PI) * 1.2 - params.backCurve * 1.5);
    }
    geo.computeVertexNormals();
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (W / 10), uv.getY(i) * (g.backrestLength / 10));
    return geo;
  }, [W, g.backrestLength, params.backCurve]);
  const seatCane = useMemo(() => {
    const geo = new THREE.PlaneGeometry(W - 6, params.seatDepth - 8);
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (W / 10), uv.getY(i) * (params.seatDepth / 10));
    return geo;
  }, [W, params.seatDepth]);

  const seatRot = -g.tilt;
  const backRot = Math.PI / 2 - Math.atan2(g.backDir.y, g.backDir.z);
  const sd = params.seatDepth - 2;
  const bl = g.backrestLength;

  const pins: { id: ConnectionId; p: V2 }[] = [
    { id: "frontJoint", p: g.seatFront },
    { id: "rearJoint", p: g.rearJoint },
    { id: "railJoints", p: g.frontRail },
    { id: "railJoints", p: g.rearRail },
    { id: "backTopJoint", p: lerp2(g.seatRear, g.backTop, 0.9) },
  ];

  const common = { exploded, interactive, onSelect, onHover: setHovered };

  return (
    <ChairCtx.Provider value={{ ghost, selected, affected, hovered, wood, cane }}>
      <group scale={0.01}>
        <PartGroup id="sideFrame" explode={EXPLODE.sideFrame} visible={vis("sideFrame")} {...common}>
          {frameGeoms.map((f, i) => (
            <group key={i} position={[exploded ? (i === 0 ? -1 : 1) * 0 : 0, 0, 0]}>
              <mesh geometry={f.main} castShadow receiveShadow raycast={rc}>
                <Mat kind="wood" />
              </mesh>
              <mesh geometry={f.rear} castShadow receiveShadow raycast={rc}>
                <Mat kind="wood" />
              </mesh>
            </group>
          ))}
        </PartGroup>

        <PartGroup id="rails" explode={EXPLODE.rails} visible={vis("rails")} {...common}>
          <Strut a={v3(-fx, g.frontRail)} b={v3(fx, g.frontRail)} r={1.4} />
          <Strut a={v3(-fx, g.rearRail)} b={v3(fx, g.rearRail)} r={1.4} />
          <Strut a={v3(-fx, lerp2(g.seatRear, g.backTop, 0.97))} b={v3(fx, lerp2(g.seatRear, g.backTop, 0.97))} r={1.5} />
        </PartGroup>

        <PartGroup id="seat" explode={EXPLODE.seat} visible={vis("seat")} {...common}>
          <group position={[0, g.seatCenter.y, g.seatCenter.z]} rotation={[seatRot, 0, 0]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (W / 2 - 1.8), 0, 0]} castShadow raycast={rc}>
                <boxGeometry args={[3.2, 3, sd]} />
                <Mat kind="wood" />
              </mesh>
            ))}
            {[-1, 1].map((s) => (
              <mesh key={`x${s}`} position={[0, 0, s * (sd / 2 - 1.6)]} castShadow raycast={rc}>
                <boxGeometry args={[W - 0.4, 3, 3.2]} />
                <Mat kind="wood" />
              </mesh>
            ))}
          </group>
        </PartGroup>

        <PartGroup id="backrest" explode={EXPLODE.backrest} visible={vis("backrest")} {...common}>
          <group position={[0, g.backrestCenter.y, g.backrestCenter.z]} rotation={[backRot, 0, 0]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (W / 2 - 1.8), 0, 0]} castShadow raycast={rc}>
                <boxGeometry args={[3.2, bl, 2.6]} />
                <Mat kind="wood" />
              </mesh>
            ))}
            {[-1, 1].map((s) => (
              <mesh key={`y${s}`} position={[0, s * (bl / 2 - 1.5), 0]} castShadow raycast={rc}>
                <boxGeometry args={[W - 0.4, 3, 2.6]} />
                <Mat kind="wood" />
              </mesh>
            ))}
          </group>
        </PartGroup>

        <PartGroup id="cane" explode={EXPLODE.cane} visible={vis("cane")} {...common}>
          <group position={[0, g.seatCenter.y + 0.6, g.seatCenter.z]} rotation={[seatRot, 0, 0]}>
            <mesh geometry={seatCane} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow raycast={rc}>
              <Mat kind="cane" />
            </mesh>
          </group>
          <group position={[0, g.backrestCenter.y, g.backrestCenter.z]} rotation={[backRot, 0, 0]}>
            <mesh geometry={backCane} castShadow raycast={rc}>
              <Mat kind="cane" />
            </mesh>
          </group>
        </PartGroup>

        <PartGroup id="connections" explode={EXPLODE.connections} visible={vis("connections")} {...common}>
          {pins.flatMap((pin, i) =>
            [-1, 1].map((s) => (
              <group key={`${i}${s}`} position={[s * (fx + 1.7), pin.p.y, pin.p.z]} rotation={[0, 0, Math.PI / 2]}>
                <mesh castShadow raycast={rc}>
                  <cylinderGeometry args={[1.25, 1.25, 1.2, 16]} />
                  <Mat kind="pin" alert={misaligned.includes(pin.id)} />
                </mesh>
              </group>
            )),
          )}
        </PartGroup>
      </group>
    </ChairCtx.Provider>
  );
}
