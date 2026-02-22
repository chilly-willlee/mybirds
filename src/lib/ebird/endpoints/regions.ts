import type { EBirdClient } from "../client";
import { EBirdSpeciesListSchema } from "../types";

export async function getRegionSpeciesList(
  client: EBirdClient,
  regionCode: string,
): Promise<string[]> {
  return client.get(`/product/spplist/${regionCode}`, {}, EBirdSpeciesListSchema);
}
