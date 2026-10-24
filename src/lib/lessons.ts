import type { PartId } from "@/lib/chair/parts";

export type CameraPreset = "three" | "front" | "side" | "back" | "top";

export interface WalkStep {
  title: string;
  body: string;
  part: PartId | null;
  view: CameraPreset;
  dims?: boolean;
}

export const WALKTHROUGH: WalkStep[] = [
  {
    title: "A chair for a new city",
    body: "The Kangaroo chair is associated with Pierre Jeanneret's furniture for Chandigarh — a modernist capital built from scratch in the 1950s. Its furniture used local teak and cane, and favoured simple construction that local workshops could repeat.",
    part: null,
    view: "three",
  },
  {
    title: "Low lounge proportions",
    body: "Notice how close the seat is to the floor. A low seat, a deep seat plane and a reclined back together say: this chair is for resting, not for working at a table.",
    part: "seat",
    view: "side",
    dims: true,
  },
  {
    title: "The Z-shaped side frame",
    body: "Each side is a single flowing line — front leg, seat support and back post — with a rear support kicking back like a tail. This frame is both structure and the whole visual identity.",
    part: "sideFrame",
    view: "side",
  },
  {
    title: "Seat meets back",
    body: "The interior angle between the seat plane and the backrest sets the posture. The seat also slopes slightly toward the back, settling the sitter into the recline.",
    part: "backrest",
    view: "side",
    dims: true,
  },
  {
    title: "Teak and woven cane",
    body: "A dense, durable hardwood frame paired with a light, breathable cane skin. The cane keeps the chair visually light and lets the surfaces flex a little.",
    part: "cane",
    view: "three",
  },
  {
    title: "Shaped components",
    body: "The curves of the frame have to come from somewhere: sawn from wide boards (creating short grain at the bends) or bent. Each choice affects strength, waste and labour.",
    part: "sideFrame",
    view: "three",
  },
  {
    title: "Why joinery matters",
    body: "Every rail, seat and backrest meets the side frames at an angle inherited from the frame. Change the geometry and every joint must be re-laid out. That's why designers think about joints before they finalise the form.",
    part: "connections",
    view: "three",
  },
];

export interface BuildStep {
  title: string;
  body: string;
  visible: PartId[];
  focus: PartId | null;
  quiz?: { q: string; options: string[]; answer: number; explain: string };
}

export const BUILD_STEPS: BuildStep[] = [
  {
    title: "Understand the components",
    body: "Before cutting anything, a maker lists every part: two side frames, connecting rails, a seat frame, a backrest frame, woven cane, and the joints between them. Here they float apart so you can study each one.",
    visible: ["sideFrame", "rails", "seat", "backrest", "cane", "connections"],
    focus: null,
    quiz: {
      q: "Which part sets the seat height, recline and footprint all at once?",
      options: ["The seat frame", "The side frames", "The cane"],
      answer: 1,
      explain: "All three dimensions live in the side-frame profile.",
    },
  },
  {
    title: "The side frames",
    body: "The side frames go on the bench first — everything else is measured from them. They are mirror images, typically made from one full-size template.",
    visible: ["sideFrame"],
    focus: "sideFrame",
    quiz: {
      q: "Why work from one full-size template?",
      options: ["So both frames match exactly", "To save glue", "So the cane fits loosely"],
      answer: 0,
      explain: "Any difference between the two frames would twist the chair.",
    },
  },
  {
    title: "Position the supports",
    body: "Stand the frames parallel at the seat width. Check that front and rear feet line up — this sets the footprint the chair stands on.",
    visible: ["sideFrame"],
    focus: "sideFrame",
  },
  {
    title: "Add the connecting rails",
    body: "Rails tie the frames together and stop them racking. Their shoulders must be cut to the angle of the support they meet.",
    visible: ["sideFrame", "rails", "connections"],
    focus: "rails",
    quiz: {
      q: "If the seat gets wider, what happens to the rails?",
      options: ["Nothing", "They get longer", "They get thicker"],
      answer: 1,
      explain: "Rail length equals the clear width between the frames.",
    },
  },
  {
    title: "Add the seat structure",
    body: "The seat frame drops between the side frames at a slight backward slope. Keep it flat and square so the cane will tension evenly.",
    visible: ["sideFrame", "rails", "connections", "seat"],
    focus: "seat",
  },
  {
    title: "Add the backrest",
    body: "The backrest frame fits between the back posts. Its angle comes from the side frames — the panel just follows.",
    visible: ["sideFrame", "rails", "connections", "seat", "backrest"],
    focus: "backrest",
    quiz: {
      q: "What decides the backrest angle?",
      options: ["The backrest panel", "The side-frame back post", "The cane tension"],
      answer: 1,
      explain: "The panel hangs between the posts; the frame sets the angle.",
    },
  },
  {
    title: "The cane surface",
    body: "Cane is typically woven damp and tightens as it dries, so the frames must be stiff and square before caning begins.",
    visible: ["sideFrame", "rails", "connections", "seat", "backrest", "cane"],
    focus: "cane",
    quiz: {
      q: "Why must the frame be stiff before caning?",
      options: ["Cane shrinks tight as it dries", "Cane is heavy", "For colour"],
      answer: 0,
      explain: "Drying cane pulls hard on the frame.",
    },
  },
  {
    title: "Inspect the completed assembly",
    body: "Rotate the chair and click any part to review it. Then try the exploded view to see how everything fits. This is a virtual, educational assembly — not a certified set of building instructions.",
    visible: ["sideFrame", "rails", "connections", "seat", "backrest", "cane"],
    focus: null,
  },
];
