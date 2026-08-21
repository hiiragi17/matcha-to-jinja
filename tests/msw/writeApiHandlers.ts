import { delay, http, HttpResponse } from "msw";

// 書き込み系 API（likes / comments）の MSW ハンドラを生成するファクトリ群。
// グローバルには登録せず、各テストが `server.use(...)` で必要なケースだけ
// オプトインする（handlers.ts の「原則空」方針を踏襲）。
// ハッピーパスと 401 / 403 / 422 / 5xx を一箇所で再現し、実 Rails API に
// 繋ぎ込む際の回帰防止の土台にする。

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiUrl = (path: string) => `${API_BASE_URL}/api/v1${path}`;

type Kind = "greentea" | "temple";

export type WriteResource =
  | "greentea_likes"
  | "temple_likes"
  | "greenteacomments"
  | "templecomments";

const likeResource = (kind: Kind): WriteResource =>
  kind === "greentea" ? "greentea_likes" : "temple_likes";

const commentResource = (kind: Kind): WriteResource =>
  kind === "greentea" ? "greenteacomments" : "templecomments";

// いいね POST 成功。delayMs を渡すと、楽観的更新 → 確定の順序検証に使える。
export function likeCreated(kind: Kind, opts: { delayMs?: number } = {}) {
  const key = kind === "greentea" ? "greentea_like" : "temple_like";
  const idKey = kind === "greentea" ? "greentea_id" : "temple_id";
  return http.post(apiUrl(`/${likeResource(kind)}`), async () => {
    if (opts.delayMs) await delay(opts.delayMs);
    return HttpResponse.json({ [key]: { id: 99, [idKey]: 1, user_id: 1 } });
  });
}

// いいね削除 成功（204 No Content）。
export function likeDeleted(kind: Kind) {
  return http.delete(apiUrl(`/${likeResource(kind)}/:id`), () =>
    HttpResponse.text(null, { status: 204 }),
  );
}

// コメント投稿 成功。リクエスト body をそのまま返し、実 API 形状に合わせる。
export function commentCreated(kind: Kind) {
  return http.post(apiUrl(`/${commentResource(kind)}`), async ({ request }) => {
    const payload = (await request.json()) as { body: string };
    return HttpResponse.json({
      comment: {
        id: 200,
        body: payload.body,
        user: { id: 10, name: "わたし" },
        created_at: "2026-06-01T00:00:00Z",
      },
    });
  });
}

// コメント削除 成功（204 No Content）。
export function commentDeleted(kind: Kind) {
  return http.delete(apiUrl(`/${commentResource(kind)}/:id`), () =>
    HttpResponse.text(null, { status: 204 }),
  );
}

// 任意の書き込み系エンドポイントを指定ステータスで失敗させる。
// 401 / 403 / 422 / 5xx の回帰ケースを共通化する。
// body は Rails のバリデーションエラー形（{ errors: [...] }）を既定とする。
export function writeError(
  method: "post" | "delete",
  resource: WriteResource,
  status: number,
  body: Record<string, unknown> = { errors: ["エラーが発生しました"] },
) {
  const handler = method === "post" ? http.post : http.delete;
  const path = method === "delete" ? `/${resource}/:id` : `/${resource}`;
  return handler(apiUrl(path), () => HttpResponse.json(body, { status }));
}
