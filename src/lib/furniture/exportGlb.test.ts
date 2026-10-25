import { describe, expect, it } from "vitest";
import { Box3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { exportSpecGlb } from "./exportGlb";
import { resizeSpec } from "./engine";
import { specById } from "./spec";

const nordic = specById("nordic-ladder-back")!;
const readBuffer = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

describe("AR chair export", () => {
  it("round-trips a GLB at the real chair height in metres, including a resized chair", async () => {
    for (const [spec, expectedHeight] of [
      [nordic, 0.88],
      [resizeSpec(nordic, { seatHeight: 50, backHeight: 55 }), 1.05],
    ] as const) {
      const glb = await exportSpecGlb(spec);
      expect(glb.type).toBe("model/gltf-binary");
      const loaded = await new GLTFLoader().parseAsync(await readBuffer(glb), "");
      const bounds = new Box3().setFromObject(loaded.scene);
      expect(bounds.min.y).toBeCloseTo(0, 4);
      expect(bounds.max.y - bounds.min.y).toBeCloseTo(expectedHeight, 2);
    }
  });
});
