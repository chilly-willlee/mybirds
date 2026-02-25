import { describe, it, expect } from "vitest";
import { scoreObservations, haversineDistanceMiles, formatReasonTag } from "../rarity";
import type { EBirdObservation } from "../../ebird/types";
import type { LifeListEntry } from "../../lifelist/types";

function makeObs(overrides: Partial<EBirdObservation> = {}): EBirdObservation {
  return {
    speciesCode: "varthr",
    comName: "Varied Thrush",
    sciName: "Ixoreus naevius",
    locId: "L1",
    locName: "Tilden Park",
    obsDt: "2026-01-10 09:00",
    howMany: 1,
    lat: 37.9,
    lng: -122.24,
    obsValid: true,
    obsReviewed: false,
    locationPrivate: false,
    subId: "S100",
    ...overrides,
  };
}

function makeLifeEntry(overrides: Partial<LifeListEntry> = {}): LifeListEntry {
  return {
    scientificName: "Turdus migratorius",
    commonName: "American Robin",
    taxonomicOrder: 19615,
    observationCount: 5,
    firstObservation: { date: "2024-03-01", location: "Central Park", checklistId: "S1" },
    lastObservation: { date: "2025-08-20", location: "Prospect Park", checklistId: "S2" },
    ...overrides,
  };
}

