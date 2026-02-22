import Papa from "papaparse";
import { EBirdMyDataRowSchema, EBirdLifeListRowSchema } from "./types";
import type { EBirdMyDataRow, EBirdLifeListRow, LifeListEntry, LifeListParseResult } from "./types";

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseCount(raw: string | undefined): number {
  if (!raw || raw === "X" || raw === "x" || raw === "") return 1;
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

function parseDate(dateStr: string): Date {
  const isoParts = dateStr.split("-");
  if (isoParts.length === 3 && isoParts[0].length === 4) {
    return new Date(parseInt(isoParts[0]), parseInt(isoParts[1]) - 1, parseInt(isoParts[2]));
  }
  return new Date(dateStr);
}

type CsvFormat = "my-data" | "life-list";

function detectFormat(headers: string[]): CsvFormat {
  if (headers.includes("Taxon Order") || headers.includes("SubID")) {
    return "life-list";
  }
  return "my-data";
}

function parseMyDataRows(data: Record<string, string>[]): LifeListParseResult {
  const speciesMap = new Map<string, LifeListEntry>();
  let skippedRows = 0;
  let totalObservations = 0;

  for (const rawRow of data) {
    const result = EBirdMyDataRowSchema.safeParse(rawRow);
    if (!result.success) {
      skippedRows++;
      continue;
    }

    const row: EBirdMyDataRow = result.data;
    const sciName = row["Scientific Name"];
    const existing = speciesMap.get(sciName);
    const rowDate = parseDate(row["Date"]);
    totalObservations++;

    const obsInfo = {
      date: row["Date"],
      location: row["Location"],
      checklistId: row["Submission ID"],
    };

    if (!existing) {
      speciesMap.set(sciName, {
        scientificName: sciName,
        commonName: row["Common Name"],
        taxonomicOrder: row["Taxonomic Order"],
        observationCount: parseCount(row["Count"]),
        firstObservation: { ...obsInfo },
        lastObservation: { ...obsInfo },
      });
    } else {
      existing.observationCount += parseCount(row["Count"]);

      const existingFirst = parseDate(existing.firstObservation.date);
      if (rowDate < existingFirst) {
        existing.firstObservation = { ...obsInfo };
      }

      const existingLast = parseDate(existing.lastObservation.date);
      if (rowDate > existingLast) {
        existing.lastObservation = { ...obsInfo };
      }
    }
  }

  const species = Array.from(speciesMap.values()).sort(
    (a, b) => a.taxonomicOrder - b.taxonomicOrder,
  );

  return { species, totalObservations, skippedRows };
}

function parseLifeListRows(data: Record<string, string>[]): LifeListParseResult {
  const species: LifeListEntry[] = [];
  let skippedRows = 0;

  for (const rawRow of data) {
    const result = EBirdLifeListRowSchema.safeParse(rawRow);
    if (!result.success) {
      skippedRows++;
      continue;
    }

    const row: EBirdLifeListRow = result.data;
    const obsInfo = {
      date: row["Date"],
      location: row["Location"],
      checklistId: row["SubID"],
    };

    species.push({
      scientificName: row["Scientific Name"],
      commonName: row["Common Name"],
      taxonomicOrder: row["Taxon Order"],
      observationCount: parseCount(row["Count"]),
      firstObservation: { ...obsInfo },
      lastObservation: { ...obsInfo },
    });
  }

  species.sort((a, b) => a.taxonomicOrder - b.taxonomicOrder);

  return { species, totalObservations: species.length, skippedRows };
}

export function parseLifeListCsv(csvText: string): LifeListParseResult {
  const cleaned = stripBom(csvText);

  const { data, errors, meta } = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (data.length === 0 && errors.length > 0) {
    throw new Error(`CSV parsing failed: ${errors[0].message}`);
  }

  const format = detectFormat(meta.fields ?? []);

  if (format === "life-list") {
    return parseLifeListRows(data);
  }
  return parseMyDataRows(data);
}
