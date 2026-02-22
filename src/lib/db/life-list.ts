import "server-only";
import { eq, asc } from "drizzle-orm";
import { getDb } from ".";
import { lifeListEntries, lifeListImports } from "./schema";
import type { LifeListEntry } from "../lifelist/types";

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
    firstObsDate: e.firstObservation.date,
    firstObsLocation: e.firstObservation.location,
    firstObsChecklistId: e.firstObservation.checklistId,
    lastObsDate: e.lastObservation.date,
    lastObsLocation: e.lastObservation.location,
    lastObsChecklistId: e.lastObservation.checklistId,
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
    firstObservation: {
      date: r.firstObsDate ?? "",
      location: r.firstObsLocation ?? "",
      checklistId: r.firstObsChecklistId ?? "",
    },
    lastObservation: {
      date: r.lastObsDate ?? "",
      location: r.lastObsLocation ?? "",
      checklistId: r.lastObsChecklistId ?? "",
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
  stats: { speciesCount: number; totalObservations: number; skippedRows: number },
): Promise<void> {
  const db = getDb();
  await db.insert(lifeListImports).values({
    userId,
    speciesCount: stats.speciesCount,
    totalObservations: stats.totalObservations,
    skippedRows: stats.skippedRows,
  });
}
