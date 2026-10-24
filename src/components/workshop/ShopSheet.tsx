import { useMemo } from "react";
import { Printer } from "lucide-react";
import { japaneseShop, kangarooShop, ALLOW } from "@/lib/chair/shop";
import type { ChairParams } from "@/lib/chair/params";
import type { JapaneseParams } from "@/lib/chair/japanese/params";
import { useWorkshop } from "./store";
import { ProvenanceBadge } from "./ProvenanceBadge";

const d = (x: { l: number; w: number; t: number }) => `${x.l} × ${x.w} × ${x.t}`;
const esc = (v: unknown) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type Shop = ReturnType<typeof kangarooShop>;

/** Builds a one-page printable shop sheet from the same cut list and angle schedule shown in the tab. */
function printShopPack(title: string, params: Record<string, unknown>, s: Shop) {
  const settings = Object.entries(params).map(([k, v]) => `<span>${esc(k)}: <b>${esc(v)}</b></span>`).join(" · ");
  const rows = s.cuts.map((c) => `<tr><td>${esc(c.part)}${c.note ? `<div class="n">${esc(c.note)}</div>` : ""}</td><td>${c.qty}</td><td>${esc(d(c.finished))}</td><td>${esc(d(c.rough))}</td><td class="box"></td></tr>`).join("");
  const angles = s.angles.map((a) => `<tr><td>${esc(a.op)}</td><td>${a.angle > 0 ? `${a.angle}°` : ""}</td><td>${esc(a.setting)}<div class="n">${esc(a.why)}</div></td><td class="box"></td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} — shop sheet</title><style>
    body{font:12px/1.45 system-ui,sans-serif;color:#222;margin:24px}h1{font:600 20px Georgia,serif;margin:0}h2{font:600 14px Georgia,serif;margin:22px 0 6px}
    .meta{color:#555;margin:4px 0 0}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ccc;padding:5px 6px;text-align:left;vertical-align:top}
    th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666}.n{color:#666;font-size:10px}.box{width:18px;border:1px solid #999}
    .foot{margin-top:18px;color:#666;font-size:10px}</style></head><body>
    <h1>${esc(title)} — shop sheet</h1><p class="meta">FORM &amp; GRAIN · ${esc(new Date().toLocaleDateString())} · ${settings}</p>
    <h2>Cut list (cm, length × width × thickness) — about ${s.boardFeet} board feet rough</h2>
    <table><thead><tr><th>Part</th><th>Qty</th><th>Finished</th><th>Rough (saw to this)</th><th>✓</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="n">Rough = +${ALLOW.length} cm length, +${ALLOW.width} width, +${ALLOW.thickness} thickness, then plane down to finished.</p>
    <h2>Saw and drill angles</h2>
    <table><thead><tr><th>Operation</th><th>Angle</th><th>Setting · why</th><th>✓</th></tr></thead><tbody>${angles}</tbody></table>
    <p class="foot">Check every angle against a full-size drawing and a dry fit before cutting good stock. Educational reconstruction — not a certified plan.</p>
    </body></html>`;
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const doc = f.contentWindow?.document;
  if (!doc) return;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); setTimeout(() => f.remove(), 1000); }, 200);
}

export function ShopSheet() {
  const w = useWorkshop();
  const s = useMemo(
    () => (w.typology === "kangaroo" ? kangarooShop(w.params as ChairParams) : japaneseShop(w.params as JapaneseParams)),
    [w.typology, w.params],
  );
  return (
    <div className="space-y-6 p-5 text-xs">
      <button
        onClick={() => printShopPack(w.typology === "kangaroo" ? "Kangaroo-inspired lounge chair" : "Kuro spindle-back armchair", w.params as unknown as Record<string, unknown>, s)}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:opacity-90"
      >
        <Printer className="h-4 w-4" /> Print shop sheet
      </button>
      <div>
        <div className="flex items-center justify-between gap-2"><div className="eyebrow">Cut list · cm (L × W × T)</div><ProvenanceBadge kind="calculated" topic="shop" /></div>
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
