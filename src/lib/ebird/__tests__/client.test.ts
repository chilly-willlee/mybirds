import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod/v4";
import { EBirdClient, EBirdApiError } from "../client";

const TEST_API_KEY = "test-key-12345";
const TEST_BASE_URL = "https://mock.ebird.org/v2";

const StringArraySchema = z.array(z.string());

function createClient(overrides?: Partial<ConstructorParameters<typeof EBirdClient>[0]>) {
  return new EBirdClient({
    apiKey: TEST_API_KEY,
    baseUrl: TEST_BASE_URL,
    retryDelayMs: 1,
    ...overrides,
  });
}

function mockFetch(response: { status: number; body?: unknown; statusText?: string }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText ?? "OK",
    json: () => Promise.resolve(response.body),
  });
}

describe("EBirdClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct URL with query params", async () => {
    const fetchMock = mockFetch({ status: 200, body: ["varthr", "lewwoo"] });
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient();
    await client.get("/data/obs/geo/recent", { lat: 37.8, lng: -122.27, back: 14 }, StringArraySchema);

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("/v2/data/obs/geo/recent");
    expect(calledUrl).toContain("lat=37.8");
    expect(calledUrl).toContain("lng=-122.27");
    expect(calledUrl).toContain("back=14");
  });

  it("sends x-ebirdapitoken header", async () => {
    const fetchMock = mockFetch({ status: 200, body: [] });
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient();
    await client.get("/test", {}, StringArraySchema);

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["x-ebirdapitoken"]).toBe(TEST_API_KEY);
  });

  it("validates response with Zod schema", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: ["varthr"] }));

    const client = createClient();
    const result = await client.get("/test", {}, StringArraySchema);
    expect(result).toEqual(["varthr"]);
  });

  it("throws on Zod validation failure", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 200, body: [1, 2, 3] }));

    const client = createClient();
    await expect(client.get("/test", {}, StringArraySchema)).rejects.toThrow();
  });

  it("throws EBirdApiError on 400", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 400, statusText: "Bad Request" }));

    const client = createClient();
    await expect(client.get("/test", {}, StringArraySchema)).rejects.toThrow(EBirdApiError);
  });

  it("throws EBirdApiError on 401", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 401, statusText: "Unauthorized" }));

    const client = createClient();
    const err = await client.get("/test", {}, StringArraySchema).catch((e) => e);
    expect(err).toBeInstanceOf(EBirdApiError);
    expect(err.status).toBe(401);
  });

  it("does not retry on 4xx errors", async () => {
    const fetchMock = mockFetch({ status: 404, statusText: "Not Found" });
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient();
    await client.get("/test", {}, StringArraySchema).catch(() => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on 500 errors", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Server Error", json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: "Service Unavailable", json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK", json: () => Promise.resolve(["ok"]) });
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({ retries: 2 });
    const result = await client.get("/test", {}, StringArraySchema);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual(["ok"]);
  });

  it("throws after exhausting retries on 5xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 503, statusText: "Service Unavailable", json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({ retries: 2 });
    await expect(client.get("/test", {}, StringArraySchema)).rejects.toThrow(EBirdApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("handles timeout", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, opts: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        opts.signal.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({ timeoutMs: 10, retries: 0 });
    await expect(client.get("/test", {}, StringArraySchema)).rejects.toThrow(/timeout/i);
  });
});
