import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import {
  ApiError,
  exchangeOAuthForJwt,
  getAreas,
  getCurrentUser,
  getGenres,
  getGreentea,
  getGreenteas,
  getNearby,
  getTemple,
  getTemples,
  revokeJwt,
  updateCurrentUser,
} from "..";

import areasFixture from "./fixtures/areas.list.json";
import authExchangeFixture from "./fixtures/auth.exchange.json";
import currentUserFixture from "./fixtures/current_user.json";
import genresFixture from "./fixtures/genres.list.json";
import greenteaShowFixture from "./fixtures/greenteas.show.json";
import greenteasListFixture from "./fixtures/greenteas.list.json";
import nearbyFixture from "./fixtures/nearby.json";
import templeShowFixture from "./fixtures/temples.show.json";
import templesListFixture from "./fixtures/temples.list.json";

// `docs/migration-plan.md` 1-3 で定義した Rails API レスポンスの「契約」と
// `src/lib/api/*` の解釈が一致しているかを fixture ベースで検証する。
// Rails 側で形が変わったらここが落ちる想定。

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

describe("API contract: 読み取り系", () => {
  describe("GET /greenteas", () => {
    it("契約どおりの一覧レスポンスを型付きで返す", async () => {
      server.use(
        http.get(endpoint("/greenteas"), () =>
          HttpResponse.json(greenteasListFixture),
        ),
      );

      const res = await getGreenteas();

      expect(res.meta).toEqual({
        current_page: 1,
        total_pages: 5,
        total_count: 48,
      });
      expect(res.greenteas).toHaveLength(2);
      expect(res.greenteas[0]).toMatchObject({
        id: 1,
        name: "茶寮都路里 祇園本店",
        likes_count: 12,
        latitude: 35.0036,
        longitude: 135.7752,
      });
      expect(res.greenteas[0].genres[0]).toEqual({ id: 1, name: "パフェ" });
    });

    it("page / Ransack パラメータが q[xxx_cont] 形式で送出される", async () => {
      let captured: URL | null = null;
      server.use(
        http.get(endpoint("/greenteas"), ({ request }) => {
          captured = new URL(request.url);
          return HttpResponse.json(greenteasListFixture);
        }),
      );

      await getGreenteas({
        page: 2,
        q: { name_cont: "辻利", greentea_genres_genre_id_eq_any: [3, 5] },
      });

      expect(captured).not.toBeNull();
      const url = captured!;
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("q[name_cont]")).toBe("辻利");
      expect(
        url.searchParams.getAll("q[greentea_genres_genre_id_eq_any][]"),
      ).toEqual(["3", "5"]);
    });
  });

  describe("GET /greenteas/:id", () => {
    it("詳細・近隣神社・口コミを含むレスポンスを返す", async () => {
      server.use(
        http.get(endpoint("/greenteas/1"), () =>
          HttpResponse.json(greenteaShowFixture),
        ),
      );

      const { greentea } = await getGreentea(1);

      expect(greentea.id).toBe(1);
      expect(greentea.access).toBe("祇園四条駅から徒歩5分");
      expect(greentea.closed).toBe(false);
      expect(greentea.liked_by_current_user).toBe(true);

      expect(greentea.nearby_temples).toHaveLength(2);
      expect(greentea.nearby_temples[0]).toMatchObject({
        id: 3,
        name: "建仁寺",
        distance_meters: 450,
      });
      // 距離昇順を期待
      expect(greentea.nearby_temples[0].distance_meters).toBeLessThanOrEqual(
        greentea.nearby_temples[1].distance_meters,
      );

      expect(greentea.comments[0]).toMatchObject({
        id: 1,
        body: "抹茶パフェが最高でした！",
      });
      expect(greentea.comments[0].user).toEqual({ id: 1, name: "テストユーザー" });
    });

    it("Authorization ヘッダに Bearer トークンを付与する", async () => {
      let authHeader: string | null = null;
      server.use(
        http.get(endpoint("/greenteas/1"), ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return HttpResponse.json(greenteaShowFixture);
        }),
      );

      await getGreentea(1, "test-jwt-token");

      expect(authHeader).toBe("Bearer test-jwt-token");
    });

    it("404 で ApiError を throw する", async () => {
      server.use(
        http.get(endpoint("/greenteas/99999"), () =>
          HttpResponse.json({ error: "Not Found" }, { status: 404 }),
        ),
      );

      await expect(getGreentea(99999)).rejects.toBeInstanceOf(ApiError);
      await expect(getGreentea(99999)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("GET /temples", () => {
    it("契約どおりの一覧レスポンスを返す", async () => {
      server.use(
        http.get(endpoint("/temples"), () =>
          HttpResponse.json(templesListFixture),
        ),
      );

      const res = await getTemples();

      expect(res.meta.total_count).toBe(30);
      expect(res.temples[0]).toMatchObject({
        id: 1,
        name: "清水寺",
        likes_count: 24,
      });
      expect(res.temples[0].areas[0]).toEqual({ id: 1, name: "東山" });
    });

    it("Ransack の q[temple_areas_area_id_eq_any][] を送出する", async () => {
      let captured: URL | null = null;
      server.use(
        http.get(endpoint("/temples"), ({ request }) => {
          captured = new URL(request.url);
          return HttpResponse.json(templesListFixture);
        }),
      );

      await getTemples({
        q: { name_cont: "稲荷", temple_areas_area_id_eq_any: [2, 4] },
      });

      const url = captured!;
      expect(url.searchParams.get("q[name_cont]")).toBe("稲荷");
      expect(
        url.searchParams.getAll("q[temple_areas_area_id_eq_any][]"),
      ).toEqual(["2", "4"]);
    });
  });

  describe("GET /temples/:id", () => {
    it("詳細・近隣抹茶店・口コミを含むレスポンスを返す", async () => {
      server.use(
        http.get(endpoint("/temples/3"), () =>
          HttpResponse.json(templeShowFixture),
        ),
      );

      const { temple } = await getTemple(3);

      expect(temple.id).toBe(3);
      expect(temple.access).toBe("祇園四条駅から徒歩7分");
      expect(temple.liked_by_current_user).toBe(false);
      expect(temple.nearby_greenteas[0]).toMatchObject({
        id: 1,
        name: "茶寮都路里 祇園本店",
        distance_meters: 450,
      });
    });
  });

  describe("GET /areas / GET /genres", () => {
    it("areas を配列で返す", async () => {
      server.use(
        http.get(endpoint("/areas"), () => HttpResponse.json(areasFixture)),
      );
      const { areas } = await getAreas();
      expect(areas).toHaveLength(4);
      expect(areas[0]).toEqual({ id: 1, name: "東山" });
    });

    it("genres を配列で返す", async () => {
      server.use(
        http.get(endpoint("/genres"), () => HttpResponse.json(genresFixture)),
      );
      const { genres } = await getGenres();
      expect(genres).toHaveLength(4);
      expect(genres[0]).toEqual({ id: 1, name: "パフェ" });
    });
  });

  describe("GET /nearby", () => {
    let captured: URL | null;
    beforeEach(() => {
      captured = null;
      server.use(
        http.get(endpoint("/nearby"), ({ request }) => {
          captured = new URL(request.url);
          return HttpResponse.json(nearbyFixture);
        }),
      );
    });

    it("lat / lng / radius をクエリで送出し、契約どおりのレスポンスを返す", async () => {
      const res = await getNearby({ lat: 35.003, lng: 135.771, radius: 1.5 });

      const url = captured!;
      expect(url.searchParams.get("lat")).toBe("35.003");
      expect(url.searchParams.get("lng")).toBe("135.771");
      expect(url.searchParams.get("radius")).toBe("1.5");

      expect(res.greenteas).toHaveLength(1);
      expect(res.greenteas[0]).toMatchObject({
        id: 1,
        latitude: 35.0036,
        longitude: 135.7752,
        distance_meters: 350,
      });
      expect(res.temples).toHaveLength(2);
      expect(res.temples[0].distance_meters).toBeLessThanOrEqual(
        res.temples[1].distance_meters,
      );
    });

    it("400（lat / lng が数値として無効）で ApiError を throw する", async () => {
      // Number.NaN は URLSearchParams で "NaN" 文字列として送出されるため、
      // 「lat/lng は存在するが数値として無効」というケースを再現する。
      server.use(
        http.get(endpoint("/nearby"), () =>
          HttpResponse.json(
            { error: "lat and lng must be valid numbers" },
            { status: 400 },
          ),
        ),
      );

      await expect(
        getNearby({ lat: Number.NaN, lng: Number.NaN }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });
});

describe("API contract: 認証系", () => {
  describe("POST /auth/:provider", () => {
    it("OAuth の access_token を渡して Rails の JWT を受け取る", async () => {
      let receivedBody: unknown = null;
      let receivedContentType: string | null = null;
      server.use(
        http.post(endpoint("/auth/google"), async ({ request }) => {
          receivedContentType = request.headers.get("Content-Type");
          receivedBody = await request.json();
          return HttpResponse.json(authExchangeFixture);
        }),
      );

      const res = await exchangeOAuthForJwt("google", {
        access_token: "oauth-access-token-from-google",
        uid: "gg-12345",
        info: { name: "テストユーザー", email: null, image: null },
      });

      expect(receivedContentType).toBe("application/json");
      expect(receivedBody).toEqual({
        access_token: "oauth-access-token-from-google",
        uid: "gg-12345",
        info: { name: "テストユーザー", email: null, image: null },
      });
      expect(res.token).toBe("rails.jwt.example-token");
      expect(res.user).toEqual({ id: 42, name: "テストユーザー", role: "general" });
    });

    it("LINE provider も同じ契約で交換できる", async () => {
      server.use(
        http.post(endpoint("/auth/line"), () =>
          HttpResponse.json(authExchangeFixture),
        ),
      );

      const res = await exchangeOAuthForJwt("line", {
        access_token: "oauth-access-token-from-line",
      });

      expect(res.token).toBe("rails.jwt.example-token");
    });

    it("401（OAuth トークン無効）で ApiError を throw する", async () => {
      server.use(
        http.post(endpoint("/auth/google"), () =>
          HttpResponse.json(
            { error: "invalid OAuth credentials" },
            { status: 401 },
          ),
        ),
      );

      await expect(
        exchangeOAuthForJwt("google", { access_token: "bad" }),
      ).rejects.toBeInstanceOf(ApiError);
      await expect(
        exchangeOAuthForJwt("google", { access_token: "bad" }),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe("GET /current_user", () => {
    it("Authorization 付きで current_user を返す", async () => {
      let authHeader: string | null = null;
      server.use(
        http.get(endpoint("/current_user"), ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return HttpResponse.json(currentUserFixture);
        }),
      );

      const { user } = await getCurrentUser("rails.jwt.example-token");

      expect(authHeader).toBe("Bearer rails.jwt.example-token");
      expect(user).toEqual({ id: 42, name: "テストユーザー", role: "general" });
    });

    it("401（未認証 / 期限切れ）で ApiError を throw する", async () => {
      server.use(
        http.get(endpoint("/current_user"), () =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
        ),
      );

      await expect(getCurrentUser("expired-token")).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe("PATCH /current_user", () => {
    it("user キー配下で name を送り、Authorization を付与する", async () => {
      let authHeader: string | null = null;
      let receivedBody: unknown = null;
      server.use(
        http.patch(endpoint("/current_user"), async ({ request }) => {
          authHeader = request.headers.get("Authorization");
          receivedBody = await request.json();
          return HttpResponse.json({
            user: { id: 42, name: "新しい表示名", role: "general" },
          });
        }),
      );

      const res = await updateCurrentUser(
        { name: "新しい表示名" },
        "rails.jwt.example-token",
      );

      expect(authHeader).toBe("Bearer rails.jwt.example-token");
      expect(receivedBody).toEqual({ user: { name: "新しい表示名" } });
      expect(res.user).toEqual({ id: 42, name: "新しい表示名", role: "general" });
    });

    it("422（name が空）で ApiError を throw する", async () => {
      server.use(
        http.patch(endpoint("/current_user"), () =>
          HttpResponse.json(
            { error: "Name can't be blank" },
            { status: 422 },
          ),
        ),
      );

      await expect(
        updateCurrentUser({ name: "" }, "rails.jwt.example-token"),
      ).rejects.toMatchObject({ status: 422 });
    });

    it("400（不正なリクエスト形式）で ApiError を throw する", async () => {
      server.use(
        http.patch(endpoint("/current_user"), () =>
          HttpResponse.json({ error: "Bad Request" }, { status: 400 }),
        ),
      );

      await expect(
        updateCurrentUser({ name: "x" }, "rails.jwt.example-token"),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("401（未認証）で ApiError を throw する", async () => {
      server.use(
        http.patch(endpoint("/current_user"), () =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
        ),
      );

      await expect(
        updateCurrentUser({ name: "x" }, "expired-token"),
      ).rejects.toMatchObject({ status: 401 });
    });
  });

  describe("DELETE /auth/logout", () => {
    it("Authorization 付きで送出し、空ボディの 204 を受け取れる", async () => {
      let authHeader: string | null = null;
      server.use(
        http.delete(endpoint("/auth/logout"), ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return new HttpResponse(null, { status: 204 });
        }),
      );

      await expect(revokeJwt("rails.jwt.example-token")).resolves.toBeUndefined();
      expect(authHeader).toBe("Bearer rails.jwt.example-token");
    });

    it("401（既に失効）でも ApiError を throw する（呼び出し側で握りつぶす想定）", async () => {
      server.use(
        http.delete(endpoint("/auth/logout"), () =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
        ),
      );

      await expect(revokeJwt("expired")).rejects.toMatchObject({ status: 401 });
    });
  });
});
