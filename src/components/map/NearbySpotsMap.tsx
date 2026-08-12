"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";
import { ChawanIcon, ToriiIcon } from "@/components/brand/icons";
import type { NearbySpot } from "@/types";

type SpotKind = "greentea" | "temple";

type NearbySpotsMapProps = {
  // 詳細ページ本体のスポット（地図の中心・青マーカー）。
  origin: { lat: number; lng: number; name: string };
  // 周辺スポット一覧（既に SSR で取得済みのものをそのまま渡す。再フェッチしない）。
  spots: NearbySpot[];
  // spots がどちらの種類か（アイコン・リンク先の切り替えに使う）。
  kind: SpotKind;
  emptyMessage: string;
};

const KIND_CONFIG = {
  greentea: { href: "/greenteas", Icon: ChawanIcon, color: "#608060" },
  temple: { href: "/temples", Icon: ToriiIcon, color: "#905050" },
} as const;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function NearbySpotsMap({
  origin,
  spots,
  kind,
  emptyMessage,
}: NearbySpotsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [selected, setSelected] = useState<NearbySpot | null>(null);
  const { href, Icon, color } = KIND_CONFIG[kind];

  if (!apiKey) {
    return (
      <p className="border border-line-soft bg-paper px-5 py-6 text-center font-serif-jp text-sm text-muted">
        地図の表示には Google Maps の API キー設定が必要です。
      </p>
    );
  }

  if (spots.length === 0) {
    return (
      <p className="border border-line-soft bg-paper px-5 py-6 text-center font-serif-jp text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["marker"]}>
      <div className="border border-line-soft bg-paper">
        <div className="h-[360px] w-full">
          <Map
            mapId={
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ||
              "DEMO_MAP_ID"
            }
            defaultCenter={origin}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            clickableIcons={false}
          >
            <AdvancedMarker position={origin} title={origin.name}>
              <Pin background="#4a90a4" borderColor="#3d3322" glyphColor="#fbf6e5" />
            </AdvancedMarker>
            {spots.map((spot) => (
              <AdvancedMarker
                key={spot.id}
                position={{ lat: spot.latitude, lng: spot.longitude }}
                title={spot.name}
                onClick={() => setSelected(spot)}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center border bg-paper shadow-[0_2px_0_rgba(61,51,34,0.15)]"
                  style={{ borderColor: color }}
                >
                  <Icon size={20} color={color} />
                </div>
              </AdvancedMarker>
            ))}
            {selected && (
              <InfoWindow
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="flex min-w-[180px] flex-col gap-1.5 font-serif-jp text-ink">
                  <span className="font-mincho text-sm leading-tight">
                    {selected.name}
                  </span>
                  <span className="font-sans-jp text-xs text-muted">
                    {formatDistance(selected.distance_meters)}
                  </span>
                  <Link
                    href={`${href}/${selected.id}`}
                    className="font-sans-jp text-xs tracking-[0.15em] text-olive underline underline-offset-4 hover:text-olive-dark"
                  >
                    詳細を見る →
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
