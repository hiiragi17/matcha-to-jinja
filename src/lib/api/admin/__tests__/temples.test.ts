import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import {
  createTemple,
  deleteTemple,
  updateTemple,
} from "@/lib/api/admin/temples";
import type { TempleInput } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

const input: TempleInput = {
  name: "新神社",
  description: "説明",
  address: "京都市左京区",
  access: "駅から徒歩1分",
  phone_number: "075-000-0000",
  business_hours: "終日参拝可",
  holiday: "なし",
  homepage: "https://example.com",
  img: "https://example.com/x.png",
  latitude: 35.01,
  longitude: 135.77,
  area_ids: [1, 2],
};

const templeFixture = {
  id: 9001,
  ...input,
  areas: [{ id: 1, name: "東山区" }],
  likes_count: 0,
  liked_by_current_user: false,
};

describe("admin/temples API", () => {
  it("createTemple は POST /admin/temples に body と Bearer を送る", async () => {
    let captured: { auth: string | null; body: unknown } | null = null;
    server.use(
      http.post(endpoint("/admin/temples"), async ({ request }) => {
        captured = {
          auth: request.headers.get("Authorization"),
          body: await request.json(),
        };
        return HttpResponse.json({ temple: templeFixture });
      }),
    );

    const res = await createTemple(input, "jwt-token");

    expect(captured).not.toBeNull();
    expect(captured!.auth).toBe("Bearer jwt-token");
    expect(captured!.body).toEqual(input);
    expect(res.temple.id).toBe(9001);
  });

  it("updateTemple は PATCH /admin/temples/:id に部分 body を送る", async () => {
    let captured: { method: string; body: unknown } | null = null;
    server.use(
      http.patch(endpoint("/admin/temples/9001"), async ({ request }) => {
        captured = { method: request.method, body: await request.json() };
        return HttpResponse.json({
          temple: { ...templeFixture, name: "更新後" },
        });
      }),
    );

    const res = await updateTemple(9001, { name: "更新後" }, "jwt-token");

    expect(captured!.method).toBe("PATCH");
    expect(captured!.body).toEqual({ name: "更新後" });
    expect(res.temple.name).toBe("更新後");
  });

  it("deleteTemple は DELETE /admin/temples/:id を呼ぶ（204）", async () => {
    let called = false;
    server.use(
      http.delete(endpoint("/admin/temples/9001"), () => {
        called = true;
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    await expect(deleteTemple(9001, "jwt-token")).resolves.toBeUndefined();
    expect(called).toBe(true);
  });
});
