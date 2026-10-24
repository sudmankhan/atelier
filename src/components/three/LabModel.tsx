// 3D model generated from a Component Lab design. Units: cm in, metres out (×0.01).
// Joints are drawn as real tenons / dowels / wedges / screws; "x-ray" makes the wood see-through.
import "./r3fDevSourceShim";
import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { labJointSize, type LabDesign } from "@/lib/lab";
import { labRearPivotZ } from "@/lib/statics";

const S = 0.01;
type V = [number, number, number];
const WOOD_COLOR: Record<LabDesign["wood"], string> = { oak: "#c49a62", ash: "#d8c29a", walnut: "#6b4a33", pine: "#e1c38c" };
const JOINT_COLOR = { mt: "#547D75", wedged: "#547D75", dowel: "#66859A", screw: "#8a8f94" } as const;

const v = (a: V) => new THREE.Vector3(a[0] * S, a[1] * S, a[2] * S);

function Member({ a, b, t, w, color, xray, round }: { a: V; b: V; t: number; w?: number; color: string; xray: boolean; round?: boolean }) {
  const { pos, quat, len } = useMemo(() => {
    const A = v(a), B = v(b);
    const dir = B.clone().sub(A);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: A.add(B).multiplyScalar(0.5), quat: q, len: dir.length() };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow receiveShadow>
      {round ? <cylinderGeometry args={[(t / 2) * S, (t / 2) * S, len, 16]} /> : <boxGeometry args={[(w ?? t) * S, len, t * S]} />}
      <meshStandardMaterial color={color} roughness={0.7} transparent={xray} opacity={xray ? 0.28 : 1} depthWrite={!xray} />
    </mesh>
  );
}

