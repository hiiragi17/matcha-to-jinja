"use client";

import Link from "next/link";
import { useEffect } from "react";
import useSWR from "swr";
import Loader from "@/components/common/Loader";
import RouteBuilder from "./RouteBuilder";
import { ApiError, getErrorStatus, getRoute, isUnauthorized } from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import type { RouteDetailResponse } from "@/types";

type RouteEditFormProps = {
  id: string;
};

type SwrKey = readonly [string, string];

// 編集フォームは初期値ロードに認証が必要なため、クライアントで取得してから
// RouteBuilder（mode=edit）へ initial を渡す。
export default function RouteEditForm({ id }: RouteEditFormProps) {
  const authToken = useAuthToken();
  const callbackUrl = `/routes/${id}/edit`;
  const handleSessionExpired = useSessionExpiredHandler(callbackUrl);

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

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          コースの編集にはログインが必要です。
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
    return <Loader />;
  }

  if (error || !data) {
    const notFound = getErrorStatus(error) === 404;
    return (
      <div className="border border-line-soft bg-paper px-5 py-8 text-center">
        <p role="alert" className="font-serif-jp text-sm text-muted">
          {notFound
            ? "コースが見つかりませんでした。"
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

  return <RouteBuilder mode="edit" initial={data.data} />;
}