describe("scoreObservations", () => {
  const userLat = 37.8;
  const userLng = -122.27;

  it("gives 1000 points for lifer", () => {
    const result = scoreObservations({
      recentObs: [makeObs({ sciName: "Ixoreus naevius" })],
      notableObs: [],
      lifeList: [makeLifeEntry({ scientificName: "Turdus migratorius" })],
      userLat,
      userLng,
    });

    expect(result[0].isLifer).toBe(true);
    expect(result[0].score).toBeGreaterThanOrEqual(1000);
  });

  it("gives 500 points for notable species", () => {
    const obs = makeObs();
    const result = scoreObservations({
      recentObs: [obs],
      notableObs: [obs],
      lifeList: [makeLifeEntry({ scientificName: "Ixoreus naevius" })],
      userLat,
      userLng,
    });

    expect(result[0].reasons).toContainEqual({ type: "notable" });
    expect(result[0].score).toBeGreaterThanOrEqual(500);
  });

  it("gives 150 points for checklist notes", () => {
    const result = scoreObservations({
      recentObs: [makeObs()],
      notableObs: [],
      lifeList: [makeLifeEntry({ scientificName: "Ixoreus naevius" })],
      commentSpecies: new Set(["varthr"]),
      userLat,
      userLng,
    });

    expect(result[0].reasons).toContainEqual({ type: "checklist-notes" });
    expect(result[0].score).toBeGreaterThanOrEqual(150);
  });

  it("does not add checklist-notes tag when species not in commentSpecies", () => {
    const result = scoreObservations({
      recentObs: [makeObs()],
      notableObs: [],
      userLat,
      userLng,
    });

    expect(result[0].reasons.every((r) => r.type !== "checklist-notes")).toBe(true);
  });

  it("stacks multiple reasons", () => {
    const obs = makeObs({ sciName: "Ixoreus naevius" });
    const result = scoreObservations({
      recentObs: [obs],
      notableObs: [obs],
      lifeList: [],
      userLat,
      userLng,
    });

    expect(result[0].isLifer).toBe(true);
    expect(result[0].reasons.length).toBeGreaterThanOrEqual(2);
    expect(result[0].score).toBeGreaterThanOrEqual(1500);
  });

  it("sorts by score descending", () => {
    const result = scoreObservations({
      recentObs: [
        makeObs({ speciesCode: "a", sciName: "A species", subId: "S1" }),
        makeObs({ speciesCode: "b", sciName: "B species", subId: "S1" }),
      ],
      notableObs: [makeObs({ speciesCode: "b", sciName: "B species" })],
      userLat,
      userLng,
    });

    expect(result[0].speciesCode).toBe("b");
  });

  it("excludes lifer score when no life list", () => {
    const result = scoreObservations({
      recentObs: [makeObs()],
      notableObs: [],
      userLat,
      userLng,
    });

    expect(result[0].isLifer).toBe(false);
    expect(result[0].reasons.every((r) => r.type !== "lifer")).toBe(true);
  });

  it("deduplicates by speciesCode keeping most recent", () => {
    const result = scoreObservations({
      recentObs: [
        makeObs({ speciesCode: "a", obsDt: "2026-01-01" }),
        makeObs({ speciesCode: "a", obsDt: "2026-01-15", locName: "Newer" }),
      ],
      notableObs: [],
      userLat,
      userLng,
    });

    expect(result).toHaveLength(1);
    expect(result[0].locName).toBe("Newer");
  });

  it("calculates distance correctly", () => {
    const result = scoreObservations({
      recentObs: [makeObs({ lat: 37.9, lng: -122.24 })],
      notableObs: [],
      userLat: 37.8,
      userLng: -122.27,
    });

    expect(result[0].distanceMiles).toBeGreaterThan(0);
    expect(result[0].distanceMiles).toBeLessThan(10);
  });

  it("returns empty for empty input", () => {
    const result = scoreObservations({
      recentObs: [],
      notableObs: [],
      userLat,
      userLng,
    });

    expect(result).toEqual([]);
  });


  describe("last spotted recency scoring", () => {
    it("gives near-full 150 points for today's observation", () => {
      const today = new Date().toISOString().slice(0, 10) + " 08:00";
      const result = scoreObservations({
        recentObs: [makeObs({ obsDt: today, sciName: "Ixoreus naevius" })],
        notableObs: [],
        lifeList: [makeLifeEntry({ scientificName: "Turdus migratorius" })],
        userLat,
        userLng,
        back: 14,
      });

      expect(result[0].score).toBeGreaterThanOrEqual(1000 + 140);
    });

    it("gives 0 recency points beyond the lookback window", () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const oldDt = oldDate.toISOString().slice(0, 10) + " 08:00";
      const result = scoreObservations({
        recentObs: [makeObs({ obsDt: oldDt, sciName: "Turdus migratorius" })],
        notableObs: [],
        lifeList: [makeLifeEntry({ scientificName: "Turdus migratorius" })],
        userLat,
        userLng,
        back: 7,
      });

      expect(result[0].score).toBe(0);
    });

    it("gives proportional score for a mid-window observation", () => {
      const midDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const midDt = midDate.toISOString().slice(0, 10) + " 08:00";
      const result = scoreObservations({
        recentObs: [makeObs({ obsDt: midDt, sciName: "Turdus migratorius" })],
        notableObs: [],
        lifeList: [makeLifeEntry({ scientificName: "Turdus migratorius" })],
        userLat,
        userLng,
        back: 14,
      });

      expect(result[0].score).toBeGreaterThan(50);
      expect(result[0].score).toBeLessThan(100);
    });
  });

  it("populates allSubIds sorted most recent first", () => {
    const result = scoreObservations({
      recentObs: [
        makeObs({ speciesCode: "a", subId: "S1", obsDt: "2026-01-01" }),
        makeObs({ speciesCode: "a", subId: "S2", obsDt: "2026-01-10" }),
      ],
      notableObs: [],
      userLat,
      userLng,
    });

    expect(result[0].allSubIds).toEqual(["S2", "S1"]);
  });

  it("includes userObservationCount from life list", () => {
    const result = scoreObservations({
      recentObs: [makeObs({ sciName: "Turdus migratorius", speciesCode: "amerob" })],
      notableObs: [],
      lifeList: [makeLifeEntry({ scientificName: "Turdus migratorius", observationCount: 12 })],
      userLat,
      userLng,
    });

    expect(result[0].userObservationCount).toBe(12);
    expect(result[0].isLifer).toBe(false);
  });
});

describe("haversineDistanceMiles", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistanceMiles(37.8, -122.27, 37.8, -122.27)).toBe(0);
  });

  it("calculates known distance approximately", () => {
    const dist = haversineDistanceMiles(37.7749, -122.4194, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(340);
    expect(dist).toBeLessThan(360);
  });
});

describe("formatReasonTag", () => {
  it("formats lifer", () => {
    expect(formatReasonTag({ type: "lifer" })).toBe("Lifer");
  });

  it("formats notable", () => {
    expect(formatReasonTag({ type: "notable" })).toBe("Rare in this region");
  });

  it("formats checklist-notes", () => {
    expect(formatReasonTag({ type: "checklist-notes" })).toBe("Checklist notes added");
  });
});
