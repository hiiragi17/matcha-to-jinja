import { beforeEach, describe, expect, it } from "vitest";
import type {
  AreaListResponse,
  CommentListResponse,
  CommentResponse,
  GenreListResponse,
  GreenteaDetailResponse,
  GreenteaLikeListResponse,
  GreenteaLikeResponse,
  GreenteaListResponse,
  NearbyResponse,
  TempleDetailResponse,
  TempleLikeListResponse,
  TempleLikeResponse,
  TempleListResponse,
} from "@/types";
import { ApiError } from "@/lib/api/error";
import { mockClient } from "../index";
import { resetMockStore } from "../state";

const auth = (userId: string): RequestInit => ({
  headers: { Authorization: `Bearer mock:${userId}` },
});

beforeEach(() => {
  resetMockStore();
});

describe("mockClient GET /greenteas", () => {
  it("ページネーション meta を含む一覧を返す", async () => {
    const res = await mockClient<GreenteaListResponse>("/greenteas");
    expect(res.meta).toMatchObject({
      current_page: 1,
      total_pages: 1,
      total_count: 3,
    });
    expect(res.greenteas).toHaveLength(3);
  });

  it("q[name_cont] で名前を絞り込む", async () => {
    const res = await mockClient<GreenteaListResponse>(
      "/greenteas?q[name_cont]=中村",
    );
    expect(res.greenteas).toHaveLength(1);
    expect(res.greenteas[0].name).toBe("中村藤吉本店");
  });

  it("q[genres_id_eq] でジャンルを絞り込む", async () => {
    const res = await mockClient<GreenteaListResponse>(
      "/greenteas?q[genres_id_eq]=1",
    );
    // パフェ (id=1) を含むのは id 1, 2
    expect(res.greenteas.map((g) => g.id).sort()).toEqual([1, 2]);
  });
});

