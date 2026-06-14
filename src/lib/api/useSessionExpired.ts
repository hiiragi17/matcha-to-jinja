"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback } from "react";

// 認証付き API が 401 を返したとき（＝Rails JWT が失効・無効）に呼ぶ共通ハンドラ。
// クライアントの NextAuth セッションを破棄してからログインへ誘導することで、
// 「セッションは生きているのに API は弾かれる」不整合状態を残さない。
// 楽観的更新を持つコンポーネント間で 401 の挙動を統一するために集約する。
export function useSessionExpiredHandler(
  callbackUrl: string,
): () => Promise<void> {
  const router = useRouter();
  return useCallback(async () => {
    // redirect: false で NextAuth の自動遷移を抑止し、callbackUrl 付きの
    // ログインページへ自前で送る（元のページに戻すため）。
    await signOut({ redirect: false });
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [router, callbackUrl]);
}
