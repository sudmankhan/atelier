// Where will the chair live? Indoors, a covered porch, or out in the open. Outdoors, wood gets wet, rots,
// swells and shrinks much more, and glue, screws and finish wear out. This gives honest warnings about what
// will fail first. It does NOT predict a number of years: no data source can honestly promise that.
import type { LabResult } from "./lab";
import { DEFAULT_DELTA_MC, movementMm } from "./chair/movement";
import type { WoodId } from "./chair/woodProperties";

export type Setting = "indoor" | "covered" | "outdoor";
export const SETTINGS: { id: Setting; label: string; hint: string }[] = [
  { id: "indoor", label: "Indoors", hint: "Inside a heated home." },
  { id: "covered", label: "Covered porch", hint: "Outside but under a roof: damp air, no rain on it." },
  { id: "outdoor", label: "Outdoors", hint: "Rain, sun and frost." },
];

/**
 * Seasonal moisture swing in percentage points. Indoors: Wood Handbook Table 13–2 (6–10% MC).
 * Covered and outdoors: an ASSUMPTION for teaching (damp winters to dry summers), not a Handbook value.
 */
export const DELTA_MC: Record<Setting, number> = { indoor: DEFAULT_DELTA_MC, covered: 8, outdoor: 12 };

/**
 * Natural rot resistance of the heartwood, as grouped in the USDA Wood Handbook (Ch. 14, Biodeterioration,
 * table of heartwood decay resistance). Sapwood of every species is non-resistant.
 * TODO(verify): page number not yet confirmed against FPL-GTR-282.
 */
export const DECAY: Record<WoodId, { group: "resistant" | "moderate" | "non"; label: string }> = {
  oak: { group: "resistant", label: "resistant" },
  walnut: { group: "resistant", label: "resistant" },
  teak: { group: "resistant", label: "very resistant" },
  pine: { group: "moderate", label: "moderately resistant" },
  ash: { group: "non", label: "slightly or non-resistant" },
};
export const DECAY_SOURCE = "USDA Wood Handbook, Ch. 14";

const NAME: Record<WoodId, string> = { oak: "White oak", ash: "Ash", walnut: "Walnut", pine: "Pine", teak: "Teak" };
const r1 = (n: number) => Math.round(n * 10) / 10;

export interface WeatherInput { wood: WoodId; joint: "mt" | "wedged" | "dowel" | "screw"; seatWidthCm: number }

export function weatherResults(c: WeatherInput, setting: Setting): LabResult[] {
  if (setting === "indoor") {
    return [{ area: "Weather", level: "good", basis: "rule", title: "Indoors: no rot risk", detail: "Kept dry indoors, wood doesn't rot. What wears first is the joints (from rocking) and the finish (from use). Re-glue a loose joint early and it lasts for generations." }];
  }
  const out: LabResult[] = [];
  const d = DECAY[c.wood];
  const where = setting === "covered" ? "on a covered porch" : "outdoors";
  out.push(
    d.group === "resistant"
      ? { area: "Weather", level: "good", basis: "rule", title: `${NAME[c.wood]} resists rot`, detail: `Its heartwood is ${d.label} to decay (${DECAY_SOURCE}). Use heartwood only: the pale sapwood rots like any other wood.` }
      : d.group === "moderate"
        ? { area: "Weather", level: setting === "covered" ? "warn" : "bad", basis: "rule", title: `${NAME[c.wood]} rots ${where} without protection`, detail: `Its heartwood is only ${d.label} to decay (${DECAY_SOURCE}). Keep it finished and off wet ground, or pick white oak or walnut.` }
        : { area: "Weather", level: "bad", basis: "rule", title: `${NAME[c.wood]} rots ${where}`, detail: `Its heartwood is ${d.label} to decay (${DECAY_SOURCE}). Great indoors, a poor choice outside: pick white oak or walnut.` },
  );
  const inside = movementMm(c.seatWidthCm, c.wood, DELTA_MC.indoor);
  const here = movementMm(c.seatWidthCm, c.wood, DELTA_MC[setting]);
  out.push({ area: "Weather", level: "warn", basis: "assumption", title: `Seat swells and shrinks ≈ ${r1(here)} mm a year`, detail: `A ${Math.round(c.seatWidthCm)} cm wide flatsawn seat moves about ${r1(here)} mm across the grain ${where}, versus ${r1(inside)} mm indoors (Wood Handbook Eq. 13–2, assuming a ${DELTA_MC[setting]}-point moisture swing). Joints loosen faster: never glue a wide seat in tight.` });
  out.push(
    c.joint === "screw"
      ? { area: "Weather", level: "warn", basis: "rule", title: "Use stainless screws", detail: "Ordinary steel screws rust, stain the wood black and loosen. Stainless or coated outdoor screws only." }
      : { area: "Weather", level: "warn", basis: "rule", title: "Use waterproof glue", detail: "Ordinary wood glue softens when it stays wet. Use a waterproof glue (rated for outdoor use) or epoxy." },
  );
  if (setting === "outdoor") {
    out.push({ area: "Weather", level: "warn", basis: "rule", title: "Feet soak up water", detail: "Leg ends are end grain and drink water like straws, so rot starts at the feet. Seal the end grain, add small feet or pads, and keep it off wet grass." });
    out.push({ area: "Weather", level: "warn", basis: "rule", title: "Finish needs redoing", detail: "Sun breaks down finish and greys the wood. Re-coat with an outdoor oil or varnish whenever it looks dry or grey, or let a rot-resistant wood go silver on purpose." });
  }
  return out;
}
