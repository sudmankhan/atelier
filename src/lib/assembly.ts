// Order-of-operations practice: each operation lists what must already be done,
// and what actually goes wrong in the shop if you skip ahead.
import type { Typology } from "./chair/params";

export interface Op { id: string; label: string; needs: { id: string; why: string }[] }

export const OPS: Record<Typology, Op[]> = {
  kangaroo: [
    { id: "mill", label: "Mill stock flat, square and to thickness", needs: [] },
    { id: "layout", label: "Lay out joints from a full-size drawing", needs: [{ id: "mill", why: "Marking on rough, twisted stock: lines won't be square, so every joint inherits the error." }] },
    { id: "cut", label: "Cut mortises and tenons", needs: [{ id: "layout", why: "Cutting without layout lines means guessing angles — the Z-frame won't close." }] },
    { id: "dry", label: "Dry-fit both side frames", needs: [{ id: "cut", why: "Nothing to fit yet." }] },
    { id: "groove", label: "Groove seat/back frames for cane", needs: [{ id: "mill", why: "Grooving rough stock gives a wandering groove the spline won't seat in." }] },
    { id: "sand", label: "Sand and pre-finish inside faces", needs: [{ id: "dry", why: "Sanding before dry-fit rounds over shoulders, so joints show gaps." }] },
    { id: "glueSides", label: "Glue up the two side frames", needs: [{ id: "dry", why: "Gluing without a dry-fit: if a joint doesn't close, you find out with glue setting — no way back." }, { id: "sand", why: "Inside corners are impossible to sand once glued." }] },
    { id: "glueRails", label: "Glue stretchers between the sides", needs: [{ id: "glueSides", why: "Sides still floppy: the chair racks out of square while the rails set." }] },
    { id: "cane", label: "Weave / fit the cane panels", needs: [{ id: "groove", why: "No groove to hold the cane." }, { id: "glueRails", why: "Cane pulls the frame inward; an unglued frame distorts under that tension." }] },
    { id: "finish", label: "Final finish coats", needs: [{ id: "glueRails", why: "Finish on joint surfaces stops glue from bonding." }] },
  ],
  japanese: [
    { id: "mill", label: "Rive / mill legs, spindles and seat boards", needs: [] },
    { id: "seat", label: "Glue up and flatten the seat slab", needs: [{ id: "mill", why: "Unflattened boards make an uneven slab you can't drill at a true angle." }] },
    { id: "saddle", label: "Saddle (carve) the seat", needs: [{ id: "seat", why: "No slab to carve." }] },
    { id: "drill", label: "Drill leg sockets at the compound angle", needs: [{ id: "seat", why: "Drilling separate boards: the sockets won't line up after glue-up." }] },
    { id: "tenons", label: "Turn/shave round tenons to fit", needs: [{ id: "mill", why: "Nothing to shape." }] },
    { id: "dry", label: "Dry-fit legs and sight the splay", needs: [{ id: "drill", why: "No sockets yet." }, { id: "tenons", why: "No tenons yet." }] },
    { id: "wedge", label: "Glue and wedge legs across the seat grain", needs: [{ id: "dry", why: "Wedging blind: a wrong angle is locked in forever." }, { id: "saddle", why: "Carving after the legs are in — the chair can't be clamped flat, and you'll hit wedges." }] },
    { id: "level", label: "Scribe and level the feet", needs: [{ id: "wedge", why: "Levelling before the legs are fixed — the splay moves and the chair rocks again." }] },
    { id: "back", label: "Fit posts, spindles and crest rail", needs: [{ id: "wedge", why: "The seat needs its legs fixed to stay flat while you drill and fit the back." }] },
    { id: "finish", label: "Urushi / finish coats", needs: [{ id: "back", why: "Finish on tenons stops glue bonding; urushi also needs every surface reachable." }, { id: "level", why: "Cutting feet after finishing exposes raw end grain that wicks moisture." }] },
  ],
};

export interface OrderError { opId: string; label: string; missing: string; why: string }

/** Every op whose prerequisites were not placed before it, with the shop consequence. */
export function evaluateOrder(t: Typology, order: string[]): OrderError[] {
  return evaluateOps(OPS[t], order);
}

/** Same check for any list of steps (used by furniture described in data files). */
export function evaluateOps(ops: Op[], order: string[]): OrderError[] {
  const pos = new Map(order.map((id, i) => [id, i]));
  const errs: OrderError[] = [];
  for (const op of ops) {
    const p = pos.get(op.id);
    if (p === undefined) continue;
    for (const n of op.needs) {
      const q = pos.get(n.id);
      if (q === undefined || q > p) {
        errs.push({ opId: op.id, label: op.label, missing: ops.find((o) => o.id === n.id)?.label ?? n.id, why: n.why });
      }
    }
  }
  return errs;
}

export function shuffled(t: Typology, seed = Date.now()): string[] {
  return shuffleIds(OPS[t].map((o) => o.id), seed);
}

export function shuffleIds(ids: string[], seed = Date.now()): string[] {
  const a = [...ids];
  let s = seed % 2147483647 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
