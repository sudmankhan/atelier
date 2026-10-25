import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { WOODS, type ChairParams } from "@/lib/chair/params";

/** Freeze the live chair mesh before its canvas is removed for the AR dialog. */
export function snapshotChair(source: THREE.Group, params?: ChairParams): THREE.Group {
  const copy = source.clone(true);
  // Part groups can be midway through the Explode animation. AR always shows the assembled chair.
  for (const part of copy.children) part.position.set(0, 0, 0);
  copy.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const original = object.material as THREE.MeshStandardMaterial;
    const cane = Boolean(params && original.alphaTest > 0);
    object.material = new THREE.MeshStandardMaterial({
      color: params ? (cane ? "#cbb78e" : WOODS[params.wood].base) : original.color,
      roughness: params ? 0.7 : original.roughness,
      side: cane ? THREE.DoubleSide : THREE.FrontSide,
    });
  });
  return copy;
}

export async function exportSnapshotGlb(group: THREE.Group): Promise<Blob> {
  const data = await new GLTFExporter().parseAsync(group, { binary: true });
  if (!(data instanceof ArrayBuffer)) throw new Error("Expected a binary GLB");
  return new Blob([data], { type: "model/gltf-binary" });
}

export function disposeSnapshot(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) (object.material as THREE.Material).dispose();
  });
  // Mesh geometry is shared with the live chair and is owned by React Three Fiber.
}
