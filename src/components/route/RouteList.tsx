"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  ApiError,
  deleteRoute,
  getRoutes,
  isUnauthorized,
} from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import type { RouteListResponse } from "@/types";

type SwrKey = readonly [string, string];

export default function RouteList() {
  const authToken = useAuthToken();
  const handleSessionExpired = useSessionExpiredHandler("/routes");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetcher = ([, token]: SwrKey): Promise<RouteListResponse> =>
    getRoutes(token);

  const { data, error, isLoading, mutate } = useSWR<
    RouteListResponse,
    ApiError,
    SwrKey | null
  >(authToken ? (["/routes", authToken] as const) : null, fetcher);

  const sessionExpired = !!error && isUnauthorized(error);
  useEffect(() => {
    if (sessionExpired) void handleSessionExpired();
  }, [sessionExpired, handleSessionExpired]);

  const onDelete = async (id: number) => {
    if (!authToken) {
      await handleSessionExpired();
      return;
    }
    if (!window.confirm("このコースを削除しますか？")) return;
    setDeletingId(id);
    try {
      await deleteRoute(id, authToken);
      await mutate(
        (current) =>
          current
            ? {
                ...current,
                data: current.data.filter((r) => r.id !== id),
              }
            : current,
        { revalidate: false },
      );
    } catch (err) {
      if (isUnauthorized(err)) {
        await handleSessionExpired();
        return;
      }
      window.alert("削除に失敗しました。時間を置いてお試しください。");
    } finally {
      setDeletingId(null);
    }
  };

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          モデルコースの表示・作成にはログインが必要です。
        </p>
        <Link
          href="/auth/login?callbackUrl=%2Froutes"
          className="mt-3 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="font-sans-jp text-[11px] tracking-[0.2em] text-muted">
          {data ? `${data.meta.total_count} 件のコース` : ""}
        </p>
        <Link
          href="/routes/new"
          className="border border-olive bg-olive px-5 py-2 font-mincho text-[13px] tracking-[0.15em] text-paper transition-colors hover:bg-olive-dark"
        >
          ＋ 新しいコース
        </Link>
      </div>

      {isLoading ? (
        <p className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
          読み込み中…
        </p>
      ) : error ? (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {isUnauthorized(error)
            ? "ログインの有効期限が切れました。再度ログインしてください。"
            : "コースの取得に失敗しました。時間を置いてお試しください。"}
        </p>
      ) : !data || data.data.length === 0 ? (
        <p className="border border-line-soft bg-paper px-5 py-8 text-center font-serif-jp text-sm text-muted">
          まだモデルコースがありません。「＋ 新しいコース」から作成してみましょう。
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {data.data.map((route) => (
            <li
              key={route.id}
              className="flex flex-col gap-3 border border-line bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/routes/${route.id}`}
                  className="font-mincho text-lg text-ink transition-colors hover:text-olive"
                >
                  {route.name}
                </Link>
                {route.description && (
                  <p className="font-serif-jp text-sm leading-[1.8] text-muted">
                    {route.description}
                  </p>
                )}
                <p className="font-sans-jp text-[11px] tracking-[0.15em] text-olive">
                  スポット {route.spot_count} 件
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/routes/${route.id}`}
                  className="border border-line px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:border-olive hover:text-olive"
                >
                  詳細
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(route.id)}
                  disabled={deletingId === route.id}
                  className="border border-bengara px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-bengara transition-colors hover:bg-bengara hover:text-paper disabled:opacity-50"
                >
                  {deletingId === route.id ? "削除中…" : "削除"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
