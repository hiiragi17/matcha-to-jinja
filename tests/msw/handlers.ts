import type { RequestHandler } from "msw";

// 各テストで `server.use(...)` を使ってケースごとのハンドラを追加する。
// ここではグローバルに有効化するハンドラのみを置き、原則として空にしておく
// （未登録リクエストは setup の `onUnhandledRequest: "error"` で検出する）。
export const handlers: RequestHandler[] = [];
