// API クライアントのテストで実 API の URL を組み立てる共有ヘルパー。
// 各 spec が env フォールバックと `/api/v1` prefix を重複定義しないよう集約する。
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;
