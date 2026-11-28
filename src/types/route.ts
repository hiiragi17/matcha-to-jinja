import type { Meta } from "./api";

export type SpotType = "greentea" | "temple";
// 作成・更新リクエスト（POST/PATCH の body の route キー配下）。
// spots の配列順がそのままルート順になる。移動手段・所要時間は扱わない
// （行き方は Google マップのリンクに任せる）。
export interface RouteSpotInput {
  spot_type: SpotType;
  spot_id: number;
}

export interface RouteInput {
  name: string;
  description?: string;
  // PATCH で省略すると name/description のみ部分更新（既存スポット保持）。
  spots?: RouteSpotInput[];
}

// 詳細レスポンスの各スポット（position 昇順）。
export interface RouteSpot {
  position: number;
  spot_type: SpotType;
  id: number;
  name: string;
  address: string;
  access: string;
  latitude: number;
  longitude: number;
  img: string;
  // 次スポットまでの直線距離(m)。最後の要素は null。
  distance_to_next_meters: number | null;
}

export interface RouteDetail {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  spots: RouteSpot[];
  // 合計距離(m 整数)。直線距離の合計。
  total_distance_meters: number;
}

// 一覧レスポンス要素（軽量シリアライザ。spots は返さず件数のみ）。
export interface RouteListItem {
  id: number;
  name: string;
  description: string | null;
  spot_count: number;
  created_at: string;
  updated_at: string;
}

export interface RouteListResponse {
  data: RouteListItem[];
  meta: Meta;
}

export interface RouteDetailResponse {
  data: RouteDetail;
}
