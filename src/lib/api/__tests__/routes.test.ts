import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { endpoint } from "@tests/msw/endpoint";
import { server } from "@tests/msw/server";
import type { RouteInput } from "@/types";
import {
  createRoute,
  deleteRoute,
  getRoute,
  getRoutes,
  updateRoute,
} from "../routes";

type Captured = {
  method?: string;
  url?: URL;
  auth?: string | null;
  body?: unknown;
  id?: string;
};

const listItem = {
  id: 1,
  name: "祇園めぐり",
  description: null,
  spot_count: 3,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

const detail = {
  id: 1,
  name: "祇園めぐり",
  description: "抹茶と神社",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  spots: [],
  total_distance_meters: 0,
  total_duration_seconds: null,
};

describe("routes API クライアント", () => {
  describe("一覧取得", () => {
    it("getRoutes は Bearer 付きで GET し、page を指定すると ?page= が付く", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/routes"), ({ request }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          captured.url = new URL(request.url);
          return HttpResponse.json({
            data: [listItem],
            meta: { current_page: 2, total_pages: 3, total_count: 25 },
          });
        }),
      );

      const res = await getRoutes("tok-abc", 2);

      expect(captured.method).toBe("GET");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect(captured.url?.searchParams.get("page")).toBe("2");
      expect(res.data[0].spot_count).toBe(3);
      expect(res.meta.total_count).toBe(25);
    });

    it("getRoutes は page 未指定なら ?page= を付けない", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/routes"), ({ request }) => {
          captured.url = new URL(request.url);
          return HttpResponse.json({
            data: [],
            meta: { current_page: 1, total_pages: 1, total_count: 0 },
          });
        }),
      );

      await getRoutes("tok-abc");

      expect(captured.url?.searchParams.has("page")).toBe(false);
    });
  });

  describe("詳細取得", () => {
    it("getRoute は :id を含む path へ Bearer 付きで GET する", async () => {
      const captured: Captured = {};
      server.use(
        http.get(endpoint("/routes/:id"), ({ request, params }) => {
          captured.auth = request.headers.get("Authorization");
          captured.id = params.id as string;
          return HttpResponse.json({ data: detail });
        }),
      );

      const res = await getRoute(1, "tok-abc");

      expect(captured.auth).toBe("Bearer tok-abc");
      expect(captured.id).toBe("1");
      expect(res.data.name).toBe("祇園めぐり");
    });
  });

  describe("作成・更新", () => {
    const input: RouteInput = {
      name: "新コース",
      description: "説明",
      spots: [
        { spot_type: "greentea", spot_id: 5 },
        { spot_type: "temple", spot_id: 9 },
      ],
    };

    it("createRoute は body を { route: input } でラップして POST する", async () => {
      const captured: Captured = {};
      server.use(
        http.post(endpoint("/routes"), async ({ request }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          captured.body = await request.json();
          return HttpResponse.json({ data: detail });
        }),
      );

      await createRoute(input, "tok-abc");

      expect(captured.method).toBe("POST");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect(captured.body).toEqual({ route: input });
    });

    it("updateRoute は :id へ { route: input } を PATCH する", async () => {
      const captured: Captured = {};
      server.use(
        http.patch(endpoint("/routes/:id"), async ({ request, params }) => {
          captured.method = request.method;
          captured.id = params.id as string;
          captured.body = await request.json();
          return HttpResponse.json({ data: detail });
        }),
      );

      await updateRoute(1, input, "tok-abc");

      expect(captured.method).toBe("PATCH");
      expect(captured.id).toBe("1");
      expect(captured.body).toEqual({ route: input });
    });
  });

  describe("削除", () => {
    it("deleteRoute は :id へ DELETE し 204 で undefined を返す", async () => {
      const captured: Captured = {};
      server.use(
        http.delete(endpoint("/routes/:id"), ({ request, params }) => {
          captured.method = request.method;
          captured.auth = request.headers.get("Authorization");
          captured.id = params.id as string;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const res = await deleteRoute(1, "tok-abc");

      expect(captured.method).toBe("DELETE");
      expect(captured.auth).toBe("Bearer tok-abc");
      expect(captured.id).toBe("1");
      expect(res).toBeUndefined();
    });
  });
});
