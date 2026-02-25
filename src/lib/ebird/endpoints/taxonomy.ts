import type { EBirdClient } from "../client";
import type { EBirdTaxon } from "../types";
import { EBirdTaxonArraySchema } from "../types";

export interface TaxonomyParams {
  species?: string[];
}

export async function getTaxonomy(
  client: EBirdClient,
  params?: TaxonomyParams,
): Promise<EBirdTaxon[]> {
  const queryParams: Record<string, string | number | boolean> = { fmt: "json" };
  if (params?.species?.length) {
    queryParams.species = params.species.join(",");
  }
  return client.get("/ref/taxonomy/ebird", queryParams, EBirdTaxonArraySchema);
}
