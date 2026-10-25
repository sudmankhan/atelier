// A piece of furniture described as data: parts, sizes, where they sit, and the build order.
// One file per piece in src/data/furniture/. The engine (engine.ts) turns any valid file into the
// 3D model, cut list, lumber fit, tests and assembly game — no new code per piece.
// v1 handles furniture made of straight parts only (sticks and flat boards).
import { z } from "zod";
import nordicLadderBack from "@/data/furniture/nordic-ladder-back.json";

const P3 = z.tuple([z.number(), z.number(), z.number()]);

export const PartSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    /** what the part does; drives the tests (legs and posts carry the chair, a seat sets the sitting height…) */
    role: z.enum(["leg", "post", "rail", "seat", "back", "stretcher"]),
    /** finished size in cm: [length along the grain, width, thickness] */
    size: z.tuple([z.number().positive(), z.number().positive(), z.number().positive()]),
    note: z.string().default(""),
    /** straight members: [from, to] centreline points; width runs sideways, thickness runs up */
    sticks: z.array(z.tuple([P3, P3])).optional(),
    /** flat boards: centre point; length along x, width along z, thickness along y */
    boards: z.array(z.object({ at: P3 })).optional(),
  })
  .refine((p) => (p.sticks?.length ?? 0) + (p.boards?.length ?? 0) > 0, { message: "a part needs at least one stick or board" });

export const StepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  needs: z.array(z.object({ id: z.string(), why: z.string() })).default([]),
});

export const FurnitureSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    category: z.literal("Chairs"),
    style: z.string().min(1),
    description: z.string(),
    source: z.string(),
    verified: z.boolean(),
    wood: z.enum(["oak", "ash", "walnut", "pine"]),
    joint: z.enum(["mt", "wedged", "dowel"]),
    units: z.string().optional(),
    parts: z.array(PartSchema).min(1),
    steps: z.array(StepSchema).min(2),
  })
  .superRefine((f, ctx) => {
    const ids = new Set(f.steps.map((s) => s.id));
    for (const s of f.steps) for (const n of s.needs) if (!ids.has(n.id)) ctx.addIssue({ code: "custom", message: `step "${s.id}" needs unknown step "${n.id}"` });
    if (!f.parts.some((p) => p.role === "seat")) ctx.addIssue({ code: "custom", message: "a chair needs a part with role \"seat\"" });
    if (!f.parts.some((p) => p.role === "leg" || p.role === "post")) ctx.addIssue({ code: "custom", message: "a chair needs legs" });
  });

export type FurnitureSpec = z.infer<typeof FurnitureSchema>;
export type PartSpec = z.infer<typeof PartSchema>;

/** Raw files, as written. Adding a piece = adding a JSON file here. */
export const RAW_FILES: Record<string, { path: string; data: unknown }> = {
  "nordic-ladder-back": { path: "src/data/furniture/nordic-ladder-back.json", data: nordicLadderBack },
};

/** Every valid piece, parsed and checked once at load. */
export const SPECS: FurnitureSpec[] = Object.values(RAW_FILES).map((f) => FurnitureSchema.parse(f.data));
export const specById = (id: string) => SPECS.find((s) => s.id === id) ?? null;
