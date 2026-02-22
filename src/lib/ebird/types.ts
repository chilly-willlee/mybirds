import { z } from "zod/v4";

export const EBirdObservationSchema = z.object({
  speciesCode: z.string(),
  comName: z.string(),
  sciName: z.string(),
  locId: z.string(),
  locName: z.string(),
  obsDt: z.string(),
  howMany: z.number().optional(),
  lat: z.number(),
  lng: z.number(),
  obsValid: z.boolean(),
  obsReviewed: z.boolean(),
  locationPrivate: z.boolean(),
  subId: z.string().optional(),
  hasRichMedia: z.boolean().optional(),
});

export type EBirdObservation = z.infer<typeof EBirdObservationSchema>;

export const EBirdObservationArraySchema = z.array(EBirdObservationSchema);

export const EBirdTaxonSchema = z.object({
  sciName: z.string(),
  comName: z.string(),
  speciesCode: z.string(),
  category: z.string(),
  taxonOrder: z.number(),
  bandingCodes: z.array(z.string()).optional(),
  comNameCodes: z.array(z.string()).optional(),
  sciNameCodes: z.array(z.string()).optional(),
  order: z.string().optional(),
  familyCode: z.string().optional(),
  familyComName: z.string().optional(),
  familySciName: z.string().optional(),
});

export type EBirdTaxon = z.infer<typeof EBirdTaxonSchema>;

export const EBirdTaxonArraySchema = z.array(EBirdTaxonSchema);

export const EBirdHotspotSchema = z.object({
  locId: z.string(),
  locName: z.string(),
  countryCode: z.string(),
  subnational1Code: z.string(),
  lat: z.number(),
  lng: z.number(),
  latestObsDt: z.string().optional(),
  numSpeciesAllTime: z.number().optional(),
});

export type EBirdHotspot = z.infer<typeof EBirdHotspotSchema>;

export const EBirdHotspotArraySchema = z.array(EBirdHotspotSchema);

export const EBirdChecklistEntrySchema = z.object({
  speciesCode: z.string(),
  obsDt: z.string().optional(),
  howManyStr: z.string().optional(),
  comments: z.string().optional(),
  mediaCounts: z.record(z.string(), z.number()).optional(),
});

export const EBirdChecklistSchema = z.object({
  subId: z.string(),
  protocolId: z.string(),
  locId: z.string(),
  loc: z.object({
    locId: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    countryCode: z.string(),
    subnational1Code: z.string(),
  }),
  obsDt: z.string(),
  numObservers: z.number().optional(),
  obs: z.array(EBirdChecklistEntrySchema),
});

export type EBirdChecklist = z.infer<typeof EBirdChecklistSchema>;

export const EBirdSpeciesListSchema = z.array(z.string());
