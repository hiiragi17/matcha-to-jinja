import type { Transport } from "@/types";

// 距離・所要時間の表示フォーマット。routes（モデルルート）の距離/時間表示や
// nearby の距離表示など、複数箇所で共通利用する。

// メートルを「◯m」/「◯.◯km」で表す。1000m 未満は m、以上は km（小数第1位）。
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// 徒歩の想定速度（不動産表示等で一般的に使われる分速）。
const WALK_METERS_PER_MINUTE = 80;

// メートルの直線距離を徒歩分数に換算して「徒歩◯分」で表す。
// 端数は切り上げ、0分表示を避けるため最低1分にする。あくまで直線距離ベースの概算。
export function formatWalkingMinutes(meters: number): string {
  const minutes = Math.max(1, Math.ceil(meters / WALK_METERS_PER_MINUTE));
  return `徒歩${minutes}分`;
}

// 秒を「約N分」/「約N時間M分」で表す。算出できない（null）場合は「所要時間不明」。
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "所要時間不明";
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `約${minutes}分`;
  if (minutes === 0) return `約${hours}時間`;
  return `約${hours}時間${minutes}分`;
}

// 移動手段の日本語ラベル。null（＝ルート末尾など）は空表示にできるよう "" を返す。
// walk/transit はバックエンドが自動決定する現行の値。train/bus/car は手動選択時代の
// 過去データ表示用に残す。
export function transportLabel(transport: Transport): string {
  switch (transport) {
    case "walk":
      return "徒歩";
    case "transit":
      return "電車・バス";
    case "train":
      return "電車";
    case "bus":
      return "バス";
    case "car":
      return "車";
    default:
      return "";
  }
}
