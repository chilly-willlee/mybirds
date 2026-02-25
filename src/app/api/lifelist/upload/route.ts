import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseLifeListCsv } from "@/lib/lifelist/csv-parser";
import { auth } from "@/lib/auth";
import { upsertFirstSeenList, mergeLastSeenData, upsertLifeList, recordImport } from "@/lib/db/life-list";
import { getEBirdClient, getCache } from "@/lib/ebird/singleton";
import { getTaxonomy } from "@/lib/ebird/endpoints/taxonomy";
import { CACHE_TTL, taxonomyCacheKey } from "@/lib/ebird/cache";
import type { EBirdTaxon } from "@/lib/ebird/types";
import type { LifeListEntry } from "@/lib/lifelist/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_TYPES = ["first-seen", "last-seen", "my-data"] as const;
type UploadType = (typeof VALID_TYPES)[number];

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const typeParam = (formData.get("type") as string) ?? "first-seen";

  if (!VALID_TYPES.includes(typeParam as UploadType)) {
    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  }
  const uploadType = typeParam as UploadType;

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field in form data" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 413 },
    );
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json(
      { error: "File must be a CSV (.csv)" },
      { status: 400 },
    );
  }

  const text = await file.text();
  const result = parseLifeListCsv(text);

  const client = getEBirdClient();
  const cache = getCache();
  const cacheKey = taxonomyCacheKey();
  let taxonomy = await cache.get<EBirdTaxon[]>(cacheKey);
  if (!taxonomy) {
    taxonomy = await getTaxonomy(client);
    await cache.set(cacheKey, taxonomy, CACHE_TTL.taxonomy);
  }
  const sciNameToCode = new Map(taxonomy.map((t) => [t.sciName, t.speciesCode]));
  const enriched: LifeListEntry[] = result.species.map((e) => ({
    ...e,
    speciesCode: sciNameToCode.get(e.scientificName),
  }));

  if (uploadType === "first-seen") {
    await upsertFirstSeenList(session.user.id, enriched);
  } else if (uploadType === "last-seen") {
    // The parser puts the CSV date into firstObservation; swap it to lastObservation
    const swapped: LifeListEntry[] = enriched.map((e) => ({
      ...e,
      firstObservation: { date: "", location: "", checklistId: "" },
      lastObservation: e.firstObservation,
    }));
    await mergeLastSeenData(session.user.id, swapped);
  } else {
    // my-data: full replace with both first + last correctly populated by parser
    await upsertLifeList(session.user.id, enriched);
  }

  await recordImport(session.user.id, uploadType, {
    speciesCount: result.species.length,
    totalObservations: result.totalObservations,
    skippedRows: result.skippedRows,
  });

  return NextResponse.json({
    speciesCount: result.species.length,
    totalObservations: result.totalObservations,
    skippedRows: result.skippedRows,
  }, {
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
