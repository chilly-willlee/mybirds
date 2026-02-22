import type { EBirdClient } from "../client";
import type { EBirdChecklist } from "../types";
import { EBirdChecklistSchema } from "../types";

export async function getChecklist(
  client: EBirdClient,
  subId: string,
): Promise<EBirdChecklist> {
  return client.get(`/product/checklist/view/${subId}`, {}, EBirdChecklistSchema);
}
