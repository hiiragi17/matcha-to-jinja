import type { GreenteaDetailResponse, GreenteaListResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

export type GreenteaSearchParams = {
  page?: number;
  q?: {
    name_cont?: string;
    genres_id_eq?: number;
  };
};

// authToken を渡すと liked_by_current_user / コメントの owned_by_current_user が反映される。
// 未指定（未ログイン or 公開ページ）でも公開情報は取得できる。
export function getGreenteas(
  params?: GreenteaSearchParams,
  authToken?: string,
): Promise<GreenteaListResponse> {
  return apiClient<GreenteaListResponse>(`/greenteas${buildQuery(params)}`, {
    authToken,
  });
}

export function getGreentea(
  id: number | string,
  authToken?: string,
): Promise<GreenteaDetailResponse> {
  return apiClient<GreenteaDetailResponse>(`/greenteas/${id}`, { authToken });
}
