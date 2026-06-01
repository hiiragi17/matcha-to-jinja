import { ApiError } from "./error";
import { mockClient } from "./mock";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export { ApiError } from "./error";

export type ApiClientOptions = RequestInit & {
  // Rails 発行の JWT。指定時は `Authorization: Bearer <token>` を付与する。
  // mock モードでもユーザー識別に使う（"mock:<id>" 形式）。
  authToken?: string;
};

export async function apiClient<T>(
  endpoint: string,
  options?: ApiClientOptions,
): Promise<T> {
  const { authToken, ...init } = options ?? {};
  const method = (init.method ?? "GET").toUpperCase();

  // Headers インスタンスや [key, value][] で渡されても欠落しないようマージする。
  const headers = new Headers(init.headers);
  // GET/DELETE はボディを持たないため Content-Type を付けない。
  // 付けると一部サーバー/プロキシで CORS preflight が増えたり、Rails が
  // 406 Not Acceptable を返すケースがある。
  const hasBody = method !== "GET" && method !== "DELETE";
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (USE_MOCK) {
    return mockClient<T>(endpoint, { ...init, headers });
  }

  const res = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // レスポンスボディが空/非JSONのケースは status のみで判断する
    }
    throw new ApiError(res.status, data);
  }

  // DELETE 等の成功時は 204 No Content / Content-Length: 0 が返るのが通常で、
  // 空ボディに対して res.json() は SyntaxError を投げる。
  // 楽観的更新のロールバック誤発火を避けるため、ボディが空なら undefined を返す。
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  if (text.length === 0) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

// Ransack 形式（q[name_cont] 等）を含むクエリ文字列を組み立てる。
// ネストしたオブジェクトは `key[nestedKey]` 形式に展開する。
export function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";

  const search = new URLSearchParams();

  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  };

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && typeof value === "object") {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        append(`${key}[${nestedKey}]`, nestedValue);
      }
    } else {
      append(key, value);
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
