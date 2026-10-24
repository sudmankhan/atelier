// Dev-only fix: TanStack devtools adds `data-tsd-source="file:line"` to every JSX element,
// including R3F elements like <mesh>. R3F treats dashed props as nested paths
// (obj.data["tsd-source"]) and throws when `data` is missing. This gives Three objects a
// harmless per-instance `data` bag so the tag is stored and ignored. No effect on rendering.
import * as THREE from "three";

const KEY = Symbol.for("fg.tsdData");
for (const proto of [THREE.Object3D.prototype, THREE.Material.prototype, THREE.BufferGeometry.prototype, THREE.Texture.prototype] as object[]) {
  if (Object.prototype.hasOwnProperty.call(proto, "data")) continue;
  Object.defineProperty(proto, "data", {
    configurable: true,
    get(this: Record<symbol, unknown>) {
      return (this[KEY] ??= {}) as Record<string, unknown>;
    },
  });
}
