"use client";

import { useEffect, useMemo } from "react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { RouteSpot } from "@/types";

type RouteMapProps = {
  spots: RouteSpot[];
};

const KYOTO_CENTER = { lat: 35.0116, lng: 135.7681 };

// 緯度経度が解決できたスポットのみ地図に載せる（削除済みスポットは lat/lng が 0）。
function hasCoords(spot: RouteSpot): boolean {
  return spot.latitude !== 0 || spot.longitude !== 0;
}

export default function RouteMap({ spots }: RouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  // 参照を安定させ、RoutePolyline / FitBounds の effect が親の再描画で
  // 無駄に再実行されないようにする（ユーザーの pan/zoom を保持）。
  const points = useMemo(() => spots.filter(hasCoords), [spots]);

  if (!apiKey) {
    return (
      <div className="border border-bengara bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-relaxed text-bengara-dark">
          Google Maps の API キーが設定されていません。NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          を .env.local に設定すると地図が表示されます。
        </p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="border border-line bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm text-muted">
          地図に表示できるスポットがありません。
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line bg-paper">
      <div className="h-[50vh] min-h-[360px] w-full">
        <APIProvider apiKey={apiKey} libraries={["marker", "geometry"]}>
          <Map
            mapId={
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID"
            }
            defaultCenter={
              points[0]
                ? { lat: points[0].latitude, lng: points[0].longitude }
                : KYOTO_CENTER
            }
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            clickableIcons={false}
          >
            {points.map((spot) => (
              <AdvancedMarker
                key={`${spot.spot_type}-${spot.id}-${spot.position}`}
                position={{ lat: spot.latitude, lng: spot.longitude }}
                title={spot.name}
              >
                <OrderBadge position={spot.position} kind={spot.spot_type} />
              </AdvancedMarker>
            ))}
            <RouteLegs points={points} />
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

function OrderBadge({
  position,
  kind,
}: {
  position: number;
  kind: "greentea" | "temple";
}) {
  const color = kind === "greentea" ? "#608060" : "#905050";
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-paper font-sans-jp text-sm font-semibold shadow-[0_2px_0_rgba(61,51,34,0.15)]"
      style={{ borderColor: color, color }}
    >
      {position}
    </div>
  );
}

// leg（隣接スポット間）ごとの描画データを算出する。型は google.maps.* を明示せず
// useMapsLibrary の戻り値から推論させる（このプロジェクトの tsconfig は
// @types/google.maps をグローバルに含めていないため、型名を直接書けない）。
//
// route_polyline_to_next は API 上の「次スポット」までの道なり経路を指す。座標欠落
// スポット（削除済み等）が points から除外されている場合、points 上で隣り合う2点が
// 元のルート順でも隣接しているとは限らない（例: A→削除されたB→C の場合、A の
// route_polyline_to_next は A→B の経路であり A→C には使えない）。position が
// 連番かどうかで判定し、非連番なら従来どおり2点間の直線にフォールバックする。
function useRouteLegs(points: RouteSpot[]) {
  const geometryLib = useMapsLibrary("geometry");
  return useMemo(() => {
    return points.slice(0, -1).map((from, i) => {
      const to = points[i + 1];
      const adjacent = to.position === from.position + 1;
      const encoded = adjacent ? from.route_polyline_to_next : null;
      const decoded = encoded ? geometryLib?.encoding.decodePath(encoded) : null;
      return {
        path: decoded ?? [
          { lat: from.latitude, lng: from.longitude },
          { lat: to.latitude, lng: to.longitude },
        ],
        // true: route_polyline_to_next をデコードした実際の道なり経路。false: 直線フォールバック。
        isRoute: !!decoded,
      };
    });
  }, [points, geometryLib]);
}

// legs は RouteLegs で一度だけ算出し、RoutePolyline / FitBounds へ props で渡す
// （各コンポーネントが個別に useRouteLegs を呼ぶと geometry の decodePath が
// leg ごとに2回ずつ実行されてしまうため）。
function RouteLegs({ points }: { points: RouteSpot[] }) {
  const legs = useRouteLegs(points);
  return (
    <>
      <RoutePolyline legs={legs} />
      <FitBounds points={points} legs={legs} />
    </>
  );
}

type RouteLegsList = ReturnType<typeof useRouteLegs>;

// スポットを順に結ぶ経路線。@vis.gl/react-google-maps は Polyline を提供しないため、
// useMapsLibrary("maps") で読み込んだ Polyline を imperative に生成・破棄する。
// leg ごとに描画方法（道なり経路 or 直線）が異なりうるため、区間ごとに個別の
// Polyline を生成する。
function RoutePolyline({ legs }: { legs: RouteLegsList }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  useEffect(() => {
    if (!map || !mapsLib || legs.length === 0) return;

    const polylines = legs.map(
      (leg) =>
        new mapsLib.Polyline({
          path: leg.path,
          geodesic: !leg.isRoute,
          strokeColor: "#4a90a4",
          strokeOpacity: 0.9,
          strokeWeight: 3,
        }),
    );

    for (const polyline of polylines) polyline.setMap(map);
    return () => {
      for (const polyline of polylines) polyline.setMap(null);
    };
  }, [map, mapsLib, legs]);
  return null;
}

// 全スポットが収まるよう地図をズーム/センタリングする。
// デコードされた道なり経路が2点間の直線の矩形からはみ出す場合に備え、
// 経路の頂点も bounds に含める。
function FitBounds({ points, legs }: { points: RouteSpot[]; legs: RouteLegsList }) {
  const map = useMap();
  const coreLib = useMapsLibrary("core");
  useEffect(() => {
    if (!map || !coreLib || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter({ lat: points[0].latitude, lng: points[0].longitude });
      map.setZoom(15);
      return;
    }
    const bounds = new coreLib.LatLngBounds();
    for (const p of points) {
      bounds.extend({ lat: p.latitude, lng: p.longitude });
    }
    for (const leg of legs) {
      if (!leg.isRoute) continue;
      for (const vertex of leg.path) bounds.extend(vertex);
    }
    map.fitBounds(bounds, 64);
  }, [map, coreLib, points, legs]);
  return null;
}
