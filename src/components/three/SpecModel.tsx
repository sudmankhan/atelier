// 3D model drawn straight from a furniture data file: every stick and board where the file puts it.
// Units: cm in, metres out (×0.01), same as LabModel.
import "./r3fDevSourceShim";
import { useMemo } from "react";
import * as THREE from "three";
import type { FurnitureSpec, PartSpec } from "@/lib/furniture/spec";

const S = 0.01;
type V = [number, number, number];
const WOOD: Record<FurnitureSpec["wood"], string> = { oak: "#c49a62", ash: "#d8c29a", walnut: "#6b4a33", pine: "#e1c38c" };
const HIGHLIGHT = "#547D75";

/** A straight member from a to b: width runs sideways, thickness runs (roughly) up. */
function Stick({ a, b, w, t, color, explode }: { a: V; b: V; w: number; t: number; color: string; explode: V }) {
  const { matrix, len } = useMemo(() => {
    const A = new THREE.Vector3(...a).multiplyScalar(S), B = new THREE.Vector3(...b).multiplyScalar(S);
    const dir = B.clone().sub(A);
    const len = dir.length();
    const y = dir.clone().normalize();
    const hint = Math.abs(y.y) > 0.95 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const x = new THREE.Vector3().crossVectors(y, hint).normalize();
    const z = new THREE.Vector3().crossVectors(x, y).normalize();
    const m = new THREE.Matrix4().makeBasis(x, y, z);
    m.setPosition(A.add(B).multiplyScalar(0.5).add(new THREE.Vector3(...explode).multiplyScalar(S)));
    return { matrix: m, len };
  }, [a, b, explode]);
  return (
    <mesh matrix={matrix} matrixAutoUpdate={false} castShadow receiveShadow>
      <boxGeometry args={[w * S, len, t * S]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Board({ at, size, color, explode }: { at: V; size: PartSpec["size"]; color: string; explode: V }) {
  return (
    <mesh position={[(at[0] + explode[0]) * S, (at[1] + explode[1]) * S, (at[2] + explode[2]) * S]} castShadow receiveShadow>
      <boxGeometry args={[size[0] * S, size[2] * S, size[1] * S]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

/** Pulls parts outward from the chair's centre for the exploded view. */
const EXPLODE: Record<PartSpec["role"], number> = { leg: 0, post: 0, rail: 6, seat: 14, back: 10, stretcher: 8 };

export function SpecModel({ spec, exploded = false, highlight }: { spec: FurnitureSpec; exploded?: boolean; highlight?: string | null }) {
  const col = WOOD[spec.wood];
  return (
    <group>
      {spec.parts.map((p) => {
        const c = highlight === p.id ? HIGHLIGHT : col;
        const k = exploded ? EXPLODE[p.role] : 0;
        const out = (pt: V): V => (k ? [Math.sign(pt[0]) * k * 0.6, p.role === "seat" ? k : 0, Math.sign(pt[2]) * k * 0.4] : [0, 0, 0]);
        return (
          <group key={p.id}>
            {(p.sticks ?? []).map(([a, b], i) => <Stick key={i} a={a} b={b} w={p.size[1]} t={p.size[2]} color={c} explode={out([(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2])} />)}
            {(p.boards ?? []).map((bd, i) => <Board key={`b${i}`} at={bd.at} size={p.size} color={c} explode={out(bd.at)} />)}
          </group>
        );
      })}
    </group>
  );
}
