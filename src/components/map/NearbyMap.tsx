"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { ApiError } from "@/lib/api/error";
import { getNearby } from "@/lib/api/nearby";
import type { NearbyResponse, NearbySpot } from "@/types";
import { ChawanIcon, ToriiIcon } from "@/components/brand/icons";
import Hairline from "@/components/brand/Hairline";

const RADIUS_OPTIONS = [0.5, 1.0, 1.5, 2.0] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

// 京都市中心部のフォールバック（位置情報拒否時・京都圏外時の初期表示）
const KYOTO_CENTER = { lat: 35.0116, lng: 135.7681 };

// 収録スポットは京都のみのため、現在地がこの範囲外なら京都中心へ寄せる。
// 京都府は南北に長く形も複雑なため、府全体をゆるく覆う矩形にすると兵庫県
// （西宮市など）や大阪府・滋賀県の一部まで「京都府内」に含んでしまう。
// そのため収録スポットが実際に分布する京都市街地〜宇治・嵐山周辺に絞った
// 矩形にする（丹後半島など府北部の一部は対象外になるが、そこに収録スポットはない）。
const KYOTO_BOUNDS = {
  minLat: 34.8,
  maxLat: 35.2,
  minLng: 135.55,
  maxLng: 135.9,
} as const;

function isInKyoto(lat: number, lng: number): boolean {
  return (
    lat >= KYOTO_BOUNDS.minLat &&
    lat <= KYOTO_BOUNDS.maxLat &&
    lng >= KYOTO_BOUNDS.minLng &&
    lng <= KYOTO_BOUNDS.maxLng
  );
}

type Origin = { lat: number; lng: number };
type SelectedSpot = { kind: "greentea" | "temple"; spot: NearbySpot };

