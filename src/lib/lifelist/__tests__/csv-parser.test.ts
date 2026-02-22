import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { parseLifeListCsv } from "../csv-parser";

const sampleCsv = readFileSync(
  path.join(__dirname, "csv-fixtures/sample.csv"),
  "utf-8",
);

const bomCsv = readFileSync(
  path.join(__dirname, "csv-fixtures/bom-sample.csv"),
  "utf-8",
);

const lifeListCsv = readFileSync(
  path.join(__dirname, "csv-fixtures/life-list-sample.csv"),
  "utf-8",
);

describe("parseLifeListCsv - My Data format", () => {
  it("parses sample CSV into deduplicated life list", () => {
    const result = parseLifeListCsv(sampleCsv);
    expect(result.species).toHaveLength(4);
    expect(result.totalObservations).toBe(6);
    expect(result.skippedRows).toBe(0);
  });

  it("sorts by taxonomic order", () => {
    const result = parseLifeListCsv(sampleCsv);
    const orders = result.species.map((s) => s.taxonomicOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("aggregates observation count per species", () => {
    const result = parseLifeListCsv(sampleCsv);
    const robin = result.species.find((s) => s.scientificName === "Turdus migratorius");
    expect(robin).toBeDefined();
    expect(robin!.observationCount).toBe(6);
  });

  it("tracks first and last observation dates", () => {
    const result = parseLifeListCsv(sampleCsv);
    const robin = result.species.find((s) => s.scientificName === "Turdus migratorius");
    expect(robin!.firstObservation.date).toBe("2024-03-01");
    expect(robin!.lastObservation.date).toBe("2025-08-20");
  });

  it("tracks observation locations", () => {
    const result = parseLifeListCsv(sampleCsv);
    const robin = result.species.find((s) => s.scientificName === "Turdus migratorius");
    expect(robin!.firstObservation.location).toBe("Lake Merritt");
    expect(robin!.lastObservation.location).toBe("Prospect Park");
  });

  it("handles X count as 1", () => {
    const result = parseLifeListCsv(sampleCsv);
    const thrush = result.species.find((s) => s.scientificName === "Ixoreus naevius");
    expect(thrush!.observationCount).toBe(1);
  });

  it("handles BOM-prefixed CSV", () => {
    const result = parseLifeListCsv(bomCsv);
    expect(result.species).toHaveLength(1);
    expect(result.species[0].commonName).toBe("Bald Eagle");
    expect(result.skippedRows).toBe(0);
  });

  it("handles empty CSV with headers only", () => {
    const headerOnly = "Submission ID,Common Name,Scientific Name,Taxonomic Order,Count,State/Province,County,Location,Latitude,Longitude,Date\n";
    const result = parseLifeListCsv(headerOnly);
    expect(result.species).toHaveLength(0);
    expect(result.totalObservations).toBe(0);
  });

  it("skips malformed rows and continues", () => {
    const csv = [
      "Submission ID,Common Name,Scientific Name,Taxonomic Order,Count,State/Province,County,Location,Latitude,Longitude,Date",
      "S1,Robin,Turdus migratorius,19615,2,US-NY,New York,Central Park,40.78,-73.96,2025-06-15",
      "bad,row,missing,fields",
      "S2,Cardinal,Cardinalis cardinalis,20137,1,US-NY,New York,Central Park,40.78,-73.96,2025-06-15",
    ].join("\n");

    const result = parseLifeListCsv(csv);
    expect(result.species).toHaveLength(2);
    expect(result.skippedRows).toBe(1);
  });

  it("preserves checklist IDs", () => {
    const result = parseLifeListCsv(sampleCsv);
    const woodpecker = result.species.find((s) => s.scientificName === "Melanerpes lewis");
    expect(woodpecker!.firstObservation.checklistId).toBe("S123456793");
  });

  it("handles large datasets efficiently", () => {
    const header = "Submission ID,Common Name,Scientific Name,Taxonomic Order,Count,State/Province,County,Location,Latitude,Longitude,Date";
    const rows: string[] = [header];
    for (let i = 0; i < 5000; i++) {
      const speciesIdx = i % 500;
      rows.push(`S${i},Bird ${speciesIdx},Species ${speciesIdx},${speciesIdx},1,US-CA,Alameda,Location ${i},37.8,-122.2,2025-01-${String((i % 28) + 1).padStart(2, "0")}`);
    }

    const start = performance.now();
    const result = parseLifeListCsv(rows.join("\n"));
    const elapsed = performance.now() - start;

    expect(result.species).toHaveLength(500);
    expect(result.totalObservations).toBe(5000);
    expect(elapsed).toBeLessThan(1000);
  });
});

describe("parseLifeListCsv - Life List format", () => {
  it("parses life list CSV correctly", () => {
    const result = parseLifeListCsv(lifeListCsv);
    expect(result.species).toHaveLength(5);
    expect(result.skippedRows).toBe(0);
  });

  it("sorts by taxon order", () => {
    const result = parseLifeListCsv(lifeListCsv);
    const orders = result.species.map((s) => s.taxonomicOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("maps field names correctly", () => {
    const result = parseLifeListCsv(lifeListCsv);
    const teal = result.species.find((s) => s.scientificName === "Spatula cyanoptera");
    expect(teal).toBeDefined();
    expect(teal!.commonName).toBe("Cinnamon Teal");
    expect(teal!.taxonomicOrder).toBe(487);
    expect(teal!.firstObservation.date).toBe("27 Dec 2025");
    expect(teal!.firstObservation.location).toBe("Cosumnes River Preserve");
    expect(teal!.firstObservation.checklistId).toBe("S290691666");
  });

  it("reports one observation per row (already deduplicated)", () => {
    const result = parseLifeListCsv(lifeListCsv);
    expect(result.totalObservations).toBe(result.species.length);
  });

  it("handles empty count field as 1", () => {
    const result = parseLifeListCsv(lifeListCsv);
    const teal = result.species.find((s) => s.scientificName === "Spatula cyanoptera");
    expect(teal!.observationCount).toBe(1);
  });
});
