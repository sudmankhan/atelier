import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Level, P3, StressReport } from "@/lib/chair/stress";

// Scene-only colours
const COL: Record<Level, string> = { ok: "#547D75", watch: "#C9963B", high: "#B5654A" };

function Arrow({ a, b, color }: { a: P3; b: P3; color: string }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    const len = d.length();
    return {
      pos: A.clone().add(B).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()),
      len,
    };
  }, [a, b]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, len * 0.85, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthTest={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0, (s * len * 0.85) / 2, 0]}
          rotation={[s < 0 ? Math.PI : 0, 0, 0]}
        >
          <coneGeometry args={[1.1, 2.6, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

export function StressOverlay({
  report,
  showGrain = true,
  showLabels = true,
  animateKey,
}: {
  report: StressReport;
  showGrain?: boolean;
  showLabels?: boolean;
  animateKey?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  useEffect(() => {
    elapsed.current = 0;
    if (group.current) {
      group.current.visible = animateKey === undefined;
      group.current.scale.setScalar(0.01);
    }
  }, [animateKey]);
  useFrame((_, delta) => {
    if (!group.current || animateKey === undefined) return;
    elapsed.current += Math.min(delta, 0.05);
    group.current.visible = elapsed.current > 1.75;
    const reveal = Math.min(1, Math.max(0, (elapsed.current - 1.75) / 0.45));
    const pulse = reveal < 1 ? 0.8 + Math.sin(reveal * Math.PI) * 0.3 : 1;
    group.current.scale.setScalar(0.01 * pulse);
  });
  return (
    <group ref={group} scale={0.01} renderOrder={10} visible={animateKey === undefined}>
      {showGrain &&
        report.grain.map((g) => (
          <group key={g.id}>
            <Arrow a={g.a} b={g.b} color={g.level === "ok" ? "#8a6a4a" : COL[g.level]} />
            {g.level !== "ok" && (
              <Html
                position={g.b}
                center
                distanceFactor={1.2}
                zIndexRange={[5, 0]}
                style={{ pointerEvents: "none" }}
              >
                <div className="whitespace-nowrap rounded border border-alert bg-card px-1.5 py-0.5 font-mono text-[10px] text-alert">
                  {g.level === "high" ? "short grain" : "runout"} {g.runoutDeg}°
                </div>
              </Html>
            )}
          </group>
        ))}
      {report.pins.map((p) => (
        <group key={p.id} position={p.pos}>
          <mesh>
            <sphereGeometry args={[p.level === "ok" ? 1.6 : 2.4, 16, 12]} />
            <meshBasicMaterial color={COL[p.level]} depthTest={false} transparent opacity={0.9} />
          </mesh>
          {showLabels && (
            <Html
              position={[6, 3, 0]}
              distanceFactor={1.2}
              zIndexRange={[5, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div className="whitespace-nowrap rounded border hairline bg-card/95 px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                <span style={{ color: COL[p.level] }}>●</span> {p.moment} N·m ·{" "}
                {p.ratio === 1
                  ? "original"
                  : `${p.ratio > 1 ? "+" : ""}${Math.round((p.ratio - 1) * 100)}%`}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}
