import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTaxonomy } from "../endpoints/taxonomy";
import { getNearbyHotspots } from "../endpoints/hotspots";
import { getRegionSpeciesList } from "../endpoints/regions";
import { getChecklist } from "../endpoints/checklists";
import type { EBirdClient } from "../client";
import { validTaxon, validTaxonMinimal } from "./fixtures/taxonomy";
import { validHotspot } from "./fixtures/hotspots";
import { validChecklist } from "./fixtures/checklists";

function createMockClient(returnValue: unknown = []) {
  return {
    get: vi.fn().mockResolvedValue(returnValue),
  } as unknown as EBirdClient;
}

describe("getTaxonomy", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls correct path with no params", async () => {
    const client = createMockClient([validTaxon]);
    await getTaxonomy(client);

    expect(client.get).toHaveBeenCalledWith(
      "/ref/taxonomy/ebird",
      {},
      expect.anything(),
    );
  });

  it("passes species filter as comma-separated string", async () => {
    const client = createMockClient([validTaxon, validTaxonMinimal]);
    await getTaxonomy(client, { species: ["varthr", "lewwoo"] });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.species).toBe("varthr,lewwoo");
  });

  it("omits species param when array is empty", async () => {
    const client = createMockClient([]);
    await getTaxonomy(client, { species: [] });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.species).toBeUndefined();
  });
});

describe("getNearbyHotspots", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls correct path with coordinates", async () => {
    const client = createMockClient([validHotspot]);
    await getNearbyHotspots(client, { lat: 37.8, lng: -122.27 });

    expect(client.get).toHaveBeenCalledWith(
      "/ref/hotspot/geo",
      expect.objectContaining({ lat: 37.8, lng: -122.27 }),
      expect.anything(),
    );
  });

  it("clamps dist to max 50 (eBird API km limit)", async () => {
    const client = createMockClient([]);
    await getNearbyHotspots(client, { lat: 37.8, lng: -122.27, dist: 80 });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.dist).toBe(50);
  });

  it("clamps back to max 30", async () => {
    const client = createMockClient([]);
    await getNearbyHotspots(client, { lat: 37.8, lng: -122.27, back: 60 });

    const params = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(params.back).toBe(30);
  });
});

describe("getRegionSpeciesList", () => {
  it("calls correct path with region code", async () => {
    const client = createMockClient(["varthr", "lewwoo"]);
    await getRegionSpeciesList(client, "US-CA");

    expect(client.get).toHaveBeenCalledWith(
      "/product/spplist/US-CA",
      {},
      expect.anything(),
    );
  });

  it("returns array of species codes", async () => {
    const client = createMockClient(["varthr", "lewwoo"]);
    const result = await getRegionSpeciesList(client, "US-CA");

    expect(result).toEqual(["varthr", "lewwoo"]);
  });
});

describe("getChecklist", () => {
  it("calls correct path with submission ID", async () => {
    const client = createMockClient(validChecklist);
    await getChecklist(client, "S123456789");

    expect(client.get).toHaveBeenCalledWith(
      "/product/checklist/view/S123456789",
      {},
      expect.anything(),
    );
  });

  it("returns typed checklist", async () => {
    const client = createMockClient(validChecklist);
    const result = await getChecklist(client, "S123456789");

    expect(result.subId).toBe("S123456789");
    expect(result.obs).toHaveLength(2);
  });
});
