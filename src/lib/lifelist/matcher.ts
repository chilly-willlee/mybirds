import type { EBirdObservation } from "../ebird/types";
import type { LifeListEntry } from "./types";

export interface MatchedObservation extends EBirdObservation {
  isLifer: boolean;
  userObservationCount: number;
}

export function matchObservationsToLifeList(
  observations: EBirdObservation[],
  lifeList: LifeListEntry[],
): MatchedObservation[] {
  const lifeListMap = new Map<string, LifeListEntry>();
  for (const entry of lifeList) {
    lifeListMap.set(entry.scientificName, entry);
  }

  return observations.map((obs) => {
    const entry = lifeListMap.get(obs.sciName);
    return {
      ...obs,
      isLifer: !entry,
      userObservationCount: entry?.observationCount ?? 0,
    };
  });
}
