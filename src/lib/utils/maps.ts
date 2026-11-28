type LatLng = { latitude: number; longitude: number };

// 緯度経度が解決できたスポットか（削除済みスポットは lat/lng が 0 になる）。
export function hasCoords(spot: LatLng): boolean {
  return spot.latitude !== 0 || spot.longitude !== 0;
}

// 移動手段・所要時間はアプリでは出さず、Google マップ本体（Maps URLs）に任せる。
// Directions API は日本の乗換案内を返さないが、Google マップ本体なら電車・バスも選べる。
// travelmode は付けず、手段はユーザーが Google マップ上で選ぶ。
// https://developers.google.com/maps/documentation/urls/get-started#directions-action
export function googleMapsDirectionsUrl(
  origin: LatLng,
  destination: LatLng,
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
