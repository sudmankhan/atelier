import "./r3fDevSourceShim";
import { StudioShell } from "./StudioCanvas";
import { ChairModel } from "./ChairModel";
import { JapaneseChairModel } from "./JapaneseChairModel";
import { LabModel } from "./LabModel";
import { BASELINE } from "@/lib/chair/params";
import { J_BASELINE } from "@/lib/chair/japanese/params";
import { BLANK, type LabDesign } from "@/lib/lab";
import { isSpecPiece, type PieceId } from "@/lib/storage/chairProgress";
import { specById } from "@/lib/furniture/spec";
import { SpecModel } from "./SpecModel";

const LAB_PREVIEW: LabDesign = { ...BLANK, base: "splayed", back: "spindles", joint: "wedged", wood: "oak", splay: 8, stretchers: true };

/** Small slowly-turning 3D model for the chandelier card. Same models as the workshop. */
export default function ChairPreview({ chair }: { chair: PieceId }) {
  const spec = isSpecPiece(chair) ? specById(chair.slice(5)) : null;
  return (
    <StudioShell autoRotate initial="three">
      {chair === "kangaroo" && <ChairModel params={BASELINE} />}
      {chair === "japanese" && <JapaneseChairModel params={J_BASELINE} />}
      {chair === "lab" && <LabModel d={LAB_PREVIEW} xray={false} tipping={false} />}
      {spec && <SpecModel spec={spec} />}
    </StudioShell>
  );
}
