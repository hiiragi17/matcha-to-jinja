import type { TempleDetailResponse, TempleListResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

export type TempleSearchParams = {
  page?: number;
  q?: {
    name_cont?: string;
    // 複数エリア選択（OR検索）。Rails 側の Ransack allowlist が受け付ける
    // 複数値述語キー（`_eq_any`）を使う。単一選択でも要素数 1 の配列で渡す。
    temple_areas_area_id_eq_any?: number[];
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
