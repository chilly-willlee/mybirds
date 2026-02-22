import type { EBirdObservation } from "../ebird/types";
import type { LifeListEntry } from "../lifelist/types";
import type { ScoredObservation, ReasonTag } from "./types";
import { SCORE_WEIGHTS } from "./types";

interface ScoreInput {
  recentObs: EBirdObservation[];
  notableObs: EBirdObservation[];
  lifeList?: LifeListEntry[];
  commentSpecies?: Set<string>;
  userLat: number;
  userLng: number;
}

export function scoreObservations(input: ScoreInput): ScoredObservation[] {
  const { recentObs, notableObs, lifeList, commentSpecies, userLat, userLng } = input;

  const notableSet = new Set(notableObs.map((o) => o.speciesCode));

  const lifeListMap = new Map<string, LifeListEntry>();
  if (lifeList) {
    for (const entry of lifeList) {
      lifeListMap.set(entry.scientificName, entry);
    }
  }

  const speciesMap = new Map<string, EBirdObservation>();
  const speciesSubIdDates = new Map<string, Map<string, string>>();

  for (const obs of [...recentObs, ...notableObs]) {
    if (obs.subId) {
      const subIdMap = speciesSubIdDates.get(obs.speciesCode) ?? new Map<string, string>();
      subIdMap.set(obs.subId, obs.obsDt);
      speciesSubIdDates.set(obs.speciesCode, subIdMap);
    }

    const existing = speciesMap.get(obs.speciesCode);
    if (!existing || obs.obsDt > existing.obsDt) {
      speciesMap.set(obs.speciesCode, obs);
    }
  }

  const scored: ScoredObservation[] = [];

  for (const [speciesCode, obs] of speciesMap) {
    const reasons: ReasonTag[] = [];
    let score = 0;

    const isLifer = lifeList ? !lifeListMap.has(obs.sciName) : false;
    if (isLifer) {
      score += SCORE_WEIGHTS.LIFER;
      reasons.push({ type: "lifer" });
    }

    if (notableSet.has(speciesCode)) {
      score += SCORE_WEIGHTS.NOTABLE;
      reasons.push({ type: "notable" });
    }

    if (commentSpecies?.has(speciesCode)) {
      score += SCORE_WEIGHTS.CHECKLIST_NOTES;
      reasons.push({ type: "checklist-notes" });
    }

    const subIdMap = speciesSubIdDates.get(speciesCode) ?? new Map<string, string>();
    const allSubIds = Array.from(subIdMap.entries())
      .sort(([, a], [, b]) => b.localeCompare(a))
      .map(([id]) => id);

    const lifeListEntry = lifeListMap.get(obs.sciName);
    const userObservationCount = lifeListEntry?.observationCount ?? 0;

    scored.push({
      speciesCode,
      comName: obs.comName,
      sciName: obs.sciName,
      locId: obs.locId,
      locName: obs.locName,
      obsDt: obs.obsDt,
      howMany: obs.howMany,
      lat: obs.lat,
      lng: obs.lng,
      subId: obs.subId,
      allSubIds,
      score,
      reasons,
      isLifer,
      userObservationCount,
      distanceMiles: haversineDistanceMiles(userLat, userLng, obs.lat, obs.lng),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatReasonTag(tag: ReasonTag): string {
  switch (tag.type) {
    case "lifer":
      return "Lifer";
    case "notable":
      return "Rare in this region";
    case "checklist-notes":
      return "Checklist notes added";
  }
}
