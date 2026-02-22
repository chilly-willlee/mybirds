import { NextRequest, NextResponse } from "next/server";

interface SpeciesPhoto {
  assetId: string;
  checklistId: string;
}

interface CacheEntry {
  photos: SpeciesPhoto[];
  expiresAt: number;
}

const speciesPhotoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchSpeciesPhotos(speciesCode: string): Promise<SpeciesPhoto[]> {
  const url = `https://search.macaulaylibrary.org/api/v1/search?taxonCode=${speciesCode}&mediaType=Photo&count=100&sort=upload_date_desc`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "NewBirds/1.0 (https://github.com/new-birds)" },
    signal: AbortSignal.timeout(5000),
  });

  if (!resp.ok) return [];

  const data = await resp.json();
  const content: Record<string, unknown>[] = data?.results?.content ?? [];

  return content
    .filter((item) => item.assetId && item.eBirdChecklistId)
    .map((item) => ({
      assetId: item.assetId as string,
      checklistId: item.eBirdChecklistId as string,
    }));
}

export async function GET(request: NextRequest) {
  const subIdsParam = request.nextUrl.searchParams.get("subIds");
  const speciesCode = request.nextUrl.searchParams.get("speciesCode");

  if (!subIdsParam || !speciesCode) {
    return NextResponse.json({ error: "subIds and speciesCode required" }, { status: 400 });
  }

  const subIds = subIdsParam.split(",").filter(Boolean);
  const now = Date.now();

  let cached = speciesPhotoCache.get(speciesCode);
  if (!cached || cached.expiresAt <= now) {
    try {
      const fetched = await fetchSpeciesPhotos(speciesCode);
      cached = { photos: fetched, expiresAt: now + CACHE_TTL_MS };
      speciesPhotoCache.set(speciesCode, cached);
    } catch {
      return NextResponse.json({ photos: [] });
    }
  }

  const subIdSet = new Set(subIds);
  const subIdOrder = new Map(subIds.map((id, i) => [id, i]));

  const photos = cached.photos
    .filter((p) => subIdSet.has(p.checklistId))
    .sort((a, b) => (subIdOrder.get(a.checklistId) ?? 999) - (subIdOrder.get(b.checklistId) ?? 999))
    .slice(0, 3)
    .map((p) => ({
      url: `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${p.assetId}/320`,
      checklistUrl: `https://ebird.org/checklist/${p.checklistId}`,
    }));

  return NextResponse.json({ photos });
}
