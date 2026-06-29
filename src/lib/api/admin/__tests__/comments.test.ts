import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import {
  adminDeleteGreenteaComment,
  adminDeleteTempleComment,
  listAdminComments,
} from "@/lib/api/admin/comments";
import type { AdminComment } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

const greenteaComment: AdminComment = {
  id: 101,
  body: "抹茶パフェが最高でした",
  user: { id: 1, name: "テスト太郎" },
  created_at: "2026-06-01T00:00:00.000Z",
  resource_type: "greentea",
  resource_id: 1,
  resource_name: "茶寮 翠",
};

const templeComment: AdminComment = {
  id: 202,
  body: "静かで落ち着く神社でした",
  user: { id: 2, name: "テスト花子" },
  created_at: "2026-06-02T00:00:00.000Z",
  resource_type: "temple",
  resource_id: 3,
  resource_name: "下鴨神社",
};

describe("admin/comments API", () => {
  it("listAdminComments は GET /admin/comments に Bearer を送り横断一覧を返す", async () => {
    let captured: { auth: string | null } | null = null;
    server.use(
      http.get(endpoint("/admin/comments"), ({ request }) => {
        captured = { auth: request.headers.get("Authorization") };
        return HttpResponse.json({
          comments: [greenteaComment, templeComment],
        });
      }),
    );

    const res = await listAdminComments("jwt-token");

    expect(captured).not.toBeNull();
    expect(captured!.auth).toBe("Bearer jwt-token");
    expect(res.comments).toHaveLength(2);
    expect(res.comments[0].resource_type).toBe("greentea");
    expect(res.comments[1].resource_type).toBe("temple");
  });

  it("adminDeleteGreenteaComment は DELETE /admin/greenteacomments/:id を呼ぶ（204）", async () => {
    let captured: { auth: string | null } | null = null;
    server.use(
      http.delete(endpoint("/admin/greenteacomments/101"), ({ request }) => {
        captured = { auth: request.headers.get("Authorization") };
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    await expect(
      adminDeleteGreenteaComment(101, "jwt-token"),
    ).resolves.toBeUndefined();
    expect(captured!.auth).toBe("Bearer jwt-token");
  });

  it("adminDeleteTempleComment は DELETE /admin/templecomments/:id を呼ぶ（204）", async () => {
    let captured: { auth: string | null } | null = null;
    server.use(
      http.delete(endpoint("/admin/templecomments/202"), ({ request }) => {
        captured = { auth: request.headers.get("Authorization") };
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    await expect(
      adminDeleteTempleComment(202, "jwt-token"),
    ).resolves.toBeUndefined();
    expect(captured!.auth).toBe("Bearer jwt-token");
  });
});
