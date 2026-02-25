import type { EBirdClient } from "../client";
import type { EBirdObservation } from "../types";
import { EBirdObservationArraySchema } from "../types";

export interface NearbyObservationsParams {
  lat: number;
  lng: number;
  dist?: number;
  back?: number;
  maxResults?: number;
  hotspot?: boolean;
  includeProvisional?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function validateCoords(lat: number, lng: number): void {
  if (lat < -90 || lat > 90) throw new Error(`Invalid latitude: ${lat}`);
  if (lng < -180 || lng > 180) throw new Error(`Invalid longitude: ${lng}`);
}

function buildParams(params: NearbyObservationsParams): Record<string, string | number | boolean> {
  validateCoords(params.lat, params.lng);

  const result: Record<string, string | number | boolean> = {
    lat: params.lat,
    lng: params.lng,
  };

  if (params.dist !== undefined) result.dist = clamp(params.dist, 1, 50);
  if (params.back !== undefined) result.back = clamp(params.back, 1, 30);
  if (params.maxResults !== undefined) result.maxResults = params.maxResults;
  if (params.hotspot !== undefined) result.hotspot = params.hotspot;
  if (params.includeProvisional !== undefined) result.includeProvisional = params.includeProvisional;

  return result;
}

export async function getRecentNearbyObservations(
  client: EBirdClient,
  params: NearbyObservationsParams,
): Promise<EBirdObservation[]> {
  return client.get("/data/obs/geo/recent", buildParams(params), EBirdObservationArraySchema);
}

export async function getRecentNearbyNotableObservations(
  client: EBirdClient,
  params: NearbyObservationsParams,
): Promise<EBirdObservation[]> {
  return client.get("/data/obs/geo/recent/notable", buildParams(params), EBirdObservationArraySchema);
}

export async function getRecentNearbySpeciesObservations(
  client: EBirdClient,
  speciesCode: string,
  params: NearbyObservationsParams,
): Promise<EBirdObservation[]> {
  return client.get(
    `/data/obs/geo/recent/${encodeURIComponent(speciesCode)}`,
    buildParams(params),
    EBirdObservationArraySchema,
  );
}
