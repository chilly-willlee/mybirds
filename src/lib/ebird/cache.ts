export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.store.size >= this.maxEntries) {
      this.evictExpired();
      if (this.store.size >= this.maxEntries) {
        const oldest = this.store.keys().next().value;
        if (oldest !== undefined) this.store.delete(oldest);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const CACHE_TTL = {
  observations: 30 * 60 * 1000,
  notable: 30 * 60 * 1000,
  taxonomy: 24 * 60 * 60 * 1000,
  hotspots: 6 * 60 * 60 * 1000,
  checklists: 24 * 60 * 60 * 1000,
  regionSpecies: 6 * 60 * 60 * 1000,
} as const;

export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function observationsCacheKey(lat: number, lng: number, dist: number, back: number): string {
  return `obs:${roundCoord(lat)}:${roundCoord(lng)}:${dist}:${back}`;
}

export function notableCacheKey(lat: number, lng: number, dist: number, back: number): string {
  return `notable:${roundCoord(lat)}:${roundCoord(lng)}:${dist}:${back}`;
}

export function taxonomyCacheKey(speciesCodes?: string[]): string {
  if (!speciesCodes?.length) return "taxonomy:all";
  return `taxonomy:${speciesCodes.sort().join(",")}`;
}

export function hotspotsCacheKey(lat: number, lng: number, dist: number): string {
  return `hotspots:${roundCoord(lat)}:${roundCoord(lng)}:${dist}`;
}

export function checklistCacheKey(subId: string): string {
  return `checklist:${subId}`;
}

export function regionSpeciesCacheKey(regionCode: string): string {
  return `region:${regionCode}`;
}
