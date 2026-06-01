import type { TempleDetailResponse, TempleListResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

export type TempleSearchParams = {
  page?: number;
  q?: {
    name_cont?: string;
    areas_id_eq?: number;
  };
};

export function getTemples(
  params?: TempleSearchParams,
  authToken?: string,
): Promise<TempleListResponse> {
  return apiClient<TempleListResponse>(`/temples${buildQuery(params)}`, {
    authToken,
  });
}

export function getTemple(
  id: number | string,
  authToken?: string,
): Promise<TempleDetailResponse> {
  return apiClient<TempleDetailResponse>(`/temples/${id}`, { authToken });
}
