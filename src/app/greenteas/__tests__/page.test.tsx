import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  // Next.js の redirect() は throw して呼び出し以降の処理を中断する。
  // テストでは sentinel エラーを投げて呼び出しを検知する。
  throw new Error(`NEXT_REDIRECT:${url}`);
});

const getGreenteasMock = vi.fn();
const getGenresMock = vi.fn().mockResolvedValue({ genres: [] });

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getGreenteas: getGreenteasMock,
    getGenres: getGenresMock,
  };
});

beforeEach(() => {
  redirectMock.mockClear();
  getGreenteasMock.mockReset();
});

describe("/greenteas page — SSR 境界", () => {
  it("page= が total_pages を超えると最終ページへ redirect する", async () => {
    getGreenteasMock.mockResolvedValueOnce({
      greenteas: [],
      meta: { current_page: 5, total_pages: 5, total_count: 50 },
    });
    const { default: Page } = await import("@/app/greenteas/page");

    await expect(
      Page({ searchParams: Promise.resolve({ page: "9" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/greenteas?page=5");
  });

  it("検索条件付きで範囲外の page= を指定しても q / genre が保持される", async () => {
    getGreenteasMock.mockResolvedValueOnce({
      greenteas: [],
      meta: { current_page: 3, total_pages: 3, total_count: 30 },
    });
    const { default: Page } = await import("@/app/greenteas/page");

    await expect(
      Page({
        searchParams: Promise.resolve({ page: "10", q: "中村", genre: "3" }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const target = redirectMock.mock.calls[0][0] as string;
    expect(target.startsWith("/greenteas?")).toBe(true);
    const url = new URL(target, "http://localhost");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("q")).toBe("中村");
    expect(url.searchParams.get("genre")).toBe("3");
  });

  it("page が範囲内なら redirect は呼ばれない", async () => {
    getGreenteasMock.mockResolvedValueOnce({
      greenteas: [],
      meta: { current_page: 2, total_pages: 5, total_count: 50 },
    });
    const { default: Page } = await import("@/app/greenteas/page");

    await Page({ searchParams: Promise.resolve({ page: "2" }) });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
