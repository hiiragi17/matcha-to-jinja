import { ApiError } from "./error";
import { mockClient } from "./mock";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export { ApiError } from "./error";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  if (USE_MOCK) {
    return mockClient<T>(endpoint, options);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
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

  return res.json() as Promise<T>;
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
