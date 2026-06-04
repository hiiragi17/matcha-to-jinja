import type { User } from "@/types";
import { apiClient } from "./client";

export type AuthProvider = "twitter" | "line";

export type OAuthExchangePayload = {
  // OAuth provider が発行したアクセストークン。Rails 側で再度プロバイダに問い合わせ
  // identity を検証する想定。
  access_token: string;
  // OAuth provider が返した一意 ID（Rails の Authentication モデルの uid と照合）。
  uid?: string;
  // 表示用プロフィール。Rails 側で初回ログイン時の User レコード作成に使う。
  info?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export type AuthExchangeResponse = {
  // Rails が発行する JWT。`apiClient` の Authorization: Bearer に渡す。
  token: string;
  user: User;
};

export type CurrentUserResponse = {
  user: User;
};

// NextAuth の jwt callback で OAuth 成功直後に呼び出し、Rails 側の JWT に交換する。
// 受け取った JWT は session.railsJwt に格納し、以後の API 呼び出しに添付する。
export function exchangeOAuthForJwt(
  provider: AuthProvider,
  payload: OAuthExchangePayload,
): Promise<AuthExchangeResponse> {
  return apiClient<AuthExchangeResponse>(`/auth/${provider}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(
  authToken: string,
): Promise<CurrentUserResponse> {
  return apiClient<CurrentUserResponse>("/current_user", { authToken });
}

// signOut 時に Rails 側の JWT を失効させる。失敗してもクライアント側のログアウトは
// 続行するため、呼び出し側で best-effort 扱いにする。
export function revokeJwt(authToken: string): Promise<void> {
  return apiClient<void>("/auth/logout", {
    method: "DELETE",
    authToken,
  });
}
