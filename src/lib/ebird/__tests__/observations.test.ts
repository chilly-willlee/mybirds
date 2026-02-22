import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecentNearbyObservations, getRecentNearbyNotableObservations } from "../endpoints/observations";
import type { EBirdClient } from "../client";
import { validObservationArray } from "./fixtures/observations";

function createMockClient(returnValue: unknown = validObservationArray) {
  return {
    get: vi.fn().mockResolvedValue(returnValue),
  } as unknown as EBirdClient;
}

describe("getRecentNearbyObservations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls correct endpoint path", async () => {
    const client = createMockClient();
    await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27 });

    expect(client.get).toHaveBeenCalledWith(
      "/data/obs/geo/recent",
      expect.objectContaining({ lat: 37.8, lng: -122.27 }),
      expect.anything(),
    );
  });

  it("passes optional params", async () => {
    const client = createMockClient();
    await getRecentNearbyObservations(client, {
      lat: 37.8, lng: -122.27, dist: 25, back: 14, maxResults: 100, hotspot: true,
    });

    expect(client.get).toHaveBeenCalledWith(
      "/data/obs/geo/recent",
      expect.objectContaining({ dist: 25, back: 14, maxResults: 100, hotspot: true }),
      expect.anything(),
    );
  });

  it("clamps dist to max 50 (eBird API km limit)", async () => {
    const client = createMockClient();
    await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27, dist: 80 });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.dist).toBe(50);
  });

  it("clamps dist to min 1", async () => {
    const client = createMockClient();
    await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27, dist: 0 });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.dist).toBe(1);
  });

  it("clamps back to max 30", async () => {
    const client = createMockClient();
    await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27, back: 60 });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.back).toBe(30);
  });

  it("clamps back to min 1", async () => {
    const client = createMockClient();
    await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27, back: -5 });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.back).toBe(1);
  });

  it("throws on invalid latitude", async () => {
    const client = createMockClient();
    await expect(
      getRecentNearbyObservations(client, { lat: 95, lng: -122.27 }),
    ).rejects.toThrow(/latitude/i);
  });

  it("throws on invalid longitude", async () => {
    const client = createMockClient();
    await expect(
      getRecentNearbyObservations(client, { lat: 37.8, lng: -200 }),
    ).rejects.toThrow(/longitude/i);
  });

  it("returns typed observations", async () => {
    const client = createMockClient();
    const result = await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27 });

    expect(result).toHaveLength(2);
    expect(result[0].comName).toBe("Varied Thrush");
  });

  it("handles empty results", async () => {
    const client = createMockClient([]);
    const result = await getRecentNearbyObservations(client, { lat: 37.8, lng: -122.27 });

    expect(result).toEqual([]);
  });
});

describe("getRecentNearbyNotableObservations", () => {
  it("calls correct endpoint path", async () => {
    const client = createMockClient();
    await getRecentNearbyNotableObservations(client, { lat: 37.8, lng: -122.27 });

    expect(client.get).toHaveBeenCalledWith(
      "/data/obs/geo/recent/notable",
      expect.objectContaining({ lat: 37.8, lng: -122.27 }),
      expect.anything(),
    );
  });
});
