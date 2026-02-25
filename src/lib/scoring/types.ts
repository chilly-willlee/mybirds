export interface ScoredObservation {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId: string;
  locName: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  subId?: string;
  allSubIds: string[];
  score: number;
  reasons: ReasonTag[];
  isLifer: boolean;
  userObservationCount: number;
  distanceMiles: number;
}

export type ReasonTag =
  | { type: "lifer" }
  | { type: "notable" }
  | { type: "checklist-notes" };

export const SCORE_WEIGHTS = {
  LIFER: 1000,
  NOTABLE: 500,
  CHECKLIST_NOTES: 150,
  LAST_SPOTTED: 150,
} as const;
