import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import {
  createGreenteaComment,
  createTempleComment,
  deleteGreenteaComment,
  deleteTempleComment,
  getGreenteaComments,
  getTempleComments,
} from "../comments";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

// 記録した最後のリクエストのメソッド/クエリ/ボディ/認可ヘッダを検証するためのヘルパ。
type Captured = {
  method?: string;
  url?: URL;
  auth?: string | null;
  body?: unknown;
};

describe("comments API クライアント", () => {
  describe("一覧取得", () => {
    it("getGreenteaComments は ?greentea_id= 付きで GET する", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/greenteacomments"), ({ request }) => {
          captured.method = request.method;
          captured.url = new URL(request.url);
          return HttpResponse.json({
            comments: [
              {
                id: 1,
                body: "美味しい",
                user: { id: 10, name: "わたし" },
                created_at: "2026-06-01T00:00:00Z",
              },
            ],
          });
        }),
      );

      const res = await getGreenteaComments(42);

      expect(captured.method).toBe("GET");
      expect(captured.url?.searchParams.get("greentea_id")).toBe("42");
      expect(res.comments).toHaveLength(1);
      expect(res.comments[0].body).toBe("美味しい");
    });

    it("getTempleComments は ?temple_id= 付きで GET する", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/templecomments"), ({ request }) => {
          captured.url = new URL(request.url);
          return HttpResponse.json({ comments: [] });
        }),
      );

      const res = await getTempleComments(7);

      expect(captured.url?.searchParams.get("temple_id")).toBe("7");
      expect(res.comments).toEqual([]);
    });
  });

  describe("投稿", () => {
    it("createGreenteaComment は POST し body と Bearer を送る", async () => {
      const captured: Captured = {};
      server.use(
        http.post(endpoint("/greenteacomments"), async ({ request }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          captured.body = await request.json();
          return HttpResponse.json({
            comment: {
              id: 200,
              body: "投稿本文",
              user: { id: 10, name: "わたし" },
              created_at: "2026-06-01T00:00:00Z",
            },
          });
        }),
      );

      const res = await createGreenteaComment(42, "投稿本文", "tok-abc");

      expect(captured.method).toBe("POST");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect(captured.body).toEqual({ greentea_id: 42, body: "投稿本文" });
      expect(res.comment.id).toBe(200);
    });

    it("createTempleComment は temple_id を含む body を送る", async () => {
      const captured: Captured = {};
      server.use(
        http.post(endpoint("/templecomments"), async ({ request }) => {
          captured.auth = request.headers.get("Authorization");
          captured.body = await request.json();
          return HttpResponse.json({
            comment: {
              id: 201,
              body: "神社の投稿",
              user: { id: 10, name: "わたし" },
              created_at: "2026-06-01T00:00:00Z",
            },
          });
        }),
      );

      await createTempleComment(7, "神社の投稿", "tok-xyz");

      expect(captured.auth).toBe("Bearer tok-xyz");
      expect(captured.body).toEqual({ temple_id: 7, body: "神社の投稿" });
    });
  });

  describe("削除", () => {
    it("deleteGreenteaComment は :id を含む path へ DELETE し 204 で undefined を返す", async () => {
      const captured: Captured = {};
      server.use(
        http.delete(
          endpoint("/greenteacomments/:id"),
          ({ request, params }) => {
            captured.method = request.method;
            captured.auth = request.headers.get("Authorization");
            (captured as Captured & { id?: string }).id = params.id as string;
            return new HttpResponse(null, { status: 204 });
          },
        ),
      );

      const res = await deleteGreenteaComment(200, "tok-abc");

      expect(captured.method).toBe("DELETE");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect((captured as Captured & { id?: string }).id).toBe("200");
      expect(res).toBeUndefined();
    });

    it("deleteTempleComment も 204 で undefined を返す", async () => {
      server.use(
        http.delete(endpoint("/templecomments/:id"), () =>
          HttpResponse.text(null, { status: 204 }),
        ),
      );

      await expect(deleteTempleComment(201, "tok-xyz")).resolves.toBeUndefined();
    });
  });
});
