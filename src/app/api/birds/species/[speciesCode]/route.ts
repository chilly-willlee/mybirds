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
  subIds: z.string().optional(),
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

  // Primary: per-location observations from the species endpoint
  const cacheKey = `species:${observationsCacheKey(lat, lng, distKm, back)}:${speciesCode}`;
  let obs = await cache.get<EBirdObservation[]>(cacheKey);
  if (!obs) {
    obs = await getRecentNearbySpeciesObservations(client, speciesCode, { lat, lng, dist: distKm, back, includeProvisional: true });
    await cache.set(cacheKey, obs, SPECIES_CACHE_TTL);
  }

  const sorted = obs
    .filter((o) => o.subId)
    .sort((a, b) => b.obsDt.localeCompare(a.obsDt));

  const primarySubIds = new Set(sorted.map((o) => o.subId as string));

  // Supplementary: client-provided allSubIds not already covered by species endpoint
  const supplementarySubIds = parsed.data.subIds
    ? parsed.data.subIds.split(",").filter((id) => id && !primarySubIds.has(id))
    : [];

  // Fetch checklists for all subIds: photo counts for primary, full data for supplementary
  const checklistMap = new Map<string, EBirdChecklist>();
  await Promise.all(
    [...primarySubIds, ...supplementarySubIds].map(async (subId) => {
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
      checklistMap.set(subId, checklist);
    }),
  );

  // Build locId → location info map from primary obs (eBird checklist API no longer returns loc object)
  const locIdToInfo = new Map<string, { name: string; lat: number; lng: number }>();
  for (const o of sorted) {
    if (!locIdToInfo.has(o.locId)) {
      locIdToInfo.set(o.locId, { name: o.locName, lat: o.lat, lng: o.lng });
    }
  }

  // Primary entries from species obs (resilient — shown even if checklist fetch fails)
  const entries: { subId: string; locName: string; obsDt: string; distanceMiles: number; photoCount: number }[] = [];

  for (const o of sorted) {
    const subId = o.subId as string;
    const cl = checklistMap.get(subId);
    entries.push({
      subId,
      locName: o.locName,
      obsDt: o.obsDt,
      distanceMiles: Math.round(haversineDistanceMiles(lat, lng, o.lat, o.lng)),
      photoCount: cl?.obs.find((obs) => obs.speciesCode === speciesCode)?.mediaCounts?.["P"] ?? 0,
    });
  }

  // Supplementary entries from client allSubIds (only if checklist fetch succeeded)
  for (const subId of supplementarySubIds) {
    const cl = checklistMap.get(subId);
    if (!cl) continue;
    const entry = cl.obs.find((o) => o.speciesCode === speciesCode);
    const locInfo = cl.locId ? locIdToInfo.get(cl.locId) : undefined;
    entries.push({
      subId,
      locName: cl.loc?.name ?? locInfo?.name ?? "Unknown location",
      obsDt: cl.obsDt,
      distanceMiles: cl.loc
        ? Math.round(haversineDistanceMiles(lat, lng, cl.loc.latitude, cl.loc.longitude))
        : locInfo
          ? Math.round(haversineDistanceMiles(lat, lng, locInfo.lat, locInfo.lng))
          : 0,
      photoCount: entry?.mediaCounts?.["P"] ?? 0,
    });
  }

  entries.sort((a, b) => b.obsDt.localeCompare(a.obsDt));

  return NextResponse.json({
    sightingCount: entries.length,
    checklists: entries,
  });
}
