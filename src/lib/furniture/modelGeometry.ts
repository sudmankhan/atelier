// Shared by the interactive model and AR export. Specs are cm; Three.js/glTF are metres.
import * as THREE from "three";
import type { FurnitureSpec, PartSpec } from "./spec";

export const METRES_PER_CM = 0.01;
export const WOOD_COLORS: Record<FurnitureSpec["wood"], string> = {
  oak: "#c49a62",
  ash: "#d8c29a",
  walnut: "#6b4a33",
  pine: "#e1c38c",
};
type V = [number, number, number];

export function stickShape(a: V, b: V, w: number, t: number) {
  const A = new THREE.Vector3(...a).multiplyScalar(METRES_PER_CM);
  const B = new THREE.Vector3(...b).multiplyScalar(METRES_PER_CM);
  const dir = B.clone().sub(A);
  const len = dir.length();
  if (!Number.isFinite(len) || len <= 0)
    throw new Error("A stick needs two distinct, finite endpoints");
  const y = dir.normalize();
  const hint = Math.abs(y.y) > 0.95 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const x = new THREE.Vector3().crossVectors(y, hint).normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  const matrix = new THREE.Matrix4().makeBasis(x, y, z);
  matrix.setPosition(A.add(B).multiplyScalar(0.5));
  const radius = (w * METRES_PER_CM) / 2;
  return {
    matrix,
    box: [w * METRES_PER_CM, len, t * METRES_PER_CM] as V,
    cylinder: [radius, radius, len, 18] as [number, number, number, number],
  };
}

export const boardSize = (size: PartSpec["size"]): V => [
  size[0] * METRES_PER_CM,
  size[2] * METRES_PER_CM,
  size[1] * METRES_PER_CM,
];

/** Assembled chair only: no explode offsets, selection colors, stage, lights or camera. */
export function buildSpecGroup(spec: FurnitureSpec): THREE.Group {
  const group = new THREE.Group();
  group.name = spec.id;
  const material = new THREE.MeshStandardMaterial({
    color: WOOD_COLORS[spec.wood],
    roughness: 0.7,
  });
  try {
    for (const part of spec.parts) {
      for (const [a, b] of part.sticks ?? []) {
        const shape = stickShape(a, b, part.size[1], part.size[2]);
        const geometry = part.round
          ? new THREE.CylinderGeometry(...shape.cylinder)
          : new THREE.BoxGeometry(...shape.box);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = part.id;
        mesh.applyMatrix4(shape.matrix);
        group.add(mesh);
      }
      for (const board of part.boards ?? []) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...boardSize(part.size)), material);
        mesh.name = part.id;
        mesh.position.set(...board.at).multiplyScalar(METRES_PER_CM);
        group.add(mesh);
      }
    }
    // Leaning/splayed sticks extend slightly beyond their centreline endpoints.
    // Translate, never rescale: put the actual lowest mesh point on the floor.
    const bounds = new THREE.Box3().setFromObject(group);
    if (bounds.isEmpty() || ![...bounds.min, ...bounds.max].every(Number.isFinite))
      throw new Error("Invalid chair bounds");
    const centre = bounds.getCenter(new THREE.Vector3());
    group.position.set(-centre.x, -bounds.min.y, -centre.z);
    group.updateMatrixWorld(true);
    return group;
  } catch (error) {
    disposeSpecGroup(group);
    material.dispose();
    throw error;
  }
}

export function disposeSpecGroup(group: THREE.Group) {
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material])
      materials.add(material);
  });
  materials.forEach((material) => material.dispose());
}
