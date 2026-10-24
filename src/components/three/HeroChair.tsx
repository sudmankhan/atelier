import { StudioCanvas } from "./StudioCanvas";
import { BASELINE } from "@/lib/chair/params";

export default function HeroChair() {
  return <StudioCanvas params={BASELINE} dims autoRotate initial="three" />;
}
