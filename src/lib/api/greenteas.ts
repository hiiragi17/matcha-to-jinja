import type { GreenteaDetailResponse, GreenteaListResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

export type GreenteaSearchParams = {
  page?: number;
  q?: {
    name_cont?: string;
    genres_id_eq?: number;
  };
};

export function getGreenteas(
  params?: GreenteaSearchParams,
): Promise<GreenteaListResponse> {
  return apiClient<GreenteaListResponse>(`/greenteas${buildQuery(params)}`);
}

export function getGreentea(
  id: number | string,
): Promise<GreenteaDetailResponse> {
  return apiClient<GreenteaDetailResponse>(`/greenteas/${id}`);
}
