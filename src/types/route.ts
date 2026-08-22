import type { Meta } from "./api";

export type SpotType = "greentea" | "temple";
// train/bus/car は過去データ（手動選択時代）との互換のため残るが、新規には付かない。
// walk/transit は移動手段の自動決定（バックエンドが区間距離とDirections APIの結果から
// 決める）で実際に付き得る値。
export type Transport = "walk" | "train" | "bus" | "car" | "transit" | null;

// 作成・更新リクエスト（POST/PATCH の body の route キー配下）。
// spots の配列順がそのままルート順になる。移動手段はユーザーが選ぶのではなく
// バックエンドが自動決定するため、リクエストには含めない。
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
  // 次スポットへの移動手段。最後の要素や未設定は null。
  transport: Transport;
  id: number;
  name: string;
  address: string;
  access: string;
  latitude: number;
  longitude: number;
  img: string;
  // 次スポットまでの直線距離(m)。最後の要素は null。
  distance_to_next_meters: number | null;
  // Directions API の経路距離/所要時間。未算出・失敗時は null。
  route_distance_to_next_meters: number | null;
  duration_to_next_seconds: number | null;
  // 次スポットまでの道なり経路（Google Encoded Polyline Algorithm Format）。
  // 地図描画に使う。未算出・失敗時は null（直線描画にフォールバックする）。
  route_polyline_to_next: string | null;
}

export interface RouteDetail {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  spots: RouteSpot[];
  // 合計距離(m 整数)。経路距離優先＋無い leg は直線距離でフォールバック。
  total_distance_meters: number;
  // 合計所要時間(秒)。算出済み leg のみ合算。1つも無ければ null。
  total_duration_seconds: number | null;
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
