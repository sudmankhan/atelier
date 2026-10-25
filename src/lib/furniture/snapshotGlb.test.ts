import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { disposeSnapshot, exportSnapshotGlb, snapshotChair } from "./snapshotGlb";

const readBuffer = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

describe("live chair AR snapshot", () => {
  it("exports centimetre geometry in metres and removes explode offsets", async () => {
    const live = new THREE.Group();
    live.scale.setScalar(0.01);
    const part = new THREE.Group();
    part.position.x = 30;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 88, 4), new THREE.MeshStandardMaterial({ color: "#8a5a33" }));
    mesh.position.y = 44;
    part.add(mesh);
    live.add(part);

    const snapshot = snapshotChair(live);
    const loaded = await new GLTFLoader().parseAsync(await readBuffer(await exportSnapshotGlb(snapshot)), "");
    const bounds = new THREE.Box3().setFromObject(loaded.scene);
    expect(bounds.max.y - bounds.min.y).toBeCloseTo(0.88, 4);
    expect((bounds.max.x + bounds.min.x) / 2).toBeCloseTo(0, 4);
    expect(part.position.x).toBe(30);
    disposeSnapshot(snapshot);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
});
