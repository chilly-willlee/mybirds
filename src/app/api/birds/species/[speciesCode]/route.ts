import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { getEBirdClient, getCache } from "@/lib/ebird/singleton";
import { getRecentNearbySpeciesObservations } from "@/lib/ebird/endpoints/observations";
import { getChecklist } from "@/lib/ebird/endpoints/checklists";
import { observationsCacheKey, checklistCacheKey, CACHE_TTL } from "@/lib/ebird/cache";
import { milesToKm } from "@/lib/geo";
import { checkRateLimit } from "@/lib/rate-limit";
import { haversineDistanceMiles } from "@/lib/scoring/rarity";
import type { EBirdObservation, EBirdChecklist } from "@/lib/ebird/types";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMiles: z.coerce.number().min(1).max(25).default(10),
  back: z.coerce.number().min(1).max(30).default(7),
});

const SPECIES_CACHE_TTL = 30 * 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ speciesCode: string }> },
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { speciesCode } = await params;
  const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { lat, lng, radiusMiles, back } = parsed.data;
  const distKm = Math.round(milesToKm(radiusMiles));
  const client = getEBirdClient();
  const cache = getCache();

  const cacheKey = `species:${observationsCacheKey(lat, lng, distKm, back)}:${speciesCode}`;
  let obs = await cache.get<EBirdObservation[]>(cacheKey);
  if (!obs) {
    obs = await getRecentNearbySpeciesObservations(client, speciesCode, { lat, lng, dist: distKm, back, includeProvisional: true });
    await cache.set(cacheKey, obs, SPECIES_CACHE_TTL);
  }

  const sorted = obs
    .filter((o) => o.subId)
    .sort((a, b) => b.obsDt.localeCompare(a.obsDt));

  const uniqueSubIds = Array.from(new Set(sorted.map((o) => o.subId as string)));

  const photoCountBySubId = new Map<string, number>();
  await Promise.all(
    uniqueSubIds.map(async (subId) => {
      const key = checklistCacheKey(subId);
      let checklist = await cache.get<EBirdChecklist>(key);
      if (!checklist) {
        try {
          checklist = await getChecklist(client, subId);
          await cache.set(key, checklist, CACHE_TTL.checklists);
        } catch {
          return;
        }
      }
      const entry = checklist.obs.find((o) => o.speciesCode === speciesCode);
      photoCountBySubId.set(subId, entry?.mediaCounts?.["P"] ?? 0);
    }),
  );

  const checklists = sorted.map((o) => ({
    subId: o.subId as string,
    locName: o.locName,
    obsDt: o.obsDt,
    distanceMiles: Math.round(haversineDistanceMiles(lat, lng, o.lat, o.lng)),
    photoCount: photoCountBySubId.get(o.subId as string) ?? 0,
  }));

  return NextResponse.json({
    sightingCount: uniqueSubIds.length,
    checklists,
  });
}
