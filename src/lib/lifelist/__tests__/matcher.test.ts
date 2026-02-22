import { describe, it, expect } from "vitest";
import { matchObservationsToLifeList } from "../matcher";
import type { EBirdObservation } from "../../ebird/types";
import type { LifeListEntry } from "../types";

function makeObservation(overrides: Partial<EBirdObservation> = {}): EBirdObservation {
  return {
    speciesCode: "varthr",
    comName: "Varied Thrush",
    sciName: "Ixoreus naevius",
    locId: "L123",
    locName: "Tilden Regional Park",
    obsDt: "2026-01-10 09:00",
    howMany: 1,
    lat: 37.9,
    lng: -122.24,
    obsValid: true,
    obsReviewed: false,
    locationPrivate: false,
    ...overrides,
  };
}

function makeLifeListEntry(overrides: Partial<LifeListEntry> = {}): LifeListEntry {
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

describe("matchObservationsToLifeList", () => {
  it("marks observation as lifer when not in life list", () => {
    const obs = [makeObservation({ sciName: "Ixoreus naevius" })];
    const lifeList = [makeLifeListEntry({ scientificName: "Turdus migratorius" })];

    const result = matchObservationsToLifeList(obs, lifeList);
    expect(result[0].isLifer).toBe(true);
    expect(result[0].userObservationCount).toBe(0);
  });

  it("marks observation as non-lifer when in life list", () => {
    const obs = [makeObservation({ sciName: "Turdus migratorius" })];
    const lifeList = [makeLifeListEntry({ scientificName: "Turdus migratorius", observationCount: 12 })];

    const result = matchObservationsToLifeList(obs, lifeList);
    expect(result[0].isLifer).toBe(false);
    expect(result[0].userObservationCount).toBe(12);
  });

  it("handles empty life list — all lifers", () => {
    const obs = [
      makeObservation({ sciName: "Ixoreus naevius" }),
      makeObservation({ sciName: "Turdus migratorius" }),
    ];

    const result = matchObservationsToLifeList(obs, []);
    expect(result.every((r) => r.isLifer)).toBe(true);
    expect(result.every((r) => r.userObservationCount === 0)).toBe(true);
  });

  it("handles empty observations", () => {
    const lifeList = [makeLifeListEntry()];
    const result = matchObservationsToLifeList([], lifeList);
    expect(result).toEqual([]);
  });

  it("preserves all original observation fields", () => {
    const obs = [makeObservation({ comName: "Varied Thrush", locName: "Tilden" })];
    const result = matchObservationsToLifeList(obs, []);
    expect(result[0].comName).toBe("Varied Thrush");
    expect(result[0].locName).toBe("Tilden");
  });

  it("matches by scientific name, not common name", () => {
    const obs = [makeObservation({ sciName: "Turdus migratorius", comName: "Merle d'Amérique" })];
    const lifeList = [makeLifeListEntry({ scientificName: "Turdus migratorius", commonName: "American Robin" })];

    const result = matchObservationsToLifeList(obs, lifeList);
    expect(result[0].isLifer).toBe(false);
  });

  it("handles mixed lifers and non-lifers", () => {
    const obs = [
      makeObservation({ sciName: "Ixoreus naevius" }),
      makeObservation({ sciName: "Turdus migratorius" }),
      makeObservation({ sciName: "Melanerpes lewis" }),
    ];
    const lifeList = [
      makeLifeListEntry({ scientificName: "Turdus migratorius", observationCount: 5 }),
    ];

    const result = matchObservationsToLifeList(obs, lifeList);
    expect(result[0].isLifer).toBe(true);
    expect(result[1].isLifer).toBe(false);
    expect(result[2].isLifer).toBe(true);
  });

  it("performs efficiently with large datasets", () => {
    const obs: EBirdObservation[] = [];
    for (let i = 0; i < 500; i++) {
      obs.push(makeObservation({ sciName: `Species ${i}` }));
    }
    const lifeList: LifeListEntry[] = [];
    for (let i = 0; i < 1000; i++) {
      lifeList.push(makeLifeListEntry({ scientificName: `Species ${i * 2}` }));
    }

    const start = performance.now();
    const result = matchObservationsToLifeList(obs, lifeList);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(500);
    expect(elapsed).toBeLessThan(50);
  });
});