type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; origin: Origin; outsideKyoto: boolean }
  | { status: "denied" }
  | { status: "error"; message: string };

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: NearbyResponse }
  | { status: "error"; message: string };

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function NearbyMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const hasMapsConfig = Boolean(apiKey);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [radius, setRadius] = useState<Radius>(1.5);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });
  const [selected, setSelected] = useState<SelectedSpot | null>(null);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeo({
        status: "error",
        message: "お使いのブラウザは位置情報に対応していません。",
      });
      return;
    }
    setGeo({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // 京都圏内なら実際の現在地、圏外なら収録範囲の京都中心へ寄せる。
        const inKyoto = isInKyoto(latitude, longitude);
        setGeo({
          status: "granted",
          origin: inKyoto ? { lat: latitude, lng: longitude } : KYOTO_CENTER,
          outsideKyoto: !inKyoto,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeo({ status: "denied" });
        } else {
          setGeo({
            status: "error",
            message: "現在地を取得できませんでした。時間をおいて再度お試しください。",
          });
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (!hasMapsConfig) return;
    requestLocation();
  }, [hasMapsConfig, requestLocation]);

  // 位置情報を許可された場合は判定済みの origin をそのまま使う。拒否・取得失敗の
  // 場合も「京都にいなくても京都のスポットは見られる」ようにするため、取得を諦めず
  // 京都市中心部へフォールバックしてスポット取得を続行する。
  const origin =
    geo.status === "granted"
      ? geo.origin
      : geo.status === "denied" || geo.status === "error"
        ? KYOTO_CENTER
        : null;
  const outsideKyoto =
    geo.status === "granted"
      ? geo.outsideKyoto
      : geo.status === "denied" || geo.status === "error";

  useEffect(() => {
    if (!hasMapsConfig || !origin) return;
    let cancelled = false;
    setFetchState({ status: "loading" });
    setSelected(null);
    getNearby({ lat: origin.lat, lng: origin.lng, radius })
      .then((data) => {
        if (!cancelled) setFetchState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? `近隣スポットの取得に失敗しました（${err.status}）。`
            : "近隣スポットの取得に失敗しました。";
        setFetchState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [hasMapsConfig, origin, radius]);

  if (!hasMapsConfig) {
    return (
      <ConfigError
        message="Google Maps の API キーが設定されていません。NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を .env.local に設定してください。"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <RadiusSelector value={radius} onChange={setRadius} disabled={!origin} />

      <APIProvider apiKey={apiKey} libraries={["marker"]}>
        <div className="relative">
          <div className="border border-line bg-paper">
            <div className="h-[60vh] min-h-[420px] w-full">
              <Map
                mapId={
                  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ||
                  "DEMO_MAP_ID"
                }
                defaultCenter={origin ?? KYOTO_CENTER}
                defaultZoom={15}
                gestureHandling="greedy"
                disableDefaultUI={false}
                clickableIcons={false}
              >
                {origin && (
                  <OriginMarker origin={origin} outsideKyoto={outsideKyoto} />
                )}
                {fetchState.status === "success" && (
                  <SpotMarkers
                    spots={fetchState.data}
                    onSelect={setSelected}
                  />
                )}
                {selected && (
                  <>
                    <MapFocusOnSelection
                      position={{
                        lat: selected.spot.latitude,
                        lng: selected.spot.longitude,
                      }}
                    />
                    <InfoWindow
                      position={{
                        lat: selected.spot.latitude,
                        lng: selected.spot.longitude,
                      }}
                      onCloseClick={() => setSelected(null)}
                    >
                      <SpotInfo
                        kind={selected.kind}
                        spot={selected.spot}
                        outsideKyoto={outsideKyoto}
                      />
                    </InfoWindow>
                  </>
                )}
                {origin && (
                  <MapRecenter
                    center={origin}
                    deps={[origin.lat, origin.lng, radius]}
                  />
                )}
              </Map>
            </div>
          </div>
        </div>
      </APIProvider>

      <StatusPanel
        geo={geo}
        fetchState={fetchState}
        outsideKyoto={outsideKyoto}
        onRetry={requestLocation}
      />

      {fetchState.status === "success" && (
        <SpotLists
          data={fetchState.data}
          outsideKyoto={outsideKyoto}
          onSelect={setSelected}
        />
      )}
    </div>
  );
}

function RadiusSelector({
  value,
  onChange,
  disabled,
}: {
  value: Radius;
  onChange: (r: Radius) => void;
  disabled: boolean;
}) {
  return (
    <fieldset
      className="border border-line bg-paper px-5 py-4"
      aria-label="検索半径"
    >
      <legend className="px-2 font-mincho text-sm tracking-[0.2em] text-olive">
        検索半径
      </legend>
      <div className="flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map((r) => {
          const active = r === value;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              disabled={disabled}
              aria-pressed={active}
              className={[
                "border px-4 py-1.5 font-sans-jp text-sm tracking-[0.1em] transition-colors",
                active
                  ? "border-olive bg-olive text-paper"
                  : "border-line bg-paper text-ink hover:border-olive hover:text-olive",
                disabled ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
            >
              {r.toFixed(1)} km
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function OriginMarker({
  origin,
  outsideKyoto,
}: {
  origin: Origin;
  outsideKyoto: boolean;
}) {
  return (
    <AdvancedMarker
      position={origin}
      title={outsideKyoto ? "京都市中心部" : "現在地"}
    >
      <Pin background="#4a90a4" borderColor="#3d3322" glyphColor="#fbf6e5" />
    </AdvancedMarker>
  );
}

function SpotMarkers({
  spots,
  onSelect,
}: {
  spots: NearbyResponse;
  onSelect: (s: SelectedSpot) => void;
}) {
  return (
    <>
      {spots.greenteas.map((s) => (
        <AdvancedMarker
          key={`g-${s.id}`}
          position={{ lat: s.latitude, lng: s.longitude }}
          title={s.name}
          onClick={() => onSelect({ kind: "greentea", spot: s })}
        >
          <MarkerBadge kind="greentea" />
        </AdvancedMarker>
      ))}
      {spots.temples.map((s) => (
        <AdvancedMarker
          key={`t-${s.id}`}
          position={{ lat: s.latitude, lng: s.longitude }}
          title={s.name}
          onClick={() => onSelect({ kind: "temple", spot: s })}
        >
          <MarkerBadge kind="temple" />
        </AdvancedMarker>
      ))}
    </>
  );
}

function MarkerBadge({ kind }: { kind: "greentea" | "temple" }) {
  const isGreentea = kind === "greentea";
  return (
    <div
      className={[
        "flex h-9 w-9 items-center justify-center rounded-full border bg-paper shadow-[0_2px_0_rgba(61,51,34,0.15)]",
        isGreentea ? "border-matcha" : "border-bengara",
      ].join(" ")}
    >
      {isGreentea ? (
        <ChawanIcon size={22} color="#608060" />
      ) : (
        <ToriiIcon size={22} color="#905050" />
      )}
    </div>
  );
}

function SpotInfo({
  kind,
  spot,
  outsideKyoto,
}: {
  kind: "greentea" | "temple";
  spot: NearbySpot;
  outsideKyoto: boolean;
}) {
  const href = kind === "greentea" ? `/greenteas/${spot.id}` : `/temples/${spot.id}`;
  const label = kind === "greentea" ? "抹茶店" : "神社仏閣";
  // 京都圏外では検索の基準が現在地ではなく京都市中心部になるため文言を切り替える。
  const distancePrefix = outsideKyoto ? "京都市中心部から" : "現在地から";
  return (
    <div className="flex min-w-[180px] flex-col gap-2 font-serif-jp text-ink">
      <span className="font-sans-jp text-[10px] tracking-[0.2em] text-muted">
        {label}
      </span>
      <span className="font-mincho text-base leading-tight">{spot.name}</span>
      <span className="font-sans-jp text-xs text-muted">
        {distancePrefix} {formatDistance(spot.distance_meters)}
      </span>
      <Link
        href={href}
        className="font-sans-jp text-xs tracking-[0.15em] text-olive underline underline-offset-4 hover:text-olive-dark"
      >
        詳細を見る →
      </Link>
    </div>
  );
}

function StatusPanel({
  geo,
  fetchState,
  outsideKyoto,
  onRetry,
}: {
  geo: GeoState;
  fetchState: FetchState;
  outsideKyoto: boolean;
  onRetry: () => void;
}) {
  if (geo.status === "requesting") {
    return <Notice tone="info">現在地を取得中…</Notice>;
  }

  // 位置情報が拒否・取得失敗でも京都市中心部のスポットは取得・表示を続けるため、
  // ここで return せず、fetch の状態(検索中/失敗/0件)と一緒に案内を積む。
  const notices: React.ReactNode[] = [];
  if (geo.status === "denied") {
    notices.push(
      <Notice
        key="denied"
        tone="warn"
        action={{ label: "もう一度試す", onClick: onRetry }}
      >
        位置情報の利用が拒否されました。ブラウザの設定で位置情報を許可してから再度お試しください。京都市中心部のスポットを表示しています。
      </Notice>,
    );
  } else if (geo.status === "error") {
    notices.push(
      <Notice
        key="geo-error"
        tone="warn"
        action={{ label: "もう一度試す", onClick: onRetry }}
      >
        {geo.message}
      </Notice>,
    );
  } else if (outsideKyoto) {
    notices.push(
      <Notice key="outside" tone="info">
        現在地が京都府の外のようです。掲載スポットは京都のみのため、京都市中心部のまわりを表示しています。
      </Notice>,
    );
  }
  if (fetchState.status === "loading") {
    notices.push(
      <Notice key="loading" tone="info">
        近隣スポットを検索中…
      </Notice>,
    );
  } else if (fetchState.status === "error") {
    notices.push(
      <Notice key="error" tone="warn">
        {fetchState.message}
      </Notice>,
    );
  } else if (fetchState.status === "success") {
    const total =
      fetchState.data.greenteas.length + fetchState.data.temples.length;
    if (total === 0) {
      notices.push(
        <Notice key="empty" tone="info">
          指定した範囲には登録されたスポットがありません。半径を広げてお試しください。
        </Notice>,
      );
    }
  }

  if (notices.length === 0) return null;
  return <div className="flex flex-col gap-3">{notices}</div>;
}

function Notice({
  children,
  tone,
  action,
}: {
  children: React.ReactNode;
  tone: "info" | "warn";
  action?: { label: string; onClick: () => void };
}) {
  const border = tone === "warn" ? "border-bengara" : "border-line";
  const text = tone === "warn" ? "text-bengara-dark" : "text-ink";
  return (
    <div
      className={`flex flex-wrap items-center gap-3 border ${border} bg-paper px-5 py-3`}
      role={tone === "warn" ? "alert" : "status"}
    >
      <p className={`flex-1 font-serif-jp text-sm leading-relaxed ${text}`}>
        {children}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="border border-olive px-3 py-1 font-sans-jp text-xs tracking-[0.15em] text-olive hover:bg-olive hover:text-paper"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function SpotLists({
  data,
  outsideKyoto,
  onSelect,
}: {
  data: NearbyResponse;
  outsideKyoto: boolean;
  onSelect: (s: SelectedSpot) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* 京都圏外では距離の基準が現在地ではなく京都市中心部であることを明示する。 */}
      {outsideKyoto && (
        <p className="font-serif-jp text-xs leading-relaxed text-muted">
          ※ 距離は京都市中心部からの目安です（現在地が京都府外のため）。
        </p>
      )}
      <section className="grid gap-6 lg:grid-cols-2">
        <SpotColumn
          title="抹茶店"
          kind="greentea"
          spots={data.greenteas}
          onSelect={onSelect}
        />
        <SpotColumn
          title="神社仏閣"
          kind="temple"
          spots={data.temples}
          onSelect={onSelect}
        />
      </section>
    </div>
  );
}

function SpotColumn({
  title,
  kind,
  spots,
  onSelect,
}: {
  title: string;
  kind: "greentea" | "temple";
  spots: NearbySpot[];
  onSelect: (s: SelectedSpot) => void;
}) {
  const isGreentea = kind === "greentea";
  return (
    <div className="border border-line bg-paper">
      <header className="flex items-center justify-between border-b border-line-soft px-5 py-3">
        <h2 className="font-mincho text-base tracking-[0.15em] text-ink">
          {title}
          <span
            className={`ml-3 font-sans-jp text-xs tracking-[0.1em] ${
              isGreentea ? "text-matcha" : "text-bengara"
            }`}
          >
            {spots.length} 件
          </span>
        </h2>
        <Hairline width={28} />
      </header>
      {spots.length === 0 ? (
        <p className="px-5 py-6 text-center font-serif-jp text-sm text-muted">
          該当するスポットはありません。
        </p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {spots.map((s) => {
            const href = isGreentea ? `/greenteas/${s.id}` : `/temples/${s.id}`;
            return (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                <button
                  type="button"
                  onClick={() => onSelect({ kind, spot: s })}
                  className="flex flex-1 items-center gap-3 text-left"
                  aria-label={`${s.name} を地図で表示`}
                >
                  {isGreentea ? (
                    <ChawanIcon size={22} color="#608060" />
                  ) : (
                    <ToriiIcon size={22} color="#905050" />
                  )}
                  <span className="flex-1 font-mincho text-base text-ink">
                    {s.name}
                  </span>
                  <span className="font-sans-jp text-xs tracking-[0.1em] text-muted">
                    {formatDistance(s.distance_meters)}
                  </span>
                </button>
                <Link
                  href={href}
                  className="font-sans-jp text-xs tracking-[0.15em] text-olive underline underline-offset-4 hover:text-olive-dark"
                >
                  詳細
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// 選択スポット変更時に地図中心をそのスポットへ移動。1.5km 超の半径だと
// 選択マーカーが画面外になりうるため、リスト/マーカーいずれの選択でも追従させる。
function MapFocusOnSelection({ position }: { position: Origin }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position.lat, position.lng]);
  return null;
}

// origin / radius が変わるたびに地図中心を現在地へ戻す。
function MapRecenter({
  center,
  deps,
}: {
  center: Origin;
  deps: unknown[];
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ...deps]);
  return null;
}

function ConfigError({ message }: { message: string }) {
  return (
    <div className="border border-bengara bg-paper px-5 py-6">
      <p className="font-serif-jp text-sm leading-relaxed text-bengara-dark">
        {message}
      </p>
    </div>
  );
}
