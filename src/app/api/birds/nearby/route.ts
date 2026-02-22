import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { getEBirdClient, getCache } from "@/lib/ebird/singleton";
import { getRecentNearbyObservations } from "@/lib/ebird/endpoints/observations";
import { CACHE_TTL, observationsCacheKey } from "@/lib/ebird/cache";
import { milesToKm } from "@/lib/geo";
import { checkRateLimit } from "@/lib/rate-limit";
import type { EBirdObservation } from "@/lib/ebird/types";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMiles: z.coerce.number().min(1).max(25).default(10),
  back: z.coerce.number().min(1).max(30).default(14),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
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

  const cache = getCache();
  const cacheKey = observationsCacheKey(lat, lng, distKm, back);
  const cached = await cache.get<EBirdObservation[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", "X-RateLimit-Remaining": String(remaining) },
    });
  }

  const client = getEBirdClient();
  const observations = await getRecentNearbyObservations(client, {
    lat, lng, dist: distKm, back,
  });

  await cache.set(cacheKey, observations, CACHE_TTL.observations);

  return NextResponse.json(observations, {
    headers: { "X-Cache": "MISS", "X-RateLimit-Remaining": String(remaining) },
  });
}
