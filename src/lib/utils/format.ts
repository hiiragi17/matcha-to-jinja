// 距離の表示フォーマット。nearby の距離表示など、複数箇所で共通利用する。

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
