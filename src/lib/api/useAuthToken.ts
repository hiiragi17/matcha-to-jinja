"use client";

import { useSession } from "next-auth/react";

// クライアントコンポーネント用に、現在のセッションから Rails JWT（または mock 用トークン）を返す。
// 未ログイン時は undefined。likes / comments のように認証が必要な API 呼び出しの引数に使う。
export function useAuthToken(): string | undefined {
  const { data: session } = useSession();
  return session?.railsJwt;
}
