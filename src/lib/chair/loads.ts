// Load cases used by every stress and tipping calculation. These are stated teaching
// assumptions, not values from a furniture standard; the UI labels them as such.

export interface LoadCase {
  /** body weight on the seat, N (≈ 90 kg sitter) */
  seatN: number;
  /** horizontal push at the top of the back when the sitter leans back hard, N */
  leanN: number;
  /** sideways shove at seat height (rocking, dragging the chair), N */
  rackN: number;
  /** downward push on one arm when rising out of the chair, N */
  armN: number;
  /** occupant's centre of mass, as a fraction of seat depth forward of the seat rear */
  comFraction: number;
}

export const DEFAULT_LOADS: LoadCase = {
  seatN: 900,
  leanN: 250,
  rackN: 150,
  armN: 300,
  comFraction: 0.35,
};

export const LOADS_NOTE =
  "Assumed loads: 900 N sitter, 250 N lean at the top of the back, 150 N sideways shove at seat height, 300 N on one arm. Teaching assumptions, not a furniture standard.";
