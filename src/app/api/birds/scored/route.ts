import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { getEBirdClient, getCache } from "@/lib/ebird/singleton";
import { getRecentNearbyObservations, getRecentNearbyNotableObservations } from "@/lib/ebird/endpoints/observations";
import { getChecklist } from "@/lib/ebird/endpoints/checklists";
import { CACHE_TTL, observationsCacheKey, notableCacheKey, checklistCacheKey } from "@/lib/ebird/cache";
import { milesToKm } from "@/lib/geo";
import { checkRateLimit } from "@/lib/rate-limit";
import { scoreObservations } from "@/lib/scoring/rarity";
import { auth } from "@/lib/auth";
import { getLifeList } from "@/lib/db/life-list";
import type { EBirdObservation, EBirdChecklist } from "@/lib/ebird/types";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMiles: z.coerce.number().min(1).max(25).default(10),
  back: z.coerce.number().min(1).max(30).default(14),
});

const MAX_CHECKLIST_FETCHES = 50;

async function buildCommentSpecies(
  recentObs: EBirdObservation[],
  notableObs: EBirdObservation[],
  client: ReturnType<typeof getEBirdClient>,
  cache: ReturnType<typeof getCache>,
): Promise<Set<string>> {
  const notableSubIds = notableObs.flatMap((o) => (o.subId ? [o.subId] : []));
  const recentSubIds = recentObs.flatMap((o) => (o.subId ? [o.subId] : []));
  const uniqueSubIds = Array.from(new Set([...notableSubIds, ...recentSubIds])).slice(
    0,
    MAX_CHECKLIST_FETCHES,
  );

  const commentSpecies = new Set<string>();

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
      for (const obs of checklist.obs) {
        if (obs.comments) {
          commentSpecies.add(obs.speciesCode);
        }
      }
    }),
  );

  return commentSpecies;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { lat, lng, radiusMiles, back } = parsed.data;
  const distKm = Math.round(milesToKm(radiusMiles));
  const client = getEBirdClient();
  const cache = getCache();

  const recentKey = observationsCacheKey(lat, lng, distKm, back);
  let recentObs = await cache.get<EBirdObservation[]>(recentKey);
  if (!recentObs) {
    recentObs = await getRecentNearbyObservations(client, { lat, lng, dist: distKm, back });
    await cache.set(recentKey, recentObs, CACHE_TTL.observations);
  }

  const notKey = notableCacheKey(lat, lng, distKm, back);
  let notableObs = await cache.get<EBirdObservation[]>(notKey);
  if (!notableObs) {
    notableObs = await getRecentNearbyNotableObservations(client, { lat, lng, dist: distKm, back });
    await cache.set(notKey, notableObs, CACHE_TTL.notable);
  }

  const [session, commentSpecies] = await Promise.all([
    auth(),
    buildCommentSpecies(recentObs, notableObs, client, cache),
  ]);

  const lifeList = session?.user?.id ? await getLifeList(session.user.id) : undefined;

  const scored = scoreObservations({
    recentObs,
    notableObs,
    lifeList: lifeList?.length ? lifeList : undefined,
    commentSpecies,
    userLat: lat,
    userLng: lng,
    back,
  });

  return NextResponse.json(scored, {
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
