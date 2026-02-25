import { NextRequest, NextResponse } from "next/server";

interface ChecklistPhoto {
  assetId: string;
  speciesCode: string;
}

interface CacheEntry {
  photos: ChecklistPhoto[];
  expiresAt: number;
}

const checklistPhotoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchChecklistPhotos(subId: string): Promise<ChecklistPhoto[]> {
  const url = `https://search.macaulaylibrary.org/api/v1/search?subId=${subId}&mediaType=Photo`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "NewBirds/1.0 (https://github.com/new-birds)" },
    signal: AbortSignal.timeout(5000),
  });

  if (!resp.ok) return [];

  const data = await resp.json();
  const content: Record<string, unknown>[] = data?.results?.content ?? [];

  return content
    .filter((item) => item.assetId && item.speciesCode)
    .map((item) => ({
      assetId: item.assetId as string,
      speciesCode: item.speciesCode as string,
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

  const candidates: { assetId: string; checklistId: string; priority: number }[] = [];

  await Promise.all(
    subIds.map(async (subId, index) => {
      let cached = checklistPhotoCache.get(subId);
      if (!cached || cached.expiresAt <= now) {
        try {
          const fetched = await fetchChecklistPhotos(subId);
          cached = { photos: fetched, expiresAt: now + CACHE_TTL_MS };
          checklistPhotoCache.set(subId, cached);
        } catch {
          return;
        }
      }
      for (const photo of cached.photos) {
        if (photo.speciesCode === speciesCode) {
          candidates.push({ assetId: photo.assetId, checklistId: subId, priority: index });
        }
      }
    }),
  );

  const photos = candidates
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((p) => ({
      url: `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/${p.assetId}/320`,
      checklistUrl: `https://ebird.org/checklist/${p.checklistId}`,
    }));

  return NextResponse.json({ photos });
}