describe("mockClient GET /greenteas/:id", () => {
  it("存在する ID は詳細 + nearby_temples（1500m 以内・距離昇順）を返す", async () => {
    const res = await mockClient<GreenteaDetailResponse>("/greenteas/1");
    expect(res.greentea.id).toBe(1);
    expect(res.greentea.nearby_temples.length).toBeGreaterThan(0);
    // 全件 1500m 以内
    for (const t of res.greentea.nearby_temples) {
      expect(t.distance_meters).toBeLessThanOrEqual(1500);
    }
    // 距離昇順
    const distances = res.greentea.nearby_temples.map((t) => t.distance_meters);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it("存在しない ID は ApiError(404)", async () => {
    await expect(mockClient("/greenteas/99999")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("mockClient GET /temples & /temples/:id", () => {
  it("/temples は契約形のレスポンスを返す", async () => {
    const res = await mockClient<TempleListResponse>("/temples");
    expect(res.meta.total_count).toBe(3);
    expect(res.temples[0]).toHaveProperty("areas");
    expect(res.temples[0]).toHaveProperty("likes_count");
  });

  it("/temples/:id は近隣抹茶店を距離昇順で返す", async () => {
    const res = await mockClient<TempleDetailResponse>("/temples/1");
    expect(res.temple.id).toBe(1);
    const distances = res.temple.nearby_greenteas.map((g) => g.distance_meters);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it("/temples/99999 は ApiError(404)", async () => {
    await expect(mockClient("/temples/99999")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("mockClient GET /areas /genres", () => {
  it("/areas を返す", async () => {
    const res = await mockClient<AreaListResponse>("/areas");
    expect(res.areas.length).toBeGreaterThan(0);
    expect(res.areas[0]).toHaveProperty("id");
    expect(res.areas[0]).toHaveProperty("name");
  });

  it("/genres を返す", async () => {
    const res = await mockClient<GenreListResponse>("/genres");
    expect(res.genres.length).toBeGreaterThan(0);
    expect(res.genres[0]).toHaveProperty("name");
  });
});

describe("mockClient GET /nearby", () => {
  it("lat / lng 欠損で ApiError(400)", async () => {
    await expect(mockClient("/nearby")).rejects.toMatchObject({ status: 400 });
  });

  it("lat / lng が数値でなければ ApiError(400)", async () => {
    await expect(
      mockClient("/nearby?lat=abc&lng=xyz"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("radius=1.5 で 1500m 以内のスポットを距離昇順で返す", async () => {
    const res = await mockClient<NearbyResponse>(
      "/nearby?lat=35.003&lng=135.771&radius=1.5",
    );
    for (const g of res.greenteas) {
      expect(g.distance_meters).toBeLessThanOrEqual(1500);
    }
    for (const t of res.temples) {
      expect(t.distance_meters).toBeLessThanOrEqual(1500);
    }
    const gd = res.greenteas.map((g) => g.distance_meters);
    expect([...gd].sort((a, b) => a - b)).toEqual(gd);
    const td = res.temples.map((t) => t.distance_meters);
    expect([...td].sort((a, b) => a - b)).toEqual(td);
  });
});

describe("mockClient likes (greentea)", () => {
  it("未認証で /greentea_likes GET は 401", async () => {
    await expect(mockClient("/greentea_likes")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("POST → 一覧に出る / DELETE で消える", async () => {
    const u = auth("alice");

    const post = await mockClient<GreenteaLikeResponse>("/greentea_likes", {
      method: "POST",
      body: JSON.stringify({ greentea_id: 1 }),
      ...u,
    });
    expect(post.greentea_like.greentea.id).toBe(1);
    expect(post.greentea_like.greentea.liked_by_current_user).toBe(true);

    const list1 = await mockClient<GreenteaLikeListResponse>(
      "/greentea_likes",
      u,
    );
    expect(list1.greentea_likes.map((l) => l.greentea.id)).toContain(1);

    await mockClient("/greentea_likes/1", { method: "DELETE", ...u });

    const list2 = await mockClient<GreenteaLikeListResponse>(
      "/greentea_likes",
      u,
    );
    expect(list2.greentea_likes.map((l) => l.greentea.id)).not.toContain(1);
  });

  it("重複 POST は冪等（カウントが二重に増えない）", async () => {
    const u = auth("alice");
    const post = (n: number) =>
      mockClient<GreenteaLikeResponse>("/greentea_likes", {
        method: "POST",
        body: JSON.stringify({ greentea_id: n }),
        ...u,
      });

    const first = await post(1);
    const second = await post(1);
    // likes_count は同じ値（+1 のまま）
    expect(second.greentea_like.greentea.likes_count).toBe(
      first.greentea_like.greentea.likes_count,
    );
  });

  it("ユーザーが違えば liked_by_current_user は別々", async () => {
    await mockClient("/greentea_likes", {
      method: "POST",
      body: JSON.stringify({ greentea_id: 1 }),
      ...auth("alice"),
    });

    const aliceList = await mockClient<GreenteaListResponse>(
      "/greenteas",
      auth("alice"),
    );
    const bobList = await mockClient<GreenteaListResponse>(
      "/greenteas",
      auth("bob"),
    );

    const aliceG1 = aliceList.greenteas.find((g) => g.id === 1)!;
    const bobG1 = bobList.greenteas.find((g) => g.id === 1)!;
    expect(aliceG1.liked_by_current_user).toBe(true);
    expect(bobG1.liked_by_current_user).toBe(false);
    // ただし likes_count は共通（delta は global）
    expect(bobG1.likes_count).toBe(aliceG1.likes_count);
  });
});

describe("mockClient likes (temple)", () => {
  it("POST → 一覧に反映 → DELETE で消える", async () => {
    const u = auth("alice");
    await mockClient<TempleLikeResponse>("/temple_likes", {
      method: "POST",
      body: JSON.stringify({ temple_id: 2 }),
      ...u,
    });

    const list = await mockClient<TempleLikeListResponse>("/temple_likes", u);
    expect(list.temple_likes.map((l) => l.temple.id)).toContain(2);

    await mockClient("/temple_likes/2", { method: "DELETE", ...u });
    const after = await mockClient<TempleLikeListResponse>("/temple_likes", u);
    expect(after.temple_likes.map((l) => l.temple.id)).not.toContain(2);
  });
});

describe("mockClient comments", () => {
  it("/greenteacomments の POST 後、一覧の owned_by_current_user が投稿者だけ true", async () => {
    const alice = auth("alice");
    const bob = auth("bob");

    await mockClient<CommentResponse>("/greenteacomments", {
      method: "POST",
      body: JSON.stringify({ greentea_id: 2, body: "Aliceの感想" }),
      ...alice,
    });

    const aliceView = await mockClient<CommentListResponse>(
      "/greenteacomments?greentea_id=2",
      alice,
    );
    const aliceComment = aliceView.comments.find(
      (c) => c.body === "Aliceの感想",
    );
    expect(aliceComment?.owned_by_current_user).toBe(true);

    const bobView = await mockClient<CommentListResponse>(
      "/greenteacomments?greentea_id=2",
      bob,
    );
    const bobSees = bobView.comments.find((c) => c.body === "Aliceの感想");
    expect(bobSees?.owned_by_current_user).toBe(false);
  });

  it("他人のコメント DELETE は ApiError(403)", async () => {
    const alice = auth("alice");
    const bob = auth("bob");

    const created = await mockClient<CommentResponse>("/greenteacomments", {
      method: "POST",
      body: JSON.stringify({ greentea_id: 2, body: "削除させない" }),
      ...alice,
    });

    await expect(
      mockClient(`/greenteacomments/${created.comment.id}`, {
        method: "DELETE",
        ...bob,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("自分のコメント DELETE は成功し、一覧から消える", async () => {
    const alice = auth("alice");
    const created = await mockClient<CommentResponse>("/greenteacomments", {
      method: "POST",
      body: JSON.stringify({ greentea_id: 2, body: "あとで消す" }),
      ...alice,
    });

    await mockClient(`/greenteacomments/${created.comment.id}`, {
      method: "DELETE",
      ...alice,
    });

    const list = await mockClient<CommentListResponse>(
      "/greenteacomments?greentea_id=2",
      alice,
    );
    expect(list.comments.find((c) => c.id === created.comment.id)).toBeUndefined();
  });

  it("/templecomments も同じく POST → owned_by_current_user 真偽が分かれる", async () => {
    const alice = auth("alice");
    const bob = auth("bob");

    await mockClient<CommentResponse>("/templecomments", {
      method: "POST",
      body: JSON.stringify({ temple_id: 1, body: "Bobの感想" }),
      ...bob,
    });

    const bobView = await mockClient<CommentListResponse>(
      "/templecomments?temple_id=1",
      bob,
    );
    const fromBob = bobView.comments.find((c) => c.body === "Bobの感想");
    expect(fromBob?.owned_by_current_user).toBe(true);

    const aliceView = await mockClient<CommentListResponse>(
      "/templecomments?temple_id=1",
      alice,
    );
    const fromAliceSees = aliceView.comments.find(
      (c) => c.body === "Bobの感想",
    );
    expect(fromAliceSees?.owned_by_current_user).toBe(false);
  });

  it("空 body の POST は ApiError(400)", async () => {
    await expect(
      mockClient("/greenteacomments", {
        method: "POST",
        body: JSON.stringify({ greentea_id: 1, body: "   " }),
        ...auth("alice"),
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("mockClient admin greentea CRUD は公開一覧に反映される", () => {
  const adminAuth = auth("mock-admin");

  it("create した抹茶店が GET /greenteas に現れる", async () => {
    const before = await mockClient<GreenteaListResponse>("/greenteas");

    const { greentea } = await mockClient<{ greentea: { id: number } }>(
      "/admin/greenteas",
      {
        method: "POST",
        body: JSON.stringify({
          name: "新店",
          description: "",
          address: "京都市中京区",
          access: "",
          phone_number: "",
          business_hours: "",
          holiday: "",
          homepage: "",
          closed: false,
          img: "",
          latitude: 35.01,
          longitude: 135.77,
          genre_ids: [1],
        }),
        ...adminAuth,
      },
    );

    const after = await mockClient<GreenteaListResponse>("/greenteas");
    expect(after.meta.total_count).toBe(before.meta.total_count + 1);
    expect(after.greenteas.some((g) => g.id === greentea.id)).toBe(true);
  });

  it("delete した抹茶店は GET /greenteas から消える", async () => {
    await mockClient("/admin/greenteas/1", {
      method: "DELETE",
      ...adminAuth,
    });

    const after = await mockClient<GreenteaListResponse>("/greenteas");
    expect(after.greenteas.some((g) => g.id === 1)).toBe(false);
    await expect(mockClient("/greenteas/1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("update した内容が GET /greenteas/:id に反映される", async () => {
    await mockClient("/admin/greenteas/2", {
      method: "PATCH",
      body: JSON.stringify({ name: "改名後" }),
      ...adminAuth,
    });

    const res = await mockClient<GreenteaDetailResponse>("/greenteas/2");
    expect(res.greentea.name).toBe("改名後");
  });
});

describe("mockClient routing", () => {
  it("未定義パスは ApiError(404)", async () => {
    await expect(mockClient("/unknown")).rejects.toMatchObject({
      status: 404,
    });
  });
});
