import * as THREE from "three";
import { WOODS, type WoodId } from "@/lib/chair/params";

const cache = new Map<string, THREE.Texture>();

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function woodTexture(wood: WoodId) {
  const key = `wood-${wood}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { base, dark } = WOODS[wood];
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 128);
  const r = rng(7);
  // grain runs along u (the long axis of tubes / boxes)
  for (let i = 0; i < 90; i++) {
    const y = r() * 128;
    g.strokeStyle = dark;
    g.globalAlpha = 0.08 + r() * 0.22;
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    const amp = 1 + r() * 4;
    const ph = r() * 10;
    for (let x = 0; x <= 512; x += 8) {
      const yy = y + Math.sin(x / (40 + r() * 3) + ph) * amp;
      if (x === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** Octagonal-style open weave on transparent background (use alphaTest). */
export function caneTexture() {
  const hit = cache.get("cane");
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 256);
  g.lineCap = "round";
  const strand = (x1: number, y1: number, x2: number, y2: number, w: number) => {
    g.strokeStyle = "#b8924f";
    g.lineWidth = w + 1.5;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.strokeStyle = "#e3c88f";
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  };
  const step = 32;
  for (let i = -256; i <= 512; i += step) {
    strand(i, 0, i, 256, 4); // vertical
    strand(0, i, 256, i, 4); // horizontal
    strand(i, 0, i + 256, 256, 3); // diagonal
    strand(i, 256, i + 256, 0, 3); // diagonal
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  cache.set("cane", t);
  return t;
}
