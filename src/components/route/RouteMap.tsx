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
        <APIProvider apiKey={apiKey} libraries={["marker"]}>
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
            <RoutePolyline points={points} />
            <FitBounds points={points} />
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

// スポットを順に結ぶ経路線。@vis.gl/react-google-maps は Polyline を提供しないため、
// useMapsLibrary("maps") で読み込んだ Polyline を imperative に生成・破棄する。
function RoutePolyline({ points }: { points: RouteSpot[] }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  useEffect(() => {
    if (!map || !mapsLib || points.length < 2) return;
    const polyline = new mapsLib.Polyline({
      path: points.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      geodesic: true,
      strokeColor: "#4a90a4",
      strokeOpacity: 0.9,
      strokeWeight: 3,
    });
    polyline.setMap(map);
    return () => polyline.setMap(null);
  }, [map, mapsLib, points]);
  return null;
}

// 全スポットが収まるよう地図をズーム/センタリングする。
function FitBounds({ points }: { points: RouteSpot[] }) {
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
    map.fitBounds(bounds, 64);
  }, [map, coreLib, points]);
  return null;
}
