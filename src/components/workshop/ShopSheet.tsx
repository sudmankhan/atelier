import { useMemo } from "react";
import { japaneseShop, kangarooShop, ALLOW } from "@/lib/chair/shop";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { useWorkshop } from "./store";

const d = (x: { l: number; w: number; t: number }) => `${x.l} × ${x.w} × ${x.t}`;

export function ShopSheet() {
  const w = useWorkshop();
  const s = useMemo(
    () => (w.typology === "kangaroo" ? kangarooShop(w.params as ChairParams) : japaneseShop(w.params as JapaneseParams)),
    [w.typology, w.params],
  );
  return (
    <div className="space-y-6 p-5 text-xs">
      <div>
        <div className="eyebrow">Cut list · cm (L × W × T)</div>
        <p className="mt-1 text-muted-foreground">
          Rough = what you saw from the board: +{ALLOW.length} length, +{ALLOW.width} width, +{ALLOW.thickness} thickness, then plane down to finished. About <span className="font-mono text-foreground">{s.boardFeet} board feet</span> of rough timber before waste.
        </p>
        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr className="text-left text-[10px] text-measure">
              <th className="pb-1 font-normal">Part</th>
              <th className="pb-1 pr-2 font-normal">Qty</th>
              <th className="pb-1 font-normal">Finished</th>
              <th className="pb-1 font-normal">Rough</th>
            </tr>
          </thead>
          <tbody>
            {s.cuts.map((c) => (
              <tr key={c.part} className="border-t hairline align-top">
                <td className="py-1.5 pr-2">
                  {c.part}
                  {c.note && <div className="text-[10px] text-muted-foreground">{c.note}</div>}
                </td>
                <td className="py-1.5 pr-2 font-mono">{c.qty}</td>
                <td className="py-1.5 pr-2 whitespace-nowrap font-mono text-[10px]">{d(c.finished)}</td>
                <td className="py-1.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">{d(c.rough)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="eyebrow">Angle schedule</div>
        <ul className="mt-2 space-y-3">
          {s.angles.map((a) => (
            <li key={a.op} className="rounded-lg bg-secondary/50 p-3">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{a.op}</span>
                {a.angle > 0 && <span className="font-mono text-teal">{a.angle}°</span>}
              </div>
              <div className="mt-1 font-mono text-[11px]">{a.setting}</div>
              <p className="mt-1 text-muted-foreground">{a.why}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-measure">Always check angles against a full-size drawing and a dry fit before cutting the good stock.</p>
      </div>
    </div>
  );
}
