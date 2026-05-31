"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/auth/UserMenu";

export default function HeaderAuth() {
  const { data: session } = useSession();

  // 静的ページを維持するため、未ログインの UI を初期レンダリングのデフォルトにする。
  // セッションがある場合のみハイドレーション後に UserMenu に切り替わる。
  if (!session?.user) {
    return (
      <>
        <Link
          href="/auth/login"
          className="font-sans-jp text-xs tracking-[0.06em] text-muted transition-colors hover:text-ink"
        >
          <span aria-hidden="true">♡</span> お気に入り
        </Link>
        <Link
          href="/auth/login"
          className="border border-olive px-3.5 py-1.5 font-mincho text-[13px] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログイン
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/mypage"
        className="font-sans-jp text-xs tracking-[0.06em] text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">♡</span> お気に入り
      </Link>
      <UserMenu user={session.user} />
    </>
  );
}
