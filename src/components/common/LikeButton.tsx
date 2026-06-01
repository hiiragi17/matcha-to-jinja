"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import {
  ApiError,
  likeGreentea,
  likeTemple,
  unlikeGreentea,
  unlikeTemple,
} from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";

type LikeButtonProps = {
  kind: "greentea" | "temple";
  id: number;
  initialCount: number;
  initialLiked: boolean;
  // ログイン誘導先の callbackUrl（現在のページに戻すため）。
  callbackUrl: string;
};

export default function LikeButton({
  kind,
  id,
  initialCount,
  initialLiked,
  callbackUrl,
}: LikeButtonProps) {
  const router = useRouter();
  const authToken = useAuthToken();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    // useTransition の pending は startTransition 後にしか立たないため、
    // 楽観的更新と startTransition の間に差し込まれる連打を別途ガードする。
    if (pending) return;
    if (!authToken) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setError(null);
    const nextLiked = !liked;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(nextLiked);
    setCount(count + (nextLiked ? 1 : -1));

    startTransition(async () => {
      try {
        if (kind === "greentea") {
          if (nextLiked) await likeGreentea(id, authToken);
          else await unlikeGreentea(id, authToken);
        } else {
          if (nextLiked) await likeTemple(id, authToken);
          else await unlikeTemple(id, authToken);
        }
      } catch (e) {
        setLiked(prevLiked);
        setCount(prevCount);
        if (e instanceof ApiError && e.status === 401) {
          router.push(
            `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          );
          return;
        }
        setError("通信に失敗しました。もう一度お試しください。");
      }
    });
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? "お気に入りを解除" : "お気に入りに追加"}
        className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-sans-jp text-[11px] transition-colors disabled:opacity-60 ${
          liked
            ? "border-bengara bg-bengara text-paper hover:bg-bengara-dark"
            : "border-line bg-paper text-muted hover:border-bengara hover:text-bengara"
        }`}
      >
        {liked ? (
          <HiHeart className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <HiOutlineHeart className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>{count}</span>
      </button>
      {error && (
        <p role="alert" className="font-sans-jp text-[10px] text-bengara">
          {error}
        </p>
      )}
    </div>
  );
}
