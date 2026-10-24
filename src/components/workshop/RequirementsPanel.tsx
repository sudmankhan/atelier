import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import {
  REQUIREMENT_PROFILES,
  formatRequirementTarget,
  type RequirementProfileId,
} from "@/lib/chair/requirements";
import { cn } from "@/lib/utils";
import { useWorkshop } from "./store";

export function RequirementsPanel() {
  const w = useWorkshop();
  const measured = w.requirements.filter((result) => result.spec.kind === "range");
  const meets = measured.filter((result) => result.status === "meets").length;
  const pending = w.requirements.filter((result) => result.status === "pending-test").length;
  const profile = REQUIREMENT_PROFILES[w.requirementProfile];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Requirements · design brief</div>
          <div className="mt-1 text-sm">
            {meets}/{measured.length} measured requirements met
          </div>
        </div>
        <span className="rounded-full bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground">
          {pending} tests pending
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1">
        {(Object.keys(REQUIREMENT_PROFILES) as RequirementProfileId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => w.setRequirementProfile(id)}
            className={cn(
              "rounded-md border px-2 py-1.5 text-xs",
              w.requirementProfile === id
                ? "border-teal bg-teal-soft text-foreground"
                : "hairline bg-card text-muted-foreground",
            )}
          >
            {REQUIREMENT_PROFILES[id].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        {profile.description}
      </p>
      <div className="mt-3 space-y-1.5">
        {w.requirements.map((result) => {
          const Icon =
            result.status === "meets"
              ? CheckCircle2
              : result.status === "outside"
                ? AlertTriangle
                : Clock3;
          return (
            <details
              key={result.spec.id}
              className="rounded-md border hairline bg-card px-2.5 py-2"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 text-xs">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    result.status === "meets"
                      ? "text-teal"
                      : result.status === "outside"
                        ? "text-alert"
                        : "text-measure",
                  )}
                />
                <span className="min-w-0 flex-1">{result.spec.title}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {result.actual === null
                    ? "pending"
                    : `${Number.isInteger(result.actual) ? result.actual.toFixed(0) : result.actual.toFixed(1)}${result.spec.kind === "range" ? result.spec.unit : ""}`}
                </span>
              </summary>
              <div className="mt-2 border-t hairline pt-2 text-[10px] leading-relaxed text-muted-foreground">
                <p>{result.evidence}</p>
                <p className="mt-1">
                  Target: {formatRequirementTarget(result.spec)}. {result.spec.rationale}
                </p>
                <p className="mt-1 font-mono text-[9px]">
                  {result.spec.source.title} · v{result.spec.source.version} ·{" "}
                  {result.spec.source.section}
                </p>
              </div>
            </details>
          );
        })}
      </div>
      <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
        Advisory in-app guidance, not certification. Pending items require a representative physical
        build and documented test.
      </p>
    </div>
  );
}
