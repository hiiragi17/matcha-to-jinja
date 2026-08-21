import type { GreenteaDetailResponse, GreenteaListResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

export type GreenteaSearchParams = {
  page?: number;
  q?: {
    name_cont?: string;
    // 複数ジャンル選択（OR検索）。Rails 側の Ransack allowlist が受け付ける
    // 複数値述語キー（`_eq_any`）を使う。単一選択でも要素数 1 の配列で渡す。
    greentea_genres_genre_id_eq_any?: number[];
  };
};

// authToken を渡すと liked_by_current_user / 口コミの owned_by_current_user が反映される。
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
