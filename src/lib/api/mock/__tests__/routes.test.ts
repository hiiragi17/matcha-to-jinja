import { beforeEach, describe, expect, it } from "vitest";
import type { RouteDetailResponse, RouteListResponse } from "@/types";
import { ApiError } from "@/lib/api/error";
import { mockClient } from "../index";
import { resetMockStore } from "../state";

const auth = (userId: string): RequestInit => ({
  headers: { Authorization: `Bearer mock:${userId}` },
});

const jsonBody = (userId: string, body: unknown): RequestInit => ({
  method: "POST",
  headers: { Authorization: `Bearer mock:${userId}` },
  body: JSON.stringify(body),
});

const sampleRoute = {
  route: {
    name: "祇園抹茶巡り",
    description: "神社とお茶屋さんを巡る",
    spots: [
      { spot_type: "temple", spot_id: 2, transport: "walk" },
      { spot_type: "greentea", spot_id: 1 },
    ],
  },
};

async function createSample(userId: string): Promise<RouteDetailResponse> {
  return mockClient<RouteDetailResponse>("/routes", jsonBody(userId, sampleRoute));
}

beforeEach(() => {
  resetMockStore();
});

describe("mockClient POST /routes", () => {
  it("認証必須（トークン無しは 401）", async () => {
    await expect(
      mockClient("/routes", { method: "POST", body: JSON.stringify(sampleRoute) }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("スポット順・位置・距離・所要時間を計算して詳細形で返す", async () => {
    const res = await createSample("mock-alice");
    expect(res.data.name).toBe("祇園抹茶巡り");
    expect(res.data.spots).toHaveLength(2);
    expect(res.data.spots.map((s) => s.position)).toEqual([1, 2]);
    // 最初の leg は距離・経路距離・所要時間が算出される
    expect(res.data.spots[0].distance_to_next_meters).toBeGreaterThan(0);
    expect(res.data.spots[0].route_distance_to_next_meters).toBeGreaterThan(0);
    expect(res.data.spots[0].duration_to_next_seconds).toBeGreaterThan(0);
    // 最後の要素は全て null、transport も null
    expect(res.data.spots[1].distance_to_next_meters).toBeNull();
    expect(res.data.spots[1].transport).toBeNull();
    // 合計
    expect(res.data.total_distance_meters).toBeGreaterThan(0);
    expect(res.data.total_duration_seconds).toBeGreaterThan(0);
  });

  it("単一スポットのルートは total_duration_seconds が null・total_distance が 0", async () => {
    const res = await mockClient<RouteDetailResponse>(
      "/routes",
      jsonBody("mock-alice", {
        route: { name: "一箇所", spots: [{ spot_type: "temple", spot_id: 1 }] },
      }),
    );
    expect(res.data.total_duration_seconds).toBeNull();
    expect(res.data.total_distance_meters).toBe(0);
    expect(res.data.spots[0].distance_to_next_meters).toBeNull();
  });

  it("name 空は 422", async () => {
    await expect(
      createBad("mock-alice", { name: "", spots: [{ spot_type: "temple", spot_id: 1 }] }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("spots 空配列は 422", async () => {
    await expect(
      createBad("mock-alice", { name: "空", spots: [] }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("不正な spot_type は 422", async () => {
    await expect(
      createBad("mock-alice", {
        name: "x",
        spots: [{ spot_type: "hotel", spot_id: 1 }],
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("存在しない spot_id は 422", async () => {
    await expect(
      createBad("mock-alice", {
        name: "x",
        spots: [{ spot_type: "temple", spot_id: 9999 }],
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("不正な transport は 422", async () => {
    await expect(
      createBad("mock-alice", {
        name: "x",
        spots: [{ spot_type: "temple", spot_id: 1, transport: "teleport" }],
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("非オブジェクトの spot 要素（[null]）は TypeError ではなく 422", async () => {
    await expect(
      createBad("mock-alice", { name: "x", spots: [null] }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("route キー欠落は 400", async () => {
    await expect(
      mockClient("/routes", jsonBody("mock-alice", { name: "x" })),
    ).rejects.toMatchObject({ status: 400 });
  });
});

function createBad(userId: string, route: unknown) {
  return mockClient("/routes", jsonBody(userId, { route }));
}

describe("mockClient GET /routes（一覧）", () => {
  it("自分のルートのみ spot_count 付きで返す", async () => {
    await createSample("mock-alice");
    await createSample("mock-bob");

    const res = await mockClient<RouteListResponse>("/routes", auth("mock-alice"));
    expect(res.data).toHaveLength(1);
    expect(res.data[0].spot_count).toBe(2);
    expect(res.meta.total_count).toBe(1);
  });

  it("未認証は 401", async () => {
    await expect(mockClient("/routes")).rejects.toBeInstanceOf(ApiError);
    await expect(mockClient("/routes")).rejects.toMatchObject({ status: 401 });
  });
});

describe("mockClient GET /routes/:id（詳細）", () => {
  it("自分のルートは詳細を返す", async () => {
    const created = await createSample("mock-alice");
    const res = await mockClient<RouteDetailResponse>(
      `/routes/${created.data.id}`,
      auth("mock-alice"),
    );
    expect(res.data.id).toBe(created.data.id);
    expect(res.data.spots).toHaveLength(2);
  });

  it("他人のルートは 404", async () => {
    const created = await createSample("mock-alice");
    await expect(
      mockClient(`/routes/${created.data.id}`, auth("mock-bob")),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("存在しない ID は 404", async () => {
    await expect(
      mockClient("/routes/9999", auth("mock-alice")),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("mockClient PATCH /routes/:id（更新）", () => {
  const patch = (userId: string, id: number, body: unknown): RequestInit => ({
    method: "PATCH",
    headers: { Authorization: `Bearer mock:${userId}` },
    body: JSON.stringify(body),
  });

  it("spots を渡すと総入れ替えして再計算する", async () => {
    const created = await createSample("mock-alice");
    const res = await mockClient<RouteDetailResponse>(
      `/routes/${created.data.id}`,
      patch("mock-alice", created.data.id, {
        route: {
          name: "新ルート",
          spots: [{ spot_type: "temple", spot_id: 3, transport: "train" }],
        },
      }),
    );
    expect(res.data.name).toBe("新ルート");
    expect(res.data.spots).toHaveLength(1);
    expect(res.data.spots[0].id).toBe(3);
  });

  it("spots を渡さないと name/description のみ部分更新し既存スポットを保持する", async () => {
    const created = await createSample("mock-alice");
    const res = await mockClient<RouteDetailResponse>(
      `/routes/${created.data.id}`,
      patch("mock-alice", created.data.id, {
        route: { description: "説明だけ更新" },
      }),
    );
    expect(res.data.description).toBe("説明だけ更新");
    expect(res.data.name).toBe("祇園抹茶巡り");
    expect(res.data.spots).toHaveLength(2);
  });

  it("spots 空配列は 422（既存スポットは保持）", async () => {
    const created = await createSample("mock-alice");
    await expect(
      mockClient(
        `/routes/${created.data.id}`,
        patch("mock-alice", created.data.id, { route: { spots: [] } }),
      ),
    ).rejects.toMatchObject({ status: 422 });
    const after = await mockClient<RouteDetailResponse>(
      `/routes/${created.data.id}`,
      auth("mock-alice"),
    );
    expect(after.data.spots).toHaveLength(2);
  });

  it("他人のルートは 404", async () => {
    const created = await createSample("mock-alice");
    await expect(
      mockClient(
        `/routes/${created.data.id}`,
        patch("mock-bob", created.data.id, { route: { name: "乗っ取り" } }),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("mockClient DELETE /routes/:id", () => {
  const del = (userId: string): RequestInit => ({
    method: "DELETE",
    headers: { Authorization: `Bearer mock:${userId}` },
  });

  it("削除すると以後 404 になる", async () => {
    const created = await createSample("mock-alice");
    const res = await mockClient<void>(
      `/routes/${created.data.id}`,
      del("mock-alice"),
    );
    expect(res).toBeUndefined();
    await expect(
      mockClient(`/routes/${created.data.id}`, auth("mock-alice")),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("他人のルートは削除できず 404", async () => {
    const created = await createSample("mock-alice");
    await expect(
      mockClient(`/routes/${created.data.id}`, del("mock-bob")),
    ).rejects.toMatchObject({ status: 404 });
  });
});
