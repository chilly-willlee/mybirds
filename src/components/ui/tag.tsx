import type { ReasonTag } from "@/lib/scoring/types";
import { formatReasonTag } from "@/lib/scoring/rarity";

const tagStyles: Record<ReasonTag["type"], string> = {
  lifer: "bg-golden-light text-charcoal border-golden",
  notable: "bg-sky/10 text-sky border-sky/30",
  "checklist-notes": "bg-forest/10 text-forest border-forest/30",
};

export function Tag({ reason }: { reason: ReasonTag }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${tagStyles[reason.type]}`}
    >
      {formatReasonTag(reason)}
    </span>
  );
}
