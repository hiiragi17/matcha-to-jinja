import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";

const notFoundMock = vi.fn(() => {
  // Next.js の notFound() は throw して呼び出し以降の処理を中断する。
  // テストでは sentinel エラーを投げて呼び出しを検知する。
  throw new Error("NEXT_NOT_FOUND");
});

const getGreenteaMock = vi.fn();
const authMock = vi.fn().mockResolvedValue(null);

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
    getGreentea: getGreenteaMock,
  };
});

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

beforeEach(() => {
  notFoundMock.mockClear();
  getGreenteaMock.mockReset();
});

describe("/greenteas/[id] page — SSR 境界", () => {
  it("getGreentea が ApiError(404) を投げると notFound() が呼ばれる", async () => {
    getGreenteaMock.mockRejectedValueOnce(new ApiError(404, null));
    const { default: Page } = await import("@/app/greenteas/[id]/page");

    await expect(
      Page({ params: Promise.resolve({ id: "999" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("404 以外の ApiError はそのまま伝播する（notFound は呼ばない）", async () => {
    getGreenteaMock.mockRejectedValueOnce(new ApiError(500, null));
    const { default: Page } = await import("@/app/greenteas/[id]/page");

    await expect(
      Page({ params: Promise.resolve({ id: "1" }) }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
