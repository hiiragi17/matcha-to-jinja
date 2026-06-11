"use client";

import Link from "next/link";
import useSWR from "swr";
import GreenteaCard from "@/components/greentea/GreenteaCard";
import TempleCard from "@/components/temple/TempleCard";
import {
  ApiError,
  getGreenteaLikes,
  getTempleLikes,
  isUnauthorized,
} from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import type {
  GreenteaLikeListResponse,
  TempleLikeListResponse,
} from "@/types";

type LikedSpotsListProps = {
  kind: "greentea" | "temple";
};

type LikesResponse = GreenteaLikeListResponse | TempleLikeListResponse;
type SwrKey = readonly [string, string];

export default function LikedSpotsList({ kind }: LikedSpotsListProps) {
  const authToken = useAuthToken();
  const callbackUrl =
    kind === "greentea" ? "/mypage/greentea-likes" : "/mypage/temple-likes";

  // フェッチャーは SWR から渡されるキー（authToken を含む）からトークンを取り出す。
  // クロージャ越しの authToken に依存するとキャッシュ無効化のタイミングがずれる。
  const fetcher = ([, token]: SwrKey): Promise<LikesResponse> =>
    kind === "greentea" ? getGreenteaLikes(token) : getTempleLikes(token);

  const { data, error, isLoading } = useSWR<LikesResponse, ApiError, SwrKey | null>(
    authToken ? ([`/${kind}_likes`, authToken] as const) : null,
    fetcher,
  );

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          お気に入り一覧の表示にはログインが必要です。
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
    const msg = isUnauthorized(error)
      ? "ログインの有効期限が切れました。再度ログインしてください。"
      : "お気に入りの取得に失敗しました。時間を置いてお試しください。";
    return (
      <p role="alert" className="font-sans-jp text-xs text-bengara">
        {msg}
      </p>
    );
  }

  if (!data) return null;

  if (kind === "greentea") {
    const items = "greentea_likes" in data ? data.greentea_likes : [];
    if (items.length === 0) {
      return (
        <p className="border border-line-soft bg-paper px-5 py-6 text-center font-serif-jp text-sm text-muted">
          お気に入りに追加した抹茶店はまだありません。
        </p>
      );
    }
    return (
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((like) => (
          <li key={like.id}>
            <GreenteaCard greentea={like.greentea} />
          </li>
        ))}
      </ul>
    );
  }

  const items = "temple_likes" in data ? data.temple_likes : [];
  if (items.length === 0) {
    return (
      <p className="border border-line-soft bg-paper px-5 py-6 text-center font-serif-jp text-sm text-muted">
        お気に入りに追加した神社仏閣はまだありません。
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((like) => (
        <li key={like.id}>
          <TempleCard temple={like.temple} />
        </li>
      ))}
    </ul>
  );
}
