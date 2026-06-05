// Haversine の公式で 2 点間の距離（メートル）を求める。
// 地球を半径 6371km の球と仮定するため、極近傍や数千 km スケールでは誤差が出る。
// 京都市内の探索（半径 1.5km 程度）には十分な精度。

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export type LatLng = {
  latitude: number;
  longitude: number;
};

export function distanceMeters(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(
    EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
  );
}
