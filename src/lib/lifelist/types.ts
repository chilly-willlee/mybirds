import { z } from "zod/v4";

export const EBirdMyDataRowSchema = z.object({
  "Submission ID": z.string(),
  "Common Name": z.string(),
  "Scientific Name": z.string(),
  "Taxonomic Order": z.coerce.number(),
  "Count": z.string(),
  "State/Province": z.string(),
  "County": z.string().optional(),
  "Location": z.string(),
  "Latitude": z.coerce.number(),
  "Longitude": z.coerce.number(),
  "Date": z.string(),
  "Time": z.string().optional(),
  "Protocol": z.string().optional(),
  "Duration (Min)": z.coerce.number().optional(),
  "All Obs Reported": z.coerce.number().optional(),
  "Distance Traveled (km)": z.coerce.number().optional(),
  "Area Covered (ha)": z.coerce.number().optional(),
  "Number of Observers": z.coerce.number().optional(),
  "Breeding Code": z.string().optional(),
  "Species Comments": z.string().optional(),
  "Checklist Comments": z.string().optional(),
});

export type EBirdMyDataRow = z.infer<typeof EBirdMyDataRowSchema>;

export const EBirdLifeListRowSchema = z.object({
  "Row #": z.coerce.number(),
  "Taxon Order": z.coerce.number(),
  "Category": z.string(),
  "Common Name": z.string(),
  "Scientific Name": z.string(),
  "Count": z.string().optional(),
  "Location": z.string(),
  "S/P": z.string(),
  "Date": z.string(),
  "LocID": z.string(),
  "SubID": z.string(),
  "Exotic": z.string().optional(),
  "Countable": z.coerce.number().optional(),
});

export type EBirdLifeListRow = z.infer<typeof EBirdLifeListRowSchema>;

export interface LifeListEntry {
  scientificName: string;
  commonName: string;
  taxonomicOrder: number;
  observationCount: number;
  speciesCode?: string;
  firstObservation: {
    date: string;
    location: string;
    checklistId: string;
    locationId?: string;
  };
  lastObservation: {
    date: string;
    location: string;
    checklistId: string;
    locationId?: string;
  };
}

export interface LifeListParseResult {
  species: LifeListEntry[];
  totalObservations: number;
  skippedRows: number;
}
