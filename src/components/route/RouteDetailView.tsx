"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { ChawanIcon, ToriiIcon } from "@/components/brand/icons";
import Hairline from "@/components/brand/Hairline";
import RouteMap from "./RouteMap";
import {
  ApiError,
  deleteRoute,
  getErrorStatus,
  getRoute,
  isUnauthorized,
} from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import {
  formatDistance,
  formatDuration,
  transportLabel,
} from "@/lib/utils/format";
import type { RouteDetailResponse, RouteSpot } from "@/types";

type RouteDetailViewProps = {
  id: string;
};

type SwrKey = readonly [string, string];

export default function RouteDetailView({ id }: RouteDetailViewProps) {
  const router = useRouter();
  const authToken = useAuthToken();
  const callbackUrl = `/routes/${id}`;
  const handleSessionExpired = useSessionExpiredHandler(callbackUrl);
  const [deleting, setDeleting] = useState(false);

  const fetcher = ([, token]: SwrKey): Promise<RouteDetailResponse> =>
    getRoute(id, token);

  const { data, error, isLoading } = useSWR<
    RouteDetailResponse,
    ApiError,
    SwrKey | null
  >(authToken ? ([`/routes/${id}`, authToken] as const) : null, fetcher);

  const sessionExpired = !!error && isUnauthorized(error);
  useEffect(() => {
    if (sessionExpired) void handleSessionExpired();
  }, [sessionExpired, handleSessionExpired]);

  const onDelete = async () => {
    if (!authToken) {
      await handleSessionExpired();
      return;
    }
    if (!window.confirm("このコースを削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteRoute(id, authToken);
      router.push("/routes");
      router.refresh();
    } catch (err) {
      if (isUnauthorized(err)) {
        await handleSessionExpired();
        return;
      }
      window.alert("削除に失敗しました。時間を置いてお試しください。");
      setDeleting(false);
    }
  };

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          コースの表示にはログインが必要です。
        </p>
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="mt-3 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
        読み込み中…
      </p>
    );
  }

  if (error) {
    const notFound = getErrorStatus(error) === 404;
    return (
      <div className="border border-line-soft bg-paper px-5 py-8 text-center">
        <p role="alert" className="font-serif-jp text-sm text-muted">
          {notFound
            ? "コースが見つかりませんでした。削除された可能性があります。"
            : "コースの取得に失敗しました。時間を置いてお試しください。"}
        </p>
        <Link
          href="/routes"
          className="mt-4 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          コース一覧へ
        </Link>
      </div>
    );
  }

  if (!data) return null;
  const route = data.data;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
              MODEL COURSE
            </p>
            <h1 className="mt-2 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
              {route.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/routes/${route.id}/edit`}
              className="border border-line px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:border-olive hover:text-olive"
            >
              編集
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="border border-bengara px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-bengara transition-colors hover:bg-bengara hover:text-paper disabled:opacity-50"
            >
              {deleting ? "削除中…" : "削除"}
            </button>
          </div>
        </div>
        {route.description && (
          <p className="font-serif-jp text-sm leading-[2] text-muted">
            {route.description}
          </p>
        )}
        <Hairline width={40} />
        <dl className="flex flex-wrap gap-x-10 gap-y-2">
          <div>
            <dt className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
              TOTAL DISTANCE
            </dt>
            <dd className="mt-1 font-mincho text-lg text-ink">
              {formatDistance(route.total_distance_meters)}
            </dd>
          </div>
          <div>
            <dt className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
              TOTAL TIME
            </dt>
            <dd className="mt-1 font-mincho text-lg text-ink">
              {formatDuration(route.total_duration_seconds)}
            </dd>
          </div>
          <div>
            <dt className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
              SPOTS
            </dt>
            <dd className="mt-1 font-mincho text-lg text-ink">
              {route.spots.length} 件
            </dd>
          </div>
        </dl>
      </header>

      <RouteMap spots={route.spots} />

      <ol className="flex flex-col">
        {route.spots.map((spot, index) => (
          <SpotRow
            key={`${spot.spot_type}-${spot.id}-${spot.position}`}
            spot={spot}
            isLast={index === route.spots.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

function SpotRow({ spot, isLast }: { spot: RouteSpot; isLast: boolean }) {
  const href =
    spot.spot_type === "greentea"
      ? `/greenteas/${spot.id}`
      : `/temples/${spot.id}`;
  // 経路値優先・直線距離フォールバック（ハンドオフ doc の指針）。
  const legMeters =
    spot.route_distance_to_next_meters ?? spot.distance_to_next_meters;

  return (
    <li className="flex flex-col">
      <div className="flex items-start gap-4 border border-line bg-paper px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-olive font-sans-jp text-sm font-semibold text-olive">
          {spot.position}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {spot.spot_type === "greentea" ? (
              <ChawanIcon size={20} color="#608060" />
            ) : (
              <ToriiIcon size={20} color="#905050" />
            )}
            <Link
              href={href}
              className="font-mincho text-lg text-ink transition-colors hover:text-olive"
            >
              {spot.name}
            </Link>
          </div>
          {spot.address && (
            <p className="mt-1 font-serif-jp text-sm text-muted">
              {spot.address}
            </p>
          )}
          {spot.access && (
            <p className="mt-0.5 font-sans-jp text-xs text-muted">
              {spot.access}
            </p>
          )}
        </div>
      </div>
      {!isLast && (
        <div className="flex items-center gap-2 py-2 pl-9 font-sans-jp text-xs tracking-[0.1em] text-muted">
          <span aria-hidden="true">↓</span>
          {spot.transport && (
            <span className="border border-line-soft px-2 py-0.5 text-olive">
              {transportLabel(spot.transport)}
            </span>
          )}
          {legMeters !== null && <span>{formatDistance(legMeters)}</span>}
          {spot.duration_to_next_seconds !== null && (
            <span>{formatDuration(spot.duration_to_next_seconds)}</span>
          )}
        </div>
      )}
    </li>
  );
}