/** A joint: the hidden part (tenon, dowel, wedge or screw) at point p, entering along dir. */
function Joint({ p, dir, d, xray, label }: { p: V; dir: V; d: LabDesign; xray: boolean; label?: string }) {
  const color = JOINT_COLOR[d.joint];
  const { len, t, w, round } = labJointSize(d);
  const b: V = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
  return (
    <group>
      {xray && <Member a={p} b={b} t={t} w={round ? undefined : w} color={color} xray={false} round={round} />}
      {xray && d.joint === "wedged" && <Member a={b} b={[b[0] + dir[0] * 0.6, b[1] + dir[1] * 0.6, b[2] + dir[2] * 0.6]} t={0.3} w={t * 1.6} color="#3a2a1e" xray={false} />}
      {!xray && (
        <mesh position={v(p)}>
          <sphereGeometry args={[0.009, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      )}
      {label && xray && (
        <Html position={v(b)} center distanceFactor={2.2} zIndexRange={[5, 0]}>
          <div className="dim-label whitespace-nowrap">{label}</div>
        </Html>
      )}
    </group>
  );
}

export function LabModel({ d, xray, tipping }: { d: LabDesign; xray: boolean; tipping: boolean }) {
  const col = WOOD_COLOR[d.wood];
  const W = d.seatWidth, D = d.seatDepth, H = d.seatHeight, T = d.legThickness;
  const hx = W / 2 - T, fz = D / 2 - T, rz = -D / 2 + T;
  const seatT = 3;
  const top = H - seatT;
  const sp = Math.tan((d.splay * Math.PI) / 180) * top;
  const jn = d.joint === "mt" ? "Mortise & tenon" : d.joint === "wedged" ? "Wedged tenon" : d.joint === "dowel" ? "Dowel" : "Screw";

  const parts: React.ReactNode[] = [];
  const joints: React.ReactNode[] = [];
  const legs: { top: V; foot: V }[] = [];

  if (d.base === "four" || d.base === "splayed") {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const z = sz > 0 ? fz : rz;
      const t: V = [sx * hx, top, z];
      const f: V = [sx * (hx + sp), 0, z + sz * sp];
      legs.push({ top: t, foot: f });
    }
    legs.forEach((l, i) => {
      parts.push(<Member key={`leg${i}`} a={l.foot} b={l.top} t={T} color={col} xray={xray} round={d.base === "splayed"} />);
      joints.push(<Joint key={`lj${i}`} p={l.top} dir={[0, 1, 0]} d={d} xray={xray} label={i === 0 ? `${jn} · leg → seat` : undefined} />);
    });
    if (d.stretchers) {
      const at = (l: { top: V; foot: V }, k: number): V => [l.foot[0] + (l.top[0] - l.foot[0]) * k, l.foot[1] + (l.top[1] - l.foot[1]) * k, l.foot[2] + (l.top[2] - l.foot[2]) * k];
      const k = 0.35;
      const [a, b, c, e] = legs as [typeof legs[0], typeof legs[0], typeof legs[0], typeof legs[0]];
      // a=(-,rear) b=(-,front) c=(+,rear) e=(+,front)
      parts.push(<Member key="s1" a={at(a, k)} b={at(b, k)} t={2.2} color={col} xray={xray} round />);
      parts.push(<Member key="s2" a={at(c, k)} b={at(e, k)} t={2.2} color={col} xray={xray} round />);
      parts.push(<Member key="s3" a={at(a, k)} b={at(c, k)} t={2.2} color={col} xray={xray} round />);
      joints.push(<Joint key="sj" p={at(a, k)} dir={[0, 0, 1]} d={d} xray={xray} label={xray ? "Stretcher joint" : undefined} />);
    }
  } else if (d.base === "sled") {
    for (const sx of [-1, 1]) {
      const x = sx * hx;
      const ff: V = [x, 0, fz + 2], rf: V = [x, 0, rz - 6];
      parts.push(<Member key={`rf${sx}`} a={[x, top, fz]} b={ff} t={T} color={col} xray={xray} />);
      parts.push(<Member key={`rr${sx}`} a={[x, top, rz]} b={rf} t={T} color={col} xray={xray} />);
      parts.push(<Member key={`run${sx}`} a={ff} b={rf} t={T} color={col} xray={xray} />);
      joints.push(<Joint key={`sj${sx}`} p={[x, top, fz]} dir={[0, 1, 0]} d={d} xray={xray} label={sx < 0 ? `${jn} · post → seat` : undefined} />);
      joints.push(<Joint key={`sk${sx}`} p={ff} dir={[0, 1, 0]} d={d} xray={xray} />);
    }
    parts.push(<Member key="sx" a={[-hx, 1.5, rz - 4]} b={[hx, 1.5, rz - 4]} t={2.2} color={col} xray={xray} round />);
  } else {
    // Z-frame: front leg straight down, rear support runs from back post down behind the seat.
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 - 1.9);
      parts.push(<Member key={`zf${sx}`} a={[x, 0, fz + 2]} b={[x, top, fz]} t={3.8} color={col} xray={xray} />);
      parts.push(<Member key={`zr${sx}`} a={[x, top + 14, rz + 2]} b={[x, 0, rz - 16]} t={3.8} color={col} xray={xray} />);
      joints.push(<Joint key={`zj${sx}`} p={[x, top, fz]} dir={[0, 1, 0]} d={d} xray={xray} label={sx < 0 ? `${jn} · front leg` : undefined} />);
      joints.push(<Joint key={`zk${sx}`} p={[x, top + 2, rz]} dir={[0, 0, 1]} d={d} xray={xray} label={sx < 0 ? "Rear support ↔ seat (most loaded)" : undefined} />);
    }
    parts.push(<Member key="zs" a={[-W / 2 + 3, 8, rz - 10]} b={[W / 2 - 3, 8, rz - 10]} t={2.8} color={col} xray={xray} round />);
  }

  // Seat
  parts.push(
    <mesh key="seat" position={[0, (top + seatT / 2) * S, 0]} castShadow receiveShadow>
      <boxGeometry args={[W * S, seatT * S, D * S]} />
      <meshStandardMaterial color={col} roughness={0.65} transparent={xray} opacity={xray ? 0.28 : 1} depthWrite={!xray} />
    </mesh>,
  );

  // Back
  if (d.back !== "none") {
    const rec = ((d.backAngle - 90) * Math.PI) / 180;
    const bh = d.backHeight;
    const bz = -D / 2 + 1.5;
    const pt = (x: number, k: number): V => [x, H + Math.cos(rec) * bh * k, bz - Math.sin(rec) * bh * k];
    const px = W / 2 - 2;
    parts.push(<Member key="pl" a={pt(-px, 0)} b={pt(-px, 1)} t={3} color={col} xray={xray} />);
    parts.push(<Member key="pr" a={pt(px, 0)} b={pt(px, 1)} t={3} color={col} xray={xray} />);
    parts.push(<Member key="crest" a={pt(-px, 1)} b={pt(px, 1)} t={2.5} w={5} color={col} xray={xray} />);
    joints.push(<Joint key="bp" p={pt(-px, 0)} dir={[0, -1, 0]} d={d} xray={xray} label="Back post → seat (levered open when you lean)" />);
    joints.push(<Joint key="bc" p={pt(px, 1)} dir={[-1, 0, 0]} d={d} xray={xray} />);
    if (d.back === "slats") {
      [0.4, 0.62, 0.84].forEach((k, i) => parts.push(<Member key={`sl${i}`} a={pt(-px, k)} b={pt(px, k)} t={1.6} w={6} color={col} xray={xray} />));
    } else if (d.back === "spindles") {
      const n = 7;
      for (let i = 1; i <= n; i++) {
        const x = -px + (2 * px * i) / (n + 1);
        parts.push(<Member key={`sp${i}`} a={pt(x, 0)} b={pt(x, 1)} t={1.5} color={col} xray={xray} round />);
      }
    } else if (d.back === "panel") {
      const c = pt(0, 0.5);
      parts.push(
        <mesh key="panel" position={v(c)} rotation-x={-rec} castShadow>
          <boxGeometry args={[(2 * px - 3) * S, bh * 0.9 * S, 1.8 * S]} />
          <meshStandardMaterial color={col} roughness={0.65} transparent={xray} opacity={xray ? 0.28 : 1} depthWrite={!xray} />
        </mesh>,
      );
    }
  }

  // Pivot about the rear foot when the design tips backward.
  const rearZ = labRearPivotZ(d);
  return (
    <group position={[0, 0, rearZ * S]} rotation-x={tipping ? -0.22 : 0}>
      <group position={[0, 0, -rearZ * S]}>
        {parts}
        {joints}
      </group>
    </group>
  );
}
