import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import {
  getGreenteaLikes,
  getTempleLikes,
  likeGreentea,
  likeTemple,
  unlikeGreentea,
  unlikeTemple,
} from "../likes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

type Captured = {
  method?: string;
  auth?: string | null;
  body?: unknown;
  id?: string;
};

describe("likes API クライアント", () => {
  describe("お気に入り一覧", () => {
    it("getGreenteaLikes は Bearer 付きで GET する", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/greentea_likes"), ({ request }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          return HttpResponse.json({
            greentea_likes: [
              { id: 1, greentea: { id: 5 }, created_at: "2026-06-01T00:00:00Z" },
            ],
          });
        }),
      );

      const res = await getGreenteaLikes("tok-abc");

      expect(captured.method).toBe("GET");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect(res.greentea_likes).toHaveLength(1);
    });

    it("getTempleLikes は Bearer 付きで GET する", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/temple_likes"), ({ request }) => {
          captured.auth = request.headers.get("Authorization");
          return HttpResponse.json({ temple_likes: [] });
        }),
      );

      const res = await getTempleLikes("tok-xyz");

      expect(captured.auth).toBe("Bearer tok-xyz");
      expect(res.temple_likes).toEqual([]);
    });
  });

  describe("いいね追加", () => {
    it("likeGreentea は greentea_id を body に載せて POST する", async () => {
      const captured: Captured = {};
      server.use(
        http.post(endpoint("/greentea_likes"), async ({ request }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          captured.body = await request.json();
          return HttpResponse.json({
            greentea_like: { id: 99, greentea_id: 5, user_id: 1 },
          });
        }),
      );

      const res = await likeGreentea(5, "tok-abc");

      expect(captured.method).toBe("POST");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect(captured.body).toEqual({ greentea_id: 5 });
      expect(res.greentea_like.id).toBe(99);
    });

    it("likeTemple は temple_id を body に載せて POST する", async () => {
      const captured: Captured = {};
      server.use(
        http.post(endpoint("/temple_likes"), async ({ request }) => {
          captured.body = await request.json();
          return HttpResponse.json({
            temple_like: { id: 88, temple_id: 3, user_id: 1 },
          });
        }),
      );

      await likeTemple(3, "tok-xyz");

      expect(captured.body).toEqual({ temple_id: 3 });
    });
  });

  describe("いいね解除", () => {
    it("unlikeGreentea は path に対象 id を渡して DELETE し undefined を返す", async () => {
      const captured: Captured = {};
      server.use(
        http.delete(endpoint("/greentea_likes/:id"), ({ request, params }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          captured.id = params.id as string;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const res = await unlikeGreentea(5, "tok-abc");

      expect(captured.method).toBe("DELETE");
      expect(captured.auth).toBe("Bearer tok-abc");
      // フロントは like_id ではなく対象スポットの id を path に渡す実装。
      expect(captured.id).toBe("5");
      expect(res).toBeUndefined();
    });

    it("unlikeTemple も対象 id を path に渡して DELETE する", async () => {
      const captured: Captured = {};
      server.use(
        http.delete(endpoint("/temple_likes/:id"), ({ params }) => {
          captured.id = params.id as string;
          return HttpResponse.text(null, { status: 204 });
        }),
      );

      await expect(unlikeTemple(3, "tok-xyz")).resolves.toBeUndefined();
      expect(captured.id).toBe("3");
    });
  });
});
