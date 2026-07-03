import type { Transport } from "@/types";

// 距離・所要時間の表示フォーマット。routes（モデルルート）の距離/時間表示や
// nearby の距離表示など、複数箇所で共通利用する。

// メートルを「◯m」/「◯.◯km」で表す。1000m 未満は m、以上は km（小数第1位）。
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
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
export function transportLabel(transport: Transport): string {
  switch (transport) {
    case "walk":
      return "徒歩";
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
