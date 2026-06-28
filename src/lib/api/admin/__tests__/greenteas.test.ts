import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import {
  createGreentea,
  deleteGreentea,
  updateGreentea,
} from "@/lib/api/admin/greenteas";
import type { GreenteaInput } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

const input: GreenteaInput = {
  name: "新店",
  description: "説明",
  address: "京都市中京区",
  access: "駅から徒歩1分",
  phone_number: "075-000-0000",
  business_hours: "10:00-18:00",
  holiday: "水曜",
  homepage: "https://example.com",
  closed: false,
  img: "https://example.com/x.png",
  latitude: 35.01,
  longitude: 135.77,
  genre_ids: [1, 2],
};

const greenteaFixture = {
  id: 9001,
  ...input,
  genres: [{ id: 1, name: "パフェ" }],
  likes_count: 0,
  liked_by_current_user: false,
};

describe("admin/greenteas API", () => {
  it("createGreentea は POST /admin/greenteas に body と Bearer を送る", async () => {
    let captured: { auth: string | null; body: unknown } | null = null;
    server.use(
      http.post(endpoint("/admin/greenteas"), async ({ request }) => {
        captured = {
          auth: request.headers.get("Authorization"),
          body: await request.json(),
        };
        return HttpResponse.json({ greentea: greenteaFixture });
      }),
    );

    const res = await createGreentea(input, "jwt-token");

    expect(captured).not.toBeNull();
    expect(captured!.auth).toBe("Bearer jwt-token");
    expect(captured!.body).toEqual(input);
    expect(res.greentea.id).toBe(9001);
  });

  it("updateGreentea は PATCH /admin/greenteas/:id に部分 body を送る", async () => {
    let captured: { method: string; body: unknown } | null = null;
    server.use(
      http.patch(endpoint("/admin/greenteas/9001"), async ({ request }) => {
        captured = { method: request.method, body: await request.json() };
        return HttpResponse.json({
          greentea: { ...greenteaFixture, name: "更新後" },
        });
      }),
    );

    const res = await updateGreentea(9001, { name: "更新後" }, "jwt-token");

    expect(captured!.method).toBe("PATCH");
    expect(captured!.body).toEqual({ name: "更新後" });
    expect(res.greentea.name).toBe("更新後");
  });

  it("deleteGreentea は DELETE /admin/greenteas/:id を呼ぶ（204）", async () => {
    let called = false;
    server.use(
      http.delete(endpoint("/admin/greenteas/9001"), () => {
        called = true;
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    await expect(deleteGreentea(9001, "jwt-token")).resolves.toBeUndefined();
    expect(called).toBe(true);
  });
});
