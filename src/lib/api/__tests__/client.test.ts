import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import { ApiError, apiClient, buildQuery } from "@/lib/api/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

describe("buildQuery", () => {
  it("引数なしのときは空文字列を返す", () => {
    expect(buildQuery()).toBe("");
  });

  it("空オブジェクトでも空文字列を返す（先頭の ? を付けない）", () => {
    expect(buildQuery({})).toBe("");
  });

  it("有効な値が一つも無ければ空文字列を返す", () => {
    expect(buildQuery({ a: undefined, b: null, c: "" })).toBe("");
  });

  it("通常の key/value をクエリ文字列に変換する", () => {
    expect(buildQuery({ page: 1 })).toBe("?page=1");
  });

  it("undefined / null / 空文字は除外する", () => {
    expect(
      buildQuery({ page: 2, q: undefined, sort: null, name: "" }),
    ).toBe("?page=2");
  });

  it("真偽値・数値も文字列化する", () => {
    expect(buildQuery({ active: true, archived: false, count: 0 })).toBe(
      "?active=true&archived=false&count=0",
    );
  });

  it("ネストしたオブジェクトを key[nestedKey] 形式（Ransack）に展開する", () => {
    const q = buildQuery({ q: { name_cont: "辻利", genres_id_eq: 3 } });
    const params = new URLSearchParams(q.slice(1));
    expect(params.get("q[name_cont]")).toBe("辻利");
    expect(params.get("q[genres_id_eq]")).toBe("3");
  });

  it("ネスト内の undefined / null / 空文字も除外する", () => {
    const q = buildQuery({
      q: { name_cont: "中村", genres_id_eq: undefined, areas_id_eq: null },
    });
    expect(q).toBe("?" + new URLSearchParams({ "q[name_cont]": "中村" }).toString());
  });
});

describe("apiClient", () => {
  it("GET 時は Content-Type を付けない", async () => {
    let contentType: string | null = "__unset__";
    server.use(
      http.get(endpoint("/ping"), ({ request }) => {
        contentType = request.headers.get("Content-Type");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient("/ping");
    expect(contentType).toBeNull();
  });

  it("POST 時は Content-Type: application/json を自動で付ける", async () => {
    let contentType: string | null = null;
    server.use(
      http.post(endpoint("/echo"), ({ request }) => {
        contentType = request.headers.get("Content-Type");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient("/echo", { method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(contentType).toBe("application/json");
  });

  it("呼び出し側が指定した Content-Type を上書きしない", async () => {
    let contentType: string | null = null;
    server.use(
      http.post(endpoint("/echo"), ({ request }) => {
        contentType = request.headers.get("Content-Type");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient("/echo", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "raw",
    });
    expect(contentType).toBe("text/plain");
  });

  it("既存の Headers インスタンスとマージしても元のヘッダが欠落しない", async () => {
    let custom: string | null = null;
    let contentType: string | null = null;
    server.use(
      http.post(endpoint("/echo"), ({ request }) => {
        custom = request.headers.get("X-Custom");
        contentType = request.headers.get("Content-Type");
        return HttpResponse.json({ ok: true });
      }),
    );

    const headers = new Headers();
    headers.set("X-Custom", "yes");

    await apiClient("/echo", {
      method: "POST",
      headers,
      body: JSON.stringify({ a: 1 }),
    });

    expect(custom).toBe("yes");
    expect(contentType).toBe("application/json");
  });

  it("authToken 指定時に Authorization: Bearer ヘッダを付与する", async () => {
    let auth: string | null = null;
    server.use(
      http.get(endpoint("/me"), ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient("/me", { authToken: "jwt-token" });
    expect(auth).toBe("Bearer jwt-token");
  });

  it("既存の Authorization ヘッダは authToken で上書きしない", async () => {
    let auth: string | null = null;
    server.use(
      http.get(endpoint("/me"), ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient("/me", {
      authToken: "should-not-win",
      headers: { Authorization: "Bearer existing" },
    });
    expect(auth).toBe("Bearer existing");
  });

  it("204 No Content では undefined を返す（res.json() の SyntaxError を起こさない）", async () => {
    server.use(
      http.delete(endpoint("/items/1"), () =>
        HttpResponse.text(null, { status: 204 }),
      ),
    );
    await expect(
      apiClient("/items/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("200 でも空ボディなら undefined を返す", async () => {
    server.use(
      http.get(endpoint("/empty"), () => HttpResponse.text("", { status: 200 })),
    );
    await expect(apiClient("/empty")).resolves.toBeUndefined();
  });

  it("非 2xx のとき ApiError を throw する（JSON ボディは data に含まれる）", async () => {
    server.use(
      http.get(endpoint("/boom"), () =>
        HttpResponse.json({ error: "bad" }, { status: 422 }),
      ),
    );

    await expect(apiClient("/boom")).rejects.toBeInstanceOf(ApiError);
    await expect(apiClient("/boom")).rejects.toMatchObject({
      status: 422,
      data: { error: "bad" },
    });
  });

  it("非 JSON のエラーボディでも throw する（data は null）", async () => {
    server.use(
      http.get(endpoint("/boom-html"), () =>
        HttpResponse.text("<html>500</html>", { status: 500 }),
      ),
    );

    const err = await apiClient("/boom-html").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).data).toBeNull();
  });

  it("成功レスポンスの JSON を型キャストして返す", async () => {
    server.use(
      http.get(endpoint("/json"), () =>
        HttpResponse.json({ value: 7 }),
      ),
    );

    const res = await apiClient<{ value: number }>("/json");
    expect(res.value).toBe(7);
  });
});
