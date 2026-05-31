"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Hairline from "@/components/brand/Hairline";

export default function MyPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-sans-jp text-[10px] tracking-[0.4em] text-muted">
          読み込み中…
        </p>
      </section>
    );
  }

  if (!session?.user) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center px-6 py-16 text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
          ログインが必要です / SIGN IN REQUIRED
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
          マイページ
        </h1>
        <Hairline width={40} className="mt-5" />
        <p className="mt-5 font-serif-jp text-sm leading-[2] text-muted">
          マイページのご利用にはログインが必要です。
        </p>
        <Link
          href="/auth/login"
          className="mt-8 border border-olive px-5 py-2.5 font-mincho text-[13px] tracking-[0.15em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログインへ
        </Link>
      </section>
    );
  }

  const user = session.user;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        マイページ / MY PAGE
      </p>
      <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
        こんにちは、{user.name ?? "ゲスト"}さん
      </h1>
      <Hairline width={40} className="mt-5" />

      <p className="mt-10 font-serif-jp text-sm leading-[2] text-muted">
        お気に入り一覧の表示は現在準備中です（#24）。
      </p>
    </section>
  );
}
