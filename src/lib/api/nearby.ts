import type { NearbyResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

export type NearbySearchParams = {
  lat: number;
  lng: number;
  radius?: number;
};

export function getNearby(
  params: NearbySearchParams,
): Promise<NearbyResponse> {
  return apiClient<NearbyResponse>(`/nearby${buildQuery(params)}`);
}
