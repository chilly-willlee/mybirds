import type { EBirdClient } from "../client";
import type { EBirdHotspot } from "../types";
import { EBirdHotspotArraySchema } from "../types";

export interface NearbyHotspotsParams {
  lat: number;
  lng: number;
  dist?: number;
  back?: number;
}

export async function getNearbyHotspots(
  client: EBirdClient,
  params: NearbyHotspotsParams,
): Promise<EBirdHotspot[]> {
  const queryParams: Record<string, string | number | boolean> = {
    lat: params.lat,
    lng: params.lng,
  };
  if (params.dist !== undefined) queryParams.dist = Math.min(50, Math.max(1, params.dist));
  if (params.back !== undefined) queryParams.back = Math.min(30, Math.max(1, params.back));
  return client.get("/ref/hotspot/geo", queryParams, EBirdHotspotArraySchema);
}
