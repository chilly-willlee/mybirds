import { describe, it, expect } from "vitest";
import {
  EBirdObservationSchema,
  EBirdObservationArraySchema,
  EBirdTaxonSchema,
  EBirdTaxonArraySchema,
  EBirdHotspotSchema,
  EBirdHotspotArraySchema,
  EBirdChecklistSchema,
  EBirdSpeciesListSchema,
} from "../types";
import {
  validObservation,
  validObservationMinimal,
  validObservationArray,
} from "./fixtures/observations";
import { validTaxon, validTaxonMinimal } from "./fixtures/taxonomy";
import { validHotspot, validHotspotMinimal } from "./fixtures/hotspots";
import { validChecklist } from "./fixtures/checklists";

describe("EBirdObservationSchema", () => {
  it("validates a full observation", () => {
    const result = EBirdObservationSchema.safeParse(validObservation);
    expect(result.success).toBe(true);
  });

  it("validates an observation without optional fields", () => {
    const result = EBirdObservationSchema.safeParse(validObservationMinimal);
    expect(result.success).toBe(true);
  });

  it("validates an array of observations", () => {
    const result = EBirdObservationArraySchema.safeParse(validObservationArray);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it("validates an empty array", () => {
    const result = EBirdObservationArraySchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("rejects observation missing required fields", () => {
    const result = EBirdObservationSchema.safeParse({
      speciesCode: "varthr",
      comName: "Varied Thrush",
    });
    expect(result.success).toBe(false);
  });

  it("rejects observation with wrong types", () => {
    const result = EBirdObservationSchema.safeParse({
      ...validObservation,
      lat: "not a number",
    });
    expect(result.success).toBe(false);
  });
});

describe("EBirdTaxonSchema", () => {
  it("validates a full taxon", () => {
    const result = EBirdTaxonSchema.safeParse(validTaxon);
    expect(result.success).toBe(true);
  });

  it("validates a taxon without optional fields", () => {
    const result = EBirdTaxonSchema.safeParse(validTaxonMinimal);
    expect(result.success).toBe(true);
  });

  it("validates a taxon array", () => {
    const result = EBirdTaxonArraySchema.safeParse([
      validTaxon,
      validTaxonMinimal,
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects taxon missing speciesCode", () => {
    const { speciesCode, ...rest } = validTaxonMinimal;
    const result = EBirdTaxonSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("EBirdHotspotSchema", () => {
  it("validates a full hotspot", () => {
    const result = EBirdHotspotSchema.safeParse(validHotspot);
    expect(result.success).toBe(true);
  });

  it("validates a hotspot without optional fields", () => {
    const result = EBirdHotspotSchema.safeParse(validHotspotMinimal);
    expect(result.success).toBe(true);
  });

  it("validates a hotspot array", () => {
    const result = EBirdHotspotArraySchema.safeParse([
      validHotspot,
      validHotspotMinimal,
    ]);
    expect(result.success).toBe(true);
  });
});

describe("EBirdChecklistSchema", () => {
  it("validates a full checklist", () => {
    const result = EBirdChecklistSchema.safeParse(validChecklist);
    expect(result.success).toBe(true);
  });

  it("accepts checklist missing loc (loc is optional — eBird API omits it)", () => {
    const { loc, ...rest } = validChecklist;
    const result = EBirdChecklistSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });
});

describe("EBirdSpeciesListSchema", () => {
  it("validates an array of species codes", () => {
    const result = EBirdSpeciesListSchema.safeParse([
      "varthr",
      "lewwoo",
      "amerob",
    ]);
    expect(result.success).toBe(true);
  });

  it("validates an empty array", () => {
    const result = EBirdSpeciesListSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("rejects non-string array", () => {
    const result = EBirdSpeciesListSchema.safeParse([1, 2, 3]);
    expect(result.success).toBe(false);
  });
});
