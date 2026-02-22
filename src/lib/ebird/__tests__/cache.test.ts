import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  InMemoryCache,
  CACHE_TTL,
  roundCoord,
  observationsCacheKey,
  notableCacheKey,
  taxonomyCacheKey,
  hotspotsCacheKey,
  checklistCacheKey,
  regionSpeciesCacheKey,
} from "../cache";

describe("InMemoryCache", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for missing key", async () => {
    expect(await cache.get("nonexistent")).toBeNull();
  });

  it("stores and retrieves a value", async () => {
    await cache.set("key1", { data: "hello" }, 60_000);
    expect(await cache.get("key1")).toEqual({ data: "hello" });
  });

  it("returns null for expired entry", async () => {
    await cache.set("key1", "value", 1_000);
    vi.advanceTimersByTime(1_001);
    expect(await cache.get("key1")).toBeNull();
  });

  it("returns value before TTL expires", async () => {
    await cache.set("key1", "value", 5_000);
    vi.advanceTimersByTime(4_999);
    expect(await cache.get("key1")).toBe("value");
  });

  it("deletes a specific key", async () => {
    await cache.set("key1", "value", 60_000);
    await cache.delete("key1");
    expect(await cache.get("key1")).toBeNull();
  });

  it("clears all entries", async () => {
    await cache.set("a", 1, 60_000);
    await cache.set("b", 2, 60_000);
    await cache.clear();
    expect(cache.size).toBe(0);
  });

  it("evicts oldest entry when maxEntries reached", async () => {
    const small = new InMemoryCache(3);
    await small.set("a", 1, 60_000);
    await small.set("b", 2, 60_000);
    await small.set("c", 3, 60_000);
    await small.set("d", 4, 60_000);

    expect(await small.get("a")).toBeNull();
    expect(await small.get("d")).toBe(4);
    expect(small.size).toBe(3);
  });

  it("evicts expired entries before oldest on overflow", async () => {
    const small = new InMemoryCache(3);
    await small.set("a", 1, 1_000);
    await small.set("b", 2, 60_000);
    await small.set("c", 3, 60_000);

    vi.advanceTimersByTime(1_001);

    await small.set("d", 4, 60_000);
    expect(await small.get("a")).toBeNull();
    expect(await small.get("b")).toBe(2);
    expect(await small.get("d")).toBe(4);
  });

  it("tracks size correctly", async () => {
    expect(cache.size).toBe(0);
    await cache.set("a", 1, 60_000);
    expect(cache.size).toBe(1);
    await cache.set("b", 2, 60_000);
    expect(cache.size).toBe(2);
    await cache.delete("a");
    expect(cache.size).toBe(1);
  });
});

describe("CACHE_TTL", () => {
  it("has expected TTL values", () => {
    expect(CACHE_TTL.observations).toBe(30 * 60 * 1000);
    expect(CACHE_TTL.notable).toBe(30 * 60 * 1000);
    expect(CACHE_TTL.taxonomy).toBe(24 * 60 * 60 * 1000);
    expect(CACHE_TTL.hotspots).toBe(6 * 60 * 60 * 1000);
    expect(CACHE_TTL.checklists).toBe(24 * 60 * 60 * 1000);
    expect(CACHE_TTL.regionSpecies).toBe(6 * 60 * 60 * 1000);
  });
});

describe("roundCoord", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundCoord(37.7749)).toBe(37.77);
    expect(roundCoord(-122.4194)).toBe(-122.42);
  });

  it("leaves already-rounded values unchanged", () => {
    expect(roundCoord(37.80)).toBe(37.8);
    expect(roundCoord(10)).toBe(10);
  });
});

describe("cache key generators", () => {
  it("observationsCacheKey rounds coords", () => {
    const key1 = observationsCacheKey(37.7731, -122.4194, 25, 14);
    const key2 = observationsCacheKey(37.7742, -122.4213, 25, 14);
    expect(key1).toBe(key2);
    expect(key1).toBe("obs:37.77:-122.42:25:14");
  });

  it("notableCacheKey rounds coords", () => {
    expect(notableCacheKey(37.80, -122.27, 10, 7)).toBe("notable:37.8:-122.27:10:7");
  });

  it("taxonomyCacheKey with no species", () => {
    expect(taxonomyCacheKey()).toBe("taxonomy:all");
    expect(taxonomyCacheKey([])).toBe("taxonomy:all");
  });

  it("taxonomyCacheKey sorts species codes", () => {
    expect(taxonomyCacheKey(["lewwoo", "varthr"])).toBe("taxonomy:lewwoo,varthr");
    expect(taxonomyCacheKey(["varthr", "lewwoo"])).toBe("taxonomy:lewwoo,varthr");
  });

  it("hotspotsCacheKey rounds coords", () => {
    expect(hotspotsCacheKey(37.7749, -122.4194, 25)).toBe("hotspots:37.77:-122.42:25");
  });

  it("checklistCacheKey uses subId directly", () => {
    expect(checklistCacheKey("S123456789")).toBe("checklist:S123456789");
  });

  it("regionSpeciesCacheKey uses region code", () => {
    expect(regionSpeciesCacheKey("US-CA")).toBe("region:US-CA");
  });
});
