import type { JPartId } from "./japanese/parts";

export type PartId = "sideFrame" | "seat" | "backrest" | "rails" | "cane" | "connections";
export type AnyPartId = PartId | JPartId;

export interface PartInfo {
  id: PartId;
  name: string;
  purpose: string;
  material: string;
  relationships: string;
  observations: string[];
  challenges: string[];
  /** keys of measurement functions rendered in the Inspect tab */
  measures: string[];
}

export const PART_ORDER: PartId[] = ["sideFrame", "seat", "backrest", "rails", "cane", "connections"];

export const PARTS: Record<PartId, PartInfo> = {
  sideFrame: {
    id: "sideFrame",
    name: "Side frame",
    purpose:
      "The two side frames are the chair's defining structure. Each one carries the front leg, the seat support and the back post in a single flowing line, with a rear support kicking back toward the floor — the stance that gives the Kangaroo its name.",
    material: "Solid teak, shaped from wide boards so the curves follow the grain as closely as possible.",
    relationships:
      "Receives the connecting rails, carries the seat and backrest panels, and determines the seat height, recline and footprint of the whole chair.",
    observations: [
      "The Z-like profile reads as one gesture rather than a collection of legs — the frame is both structure and ornament.",
      "Because seat height, recline and footprint all live in this single part, changing any one of them reshapes it.",
    ],
    challenges: [
      "Curved parts cut from straight boards create short grain at the bends, where the wood is weakest.",
      "Both frames must be identical mirror images; makers typically work from a full-size template.",
    ],
    measures: ["seatHeight", "frontLegLength", "rearLegAngle", "backRecline"],
  },
  seat: {
    id: "seat",
    name: "Seat",
    purpose: "A light timber frame that holds the woven cane and spans between the side frames at a low lounging height.",
    material: "Teak frame members with a woven cane infill.",
    relationships: "Sits on the side frames, sets the seat plane that the backrest angle is measured from, and carries the seat cane.",
    observations: [
      "The seat slopes slightly toward the back, which settles the sitter into the backrest.",
      "A low, deep seat signals lounging rather than upright work or dining.",
    ],
    challenges: [
      "The frame corners must stay square and flat so the cane tensions evenly.",
      "Cane holes or a spline groove need consistent spacing around the inner edge.",
    ],
    measures: ["seatWidth", "seatDepth", "seatHeight"],
  },
  backrest: {
    id: "backrest",
    name: "Backrest",
    purpose: "A reclined caned panel carried between the back posts, supporting the upper back in a relaxed posture.",
    material: "Teak frame with woven cane infill.",
    relationships: "Hangs between the back posts of the side frames; its angle is set by the side frames, not by the panel itself.",
    observations: [
      "The interior angle between seat and back is what makes the chair read as a lounge chair.",
      "Cane lets the back flex slightly and breathe.",
    ],
    challenges: [
      "Its joints meet the back posts at an angle, so any change in recline changes those joint angles too.",
    ],
    measures: ["backAngle", "backRecline", "overallHeight"],
  },
  rails: {
    id: "rails",
    name: "Connecting rails",
    purpose: "Horizontal stretchers tie the two side frames together and keep them parallel, so the chair resists racking side to side.",
    material: "Straight-grained teak, round or rounded-rectangular in section.",
    relationships: "Their length equals the clear width between the side frames; their height and angle follow the legs they join.",
    observations: [
      "Low rails keep the side profile visually clean while still triangulating the structure.",
    ],
    challenges: [
      "Where a rail meets a sloping support, its shoulder has to be cut to that angle.",
      "All rails of one set must be exactly the same length or the frames go out of parallel.",
    ],
    measures: ["railLength", "footprintWidth"],
  },
  cane: {
    id: "cane",
    name: "Woven cane surface",
    purpose: "A woven skin of rattan cane on the seat and back that is light, flexible and breathable.",
    material: "Rattan cane, woven by hand through holes or set in as pre-woven sheet with a spline.",
    relationships: "Stretched across the seat and backrest frames; its area grows with seat width and depth.",
    observations: [
      "The open weave keeps the chair visually light against the heavier teak frame.",
    ],
    challenges: [
      "Cane is typically worked damp and tightens as it dries — the frame must be stiff enough to take that tension.",
      "Worn cane is replaced over the life of the chair, so the frame should allow re-caning.",
    ],
    measures: ["caneArea"],
  },
  connections: {
    id: "connections",
    name: "Structural connections",
    purpose: "The joints where rails, seat and backrest meet the side frames. In a solid-wood chair these are typically mortise-and-tenon or dowelled joints.",
    material: "Teak, glued; joint geometry follows the angles of the parts that meet.",
    relationships: "Every connection inherits its angle from the side frame. Change the frame and the joint angles change with it.",
    observations: [
      "In this educational model the joints are shown as small caps on the outside of the frame.",
      "Note: this is a simplified reconstruction — it does not document the original chair's actual joinery.",
    ],
    challenges: [
      "Angled tenons and shoulders must be laid out from the real part geometry.",
      "A chair is racked every time someone sits or leans; joint fit matters more than in a cabinet.",
    ],
    measures: ["rearJointAngle", "frontJointAngle"],
  },
};
