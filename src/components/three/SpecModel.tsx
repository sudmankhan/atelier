// 3D model drawn straight from a furniture data file: every stick and board where the file puts it.
// Units: cm in, metres out (×0.01), same as LabModel. Parts can be clicked, and pulled apart (explode).
import "./r3fDevSourceShim";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { FurnitureSpec, PartSpec } from "@/lib/furniture/spec";
import { METRES_PER_CM as S, WOOD_COLORS, boardSize, stickShape } from "@/lib/furniture/modelGeometry";

type V = [number, number, number];
const PICKED = "#547D75";
const HOVER = "#8fb3aa";

/** Glides its children to `to` (cm) so explode / un-explode animates. */
function Glide({ to, children }: { to: V; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(to[0] * S, to[1] * S, to[2] * S), [to[0], to[1], to[2]]);
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.position.lerp(target, 1 - Math.exp(-dt * 8));
  });
  return <group ref={g}>{children}</group>;
}

/** A straight member from a to b: width runs sideways, thickness runs (roughly) up. */
function Stick({ a, b, w, t, round, color, events }: { a: V; b: V; w: number; t: number; round?: boolean; color: string; events: object }) {
  const { matrix, box, cylinder } = useMemo(() => stickShape(a, b, w, t), [a, b, w, t]);
  return (
    <mesh matrix={matrix} matrixAutoUpdate={false} castShadow receiveShadow {...events}>
      {round ? <cylinderGeometry args={cylinder} /> : <boxGeometry args={box} />}
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Board({ at, size, color, events }: { at: V; size: PartSpec["size"]; color: string; events: object }) {
  return (
    <mesh position={[at[0] * S, at[1] * S, at[2] * S]} castShadow receiveShadow {...events}>
      <boxGeometry args={boardSize(size)} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

export function SpecModel({ spec, exploded = false, highlight, onPick }: { spec: FurnitureSpec; exploded?: boolean; highlight?: string | null; onPick?: (partId: string) => void }) {
  const col = WOOD_COLORS[spec.wood];
  const [hover, setHover] = useState<string | null>(null);
  // Explode: every piece moves straight out from the chair's middle, the seat lifts clear of the frame.
  const centre = useMemo<V>(() => {
    const seat = spec.parts.find((p) => p.role === "seat");
    const at = seat?.boards?.[0]?.at ?? seat?.sticks?.[0]?.[0] ?? [0, 40, 0];
    return [0, at[1] * 0.55, at[2]];
  }, [spec]);
  const offset = (c: V, role: PartSpec["role"]): V => {
    if (!exploded) return [0, 0, 0];
    const k = 0.4;
    return [(c[0] - centre[0]) * k, (c[1] - centre[1]) * 0.2 + (role === "seat" ? 7 : 0), (c[2] - centre[2]) * k + (role === "back" || role === "post" ? -4 : 0)];
  };
  return (
    <group onPointerOut={() => setHover(null)}>
      {spec.parts.map((p) => {
        const c = highlight === p.id ? PICKED : hover === p.id ? HOVER : col;
        const events = onPick
          ? {
              onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPick(p.id); },
              onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(p.id); document.body.style.cursor = "pointer"; },
              onPointerOut: () => { setHover((h) => (h === p.id ? null : h)); document.body.style.cursor = ""; },
            }
          : {};
        return (
          <group key={p.id}>
            {(p.sticks ?? []).map(([a, b], i) => (
              <Glide key={i} to={offset(mid(a, b), p.role)}>
                <Stick a={a} b={b} w={p.size[1]} t={p.size[2]} round={p.round} color={c} events={events} />
              </Glide>
            ))}
            {(p.boards ?? []).map((bd, i) => (
              <Glide key={`b${i}`} to={offset(bd.at, p.role)}>
                <Board at={bd.at} size={p.size} color={c} events={events} />
              </Glide>
            ))}
          </group>
        );
      })}
    </group>
  );
}
