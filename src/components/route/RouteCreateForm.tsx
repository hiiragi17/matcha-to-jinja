"use client";

import Link from "next/link";
import RouteBuilder from "@/components/route/RouteBuilder";
import { useAuthToken } from "@/lib/api/useAuthToken";

// 作成フォームは list/detail/edit と同様に、未ログインでは
// ビルダーを描画せずログイン導線を先に見せる（作成途中で入力を失わせない）。
export default function RouteCreateForm() {
  const authToken = useAuthToken();

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          モデルコースの作成にはログインが必要です。
        </p>
        <Link
          href="/auth/login?callbackUrl=%2Froutes%2Fnew"
          className="mt-3 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  return <RouteBuilder mode="create" />;
}
