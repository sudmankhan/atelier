// Everyday meanings for the woodworking and physics words the app uses. Any text shown through
// <Words> gets these as hover explanations, so a total beginner can read every result.
export interface Word { term: string; plain: string; match: RegExp }

const w = (term: string, plain: string, match: RegExp): Word => ({ term, plain, match });

export const WORDS: Word[] = [
  w("Mortise & tenon", "A tongue on the end of one stick (the tenon) glued into a matching hole in another (the mortise). The classic strong chair joint.", /mortise (?:&|and) tenons?/i),
  w("Wedged round tenon", "A round peg on a leg goes through a hole in the seat, then a wedge is hammered into its top so it can never pull out.", /wedged (?:round )?tenons?/i),
  w("Tenon", "The tongue cut on the end of a stick so it slots into a hole in another part.", /\btenons?\b/i),
  w("Mortise", "The rectangular hole a tenon slots into.", /\bmortis(?:e|es|ed)\b/i),
  w("Dowel", "A short round wooden pin glued into holes in both parts to join them.", /\bdowels?\b/i),
  w("Butt joint", "Two parts just pressed end-to-side and held with screws or glue. Quick, but the weakest joint.", /\bbutt(?: joints?)?\b/i),
  w("Racking", "Rocking or shoving the chair sideways, so it tries to fold over like a parallelogram. It's what makes chairs wobbly over time.", /\brack(?:ing|s)?\b/i),
  w("Splay", "Legs angled outward toward the floor. Wider feet = harder to tip.", /\bsplay(?:ed)?\b/i),
  w("Stretcher", "A low bar between two legs that stops them spreading and the chair wobbling.", /\bstretchers?\b/i),
  w("Apron", "A board under the seat edge, joining two legs and framing the seat.", /\baprons?\b/i),
  w("Rail", "A horizontal bar between two uprights.", /\brails?\b/i),
  w("Crest rail", "The top bar of a chair back.", /\bcrest\b/i),
  w("Spindle", "A thin round stick, usually one of several making a chair back.", /\bspindles?\b/i),
  w("Slat", "A flat horizontal board in a chair back.", /\bslats?\b/i),
  w("Grain", "The direction the wood's fibres run, like a bundle of straws. Strong along it, splits easily across it.", /\bgrain\b/i),
  w("Flatsawn", "Board cut so the growth rings run across its face. Moves the most with the seasons.", /\bflatsawn\b/i),
  w("Rough size", "The size to buy and cut before planing it smooth; a little bigger than finished.", /\brough\b/i),
  w("Board feet", "How lumber yards measure wood: a board 12 × 12 × 1 inch is one board foot.", /board feet/i),
  w("Kerf", "The thin slice of wood a saw blade turns into sawdust.", /\bkerf\b|\bsaw cut\b/i),
  w("Dry-fit", "Putting the chair together without glue first, to check everything fits.", /\bdry-fit\b/i),
  w("Newton (N)", "A unit of force. 250 N is about the push of a person leaning back hard; 10 N ≈ the weight of 1 kg.", /\b\d+(?:\.\d+)? ?N\b(?! ?·)/),
  w("N·m (moment)", "A turning effect: force × distance. A long lever makes more of it, which is why tall chairs strain joints more.", /N·m/),
  w("MPa (stress)", "How hard the wood is being squeezed or stretched. The app compares it with what the wood can safely take.", /\bMPa\b/),
  w("Section", "The wood left at a joint, seen end-on. A bigger section spreads the load and is much stronger.", /\bcm³ section\b|\bsection\b/i),
  w("Reference", "The amount of stress this wood can safely take day after day (from US government wood data, with a safety margin).", /\breference\b/i),
  w("Heartwood", "The darker inner wood of a tree. In some species it's naturally rot-resistant; the pale outer sapwood never is.", /\bheartwood\b/i),
  w("Moisture swing", "Wood soaks up and loses water with the weather, so it swells and shrinks. The swing is how much its water content changes over a year.", /moisture swing|moisture/i),
  w("End grain", "The cut end of a stick, where the fibres open like straws. It soaks up water fastest.", /end grain/i),
  w("Recline", "How far the back leans back from straight up.", /\brecline\b/i),
  w("Knee height", "Floor to the back of your knee while sitting, with shoes off. The seat should be about this high.", /knee height/i),
];

export const wordByTerm = (t: string) => WORDS.find((x) => x.term.toLowerCase() === t.toLowerCase() || x.match.test(t));

/** Splits text into plain pieces and glossary hits (first match of each term per text only, to avoid clutter). */
export function splitWords(text: string): (string | { text: string; word: Word })[] {
  const out: (string | { text: string; word: Word })[] = [];
  const used = new Set<string>();
  let rest = text;
  for (;;) {
    let best: { i: number; len: number; word: Word } | null = null;
    for (const word of WORDS) {
      if (used.has(word.term)) continue;
      const m = word.match.exec(rest);
      if (m && (best === null || m.index < best.i || (m.index === best.i && m[0].length > best.len))) best = { i: m.index, len: m[0].length, word };
    }
    if (!best) break;
    if (best.i > 0) out.push(rest.slice(0, best.i));
    out.push({ text: rest.slice(best.i, best.i + best.len), word: best.word });
    used.add(best.word.term);
    rest = rest.slice(best.i + best.len);
  }
  if (rest) out.push(rest);
  return out;
}
