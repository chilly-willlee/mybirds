import "server-only";
import { eq, asc, desc, and } from "drizzle-orm";
import { getDb } from ".";
import { lifeListEntries, lifeListImports } from "./schema";
import type { LifeListEntry } from "../lifelist/types";

type ImportType = "first-seen" | "last-seen" | "my-data";

export interface ImportStatus {
  firstSeen: { speciesCount: number; importedAt: Date } | null;
  lastSeen: { speciesCount: number; importedAt: Date } | null;
}

export async function getImportStatus(userId: string): Promise<ImportStatus> {
  const db = getDb();
  const rows = await db
    .select()
    .from(lifeListImports)
    .where(eq(lifeListImports.userId, userId))
    .orderBy(desc(lifeListImports.importedAt));

  const latest = (type: ImportType) => rows.find((r) => r.type === type || (type === "first-seen" && r.type === "my-data") || (type === "last-seen" && r.type === "my-data"));

  const firstRow = rows.find((r) => r.type === "first-seen" || r.type === "my-data");
  const lastRow = rows.find((r) => r.type === "last-seen" || r.type === "my-data");

  return {
    firstSeen: firstRow ? { speciesCount: firstRow.speciesCount, importedAt: firstRow.importedAt } : null,
    lastSeen: lastRow ? { speciesCount: lastRow.speciesCount, importedAt: lastRow.importedAt } : null,
  };
}

export async function upsertFirstSeenList(
  userId: string,
  entries: LifeListEntry[],
): Promise<void> {
  const db = getDb();

  await db.delete(lifeListEntries).where(eq(lifeListEntries.userId, userId));

  if (entries.length === 0) return;

  const rows = entries.map((e) => ({
    userId,
    scientificName: e.scientificName,
    commonName: e.commonName,
    taxonomicOrder: e.taxonomicOrder,
    observationCount: e.observationCount,
    speciesCode: e.speciesCode,
    firstObsDate: e.firstObservation.date || null,
    firstObsLocation: e.firstObservation.location || null,
    firstObsChecklistId: e.firstObservation.checklistId || null,
    firstObsLocationId: e.firstObservation.locationId ?? null,
    lastObsDate: null,
    lastObsLocation: null,
    lastObsChecklistId: null,
    lastObsLocationId: null,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(lifeListEntries).values(rows.slice(i, i + BATCH_SIZE));
  }
}

export async function mergeLastSeenData(
  userId: string,
  entries: LifeListEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const db = getDb();

  // Find which species already exist for this user
  const existing = await db
    .select({ scientificName: lifeListEntries.scientificName })
    .from(lifeListEntries)
    .where(eq(lifeListEntries.userId, userId));
  const existingNames = new Set(existing.map((r) => r.scientificName));

  const toUpdate = entries.filter((e) => existingNames.has(e.scientificName));
  const toInsert = entries.filter((e) => !existingNames.has(e.scientificName));

  // Update lastObs* for species already in the DB
  for (const e of toUpdate) {
    await db
      .update(lifeListEntries)
      .set({
        lastObsDate: e.lastObservation.date || null,
        lastObsLocation: e.lastObservation.location || null,
        lastObsChecklistId: e.lastObservation.checklistId || null,
        lastObsLocationId: e.lastObservation.locationId ?? null,
      })
      .where(
        and(
          eq(lifeListEntries.userId, userId),
          eq(lifeListEntries.scientificName, e.scientificName),
        ),
      );
  }

  // Insert new species (union case — present in Last Seen but not First Seen)
  if (toInsert.length > 0) {
    const rows = toInsert.map((e) => ({
      userId,
      scientificName: e.scientificName,
      commonName: e.commonName,
      taxonomicOrder: e.taxonomicOrder,
      observationCount: e.observationCount,
      speciesCode: e.speciesCode,
      firstObsDate: null,
      firstObsLocation: null,
      firstObsChecklistId: null,
      firstObsLocationId: null,
      lastObsDate: e.lastObservation.date || null,
      lastObsLocation: e.lastObservation.location || null,
      lastObsChecklistId: e.lastObservation.checklistId || null,
      lastObsLocationId: e.lastObservation.locationId ?? null,
    }));
    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await db.insert(lifeListEntries).values(rows.slice(i, i + BATCH_SIZE));
    }
  }
}

export async function upsertLifeList(
  userId: string,
  entries: LifeListEntry[],
): Promise<void> {
  const db = getDb();

  await db.delete(lifeListEntries).where(eq(lifeListEntries.userId, userId));

  if (entries.length === 0) return;

  const rows = entries.map((e) => ({
    userId,
    scientificName: e.scientificName,
    commonName: e.commonName,
    taxonomicOrder: e.taxonomicOrder,
    observationCount: e.observationCount,
    speciesCode: e.speciesCode,
    firstObsDate: e.firstObservation.date || null,
    firstObsLocation: e.firstObservation.location || null,
    firstObsChecklistId: e.firstObservation.checklistId || null,
    firstObsLocationId: e.firstObservation.locationId ?? null,
    lastObsDate: e.lastObservation.date || null,
    lastObsLocation: e.lastObservation.location || null,
    lastObsChecklistId: e.lastObservation.checklistId || null,
    lastObsLocationId: e.lastObservation.locationId ?? null,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(lifeListEntries).values(rows.slice(i, i + BATCH_SIZE));
  }
}

export async function getLifeList(userId: string): Promise<LifeListEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(lifeListEntries)
    .where(eq(lifeListEntries.userId, userId))
    .orderBy(asc(lifeListEntries.taxonomicOrder));

  return rows.map((r) => ({
    scientificName: r.scientificName,
    commonName: r.commonName,
    taxonomicOrder: r.taxonomicOrder,
    observationCount: r.observationCount,
    speciesCode: r.speciesCode ?? undefined,
    firstObservation: {
      date: r.firstObsDate ?? "",
      location: r.firstObsLocation ?? "",
      checklistId: r.firstObsChecklistId ?? "",
      locationId: r.firstObsLocationId ?? undefined,
    },
    lastObservation: {
      date: r.lastObsDate ?? "",
      location: r.lastObsLocation ?? "",
      checklistId: r.lastObsChecklistId ?? "",
      locationId: r.lastObsLocationId ?? undefined,
    },
  }));
}

export async function getLifeListStats(userId: string) {
  const db = getDb();
  const imports = await db
    .select()
    .from(lifeListImports)
    .where(eq(lifeListImports.userId, userId))
    .orderBy(asc(lifeListImports.importedAt));

  const lastImport = imports.at(-1);

  return {
    speciesCount: lastImport?.speciesCount ?? 0,
    lastImportedAt: lastImport?.importedAt ?? null,
  };
}

export async function recordImport(
  userId: string,
  type: ImportType,
  stats: { speciesCount: number; totalObservations: number; skippedRows: number },
): Promise<void> {
  const db = getDb();
  await db.insert(lifeListImports).values({
    userId,
    type,
    speciesCount: stats.speciesCount,
    totalObservations: stats.totalObservations,
    skippedRows: stats.skippedRows,
  });
}
