// Beginner mode: every test result said in everyday words, with what to do about it.
// The real numbers are still one click away.
import type { LabResult } from "./lab";

export interface PlainResult { title: string; detail: string }

export function plainResult(r: LabResult): PlainResult {
  const t = r.title.toLowerCase();
  switch (r.area) {
    case "Stability":
      return r.level === "good"
        ? { title: "Won't tip when you lean back", detail: "Even a hard lean-back doesn't tip it." }
        : r.level === "warn"
          ? { title: "Could tip if you lean back hard", detail: "Fine for normal sitting. To make it safer, move the back legs further back or spread them out." }
          : { title: "Tips over too easily", detail: "A gentle lean-back could tip it. Move the back legs further back, spread them out, or make the back less reclined." };
    case "Joints":
      if (t.includes("screw")) return { title: "Screwed joints work loose", detail: "Screws in a chair loosen with daily rocking. Use a glued joint like a mortise & tenon instead." };
      return r.level === "good"
        ? { title: "Joints are strong enough", detail: "They can take everyday rocking with room to spare." }
        : r.level === "warn"
          ? { title: "Joints may get wobbly over the years", detail: "Strong enough now, but rocking may loosen them. Stretchers or thicker legs help." }
          : { title: "Joints are too weak", detail: "It will get wobbly. Add stretchers, use thicker legs, or pick a stronger joint." };
    case "Parts":
      if (t.includes("thin")) return { title: "Legs are thin", detail: "There's little wood around each joint, so it could split. Make legs a bit thicker." };
      return { title: "Legs stick out a lot", detail: "Very splayed legs trip people and leave weak wood at the seat edge." };
    case "Comfort":
      if (t.includes("knee")) return { title: r.level === "good" ? "Seat height fits your legs" : t.includes("above") ? "Seat is too high for you" : "Seat is low for you", detail: r.level === "good" ? "Feet flat on the floor, no pressure under your thighs." : t.includes("above") ? "The front edge will press under your thighs. Lower the seat." : "Your knees will rise above the seat. Fine for lounging, harder to stand up." };
      if (t.includes("seat height")) return r.level === "good" ? { title: "Seat height fits most adults", detail: "Right for a dining or desk chair. Add your knee height for a personal check." } : { title: r.level === "bad" ? "Seat is much too high or low" : "Seat is a bit high or low", detail: "Most dining chairs are 40–47 cm high. Fine if you want a bar or lounge chair on purpose." };
      if (t.includes("back angle")) return r.level === "good" ? { title: "Comfortable back", detail: "The back leans at a relaxed angle." } : { title: t.includes("°") && Number(t.match(/\d+/)?.[0]) < 95 ? "Back is too straight" : "Back leans too far", detail: Number(t.match(/\d+/)?.[0]) < 95 ? "A back that's straight up pushes you forward. Lean it back a little." : "You'll slide forward without a footrest. Bring it more upright." };
      if (t.includes("stool")) return { title: "It's a stool", detail: "No back means nothing to lean on. Add slats, spindles or a panel." };
      if (t.includes("deep")) return { title: "Seat is deep", detail: "Shorter people can't reach the back. Make the seat shallower." };
      return { title: r.title, detail: r.detail };
    case "Wood movement":
      return { title: "The back panel grows and shrinks", detail: "Wood swells in damp weather and shrinks in dry. Let the panel sit loose in a groove; never glue it in tight." };
    case "Craft":
      return { title: "Unusual mix of parts", detail: "This joint doesn't usually go with this kind of chair. It can work, but makers would do it differently." };
    case "Weather": {
      const mm = r.title.match(/≈ ([\d.]+) mm/)?.[1];
      if (t.startsWith("indoors")) return { title: "Indoors: it won't rot", detail: "Inside it stays dry. Joints and finish wear first; re-glue a loose joint early and it lasts for generations." };
      if (t.includes("resists rot")) return { title: "This wood copes with rain", detail: "It naturally resists rot. Use the darker inner wood, not the pale outer edge." };
      if (t.includes("rots")) return { title: r.level === "bad" ? "This wood rots outside" : "This wood needs protecting outside", detail: "Left out in the weather it will rot. Pick white oak or walnut, or keep the chair indoors." };
      if (mm) return { title: `The seat grows and shrinks about ${mm} mm a year`, detail: "Damp weather makes wood swell, dry weather makes it shrink, far more outside than in. Don't glue a wide seat in tight." };
      if (t.includes("screw")) return { title: "Use rust-proof screws", detail: "Normal screws rust and leave black stains. Buy stainless or outdoor screws." };
      if (t.includes("glue")) return { title: "Use waterproof glue", detail: "Normal wood glue goes soft in the wet. Buy glue labelled for outdoor use." };
      if (t.includes("feet")) return { title: "The feet soak up water", detail: "Rot starts at the bottom of the legs. Seal the ends and keep the chair off wet grass." };
      if (t.includes("finish")) return { title: "Re-coat it now and then", detail: "Sun wears off the finish and turns wood grey. Re-coat with outdoor oil when it looks dry." };
      return { title: r.title, detail: r.detail };
    }
    default:
      return { title: r.title, detail: r.detail };
  }
}
