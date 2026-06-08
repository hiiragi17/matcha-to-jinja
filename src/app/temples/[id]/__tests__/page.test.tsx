import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";

// vi.mock のファクトリは vi.mock 自体と共にホイストされる。top-level const を
// 直接参照すると TDZ に当たる恐れがあるため、共有 fake は vi.hoisted() で先に作る。
const { notFoundMock, getTempleMock, authMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getTempleMock: vi.fn(),
  authMock: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getTemple: getTempleMock,
  };
});

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

beforeEach(() => {
  notFoundMock.mockClear();
  getTempleMock.mockReset();
});

describe("/temples/[id] page — SSR 境界", () => {
  it("getTemple が ApiError(404) を投げると notFound() が呼ばれる", async () => {
    getTempleMock.mockRejectedValueOnce(new ApiError(404, null));
    const { default: Page } = await import("@/app/temples/[id]/page");

    await expect(
      Page({ params: Promise.resolve({ id: "999" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("404 以外のエラーは notFound を呼ばずに伝播する", async () => {
    getTempleMock.mockRejectedValueOnce(new ApiError(500, null));
    const { default: Page } = await import("@/app/temples/[id]/page");

    await expect(
      Page({ params: Promise.resolve({ id: "1" }) }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
