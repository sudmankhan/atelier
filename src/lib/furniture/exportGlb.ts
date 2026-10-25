import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { buildSpecGroup, disposeSpecGroup } from "./modelGeometry";
import type { FurnitureSpec } from "./spec";

export async function exportSpecGlb(spec: FurnitureSpec): Promise<Blob> {
  const group = buildSpecGroup(spec);
  try {
    const data = await new GLTFExporter().parseAsync(group, { binary: true });
    if (!(data instanceof ArrayBuffer)) throw new Error("Expected a binary GLB");
    return new Blob([data], { type: "model/gltf-binary" });
  } finally {
    disposeSpecGroup(group);
  }
}
