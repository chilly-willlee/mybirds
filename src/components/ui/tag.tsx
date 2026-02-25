import type { ReasonTag } from "@/lib/scoring/types";
import { formatReasonTag } from "@/lib/scoring/rarity";

const tagStyles: Record<ReasonTag["type"], string> = {
  lifer: "bg-golden text-charcoal",
  notable: "bg-sky text-white",
  "checklist-notes": "bg-sage text-forest",
};

export function Tag({ reason }: { reason: ReasonTag }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.04em] ${tagStyles[reason.type]}`}
    >
      {formatReasonTag(reason)}
    </span>
  );
}
