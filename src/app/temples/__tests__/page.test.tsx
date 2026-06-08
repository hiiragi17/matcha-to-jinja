import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

const getTemplesMock = vi.fn();
const getAreasMock = vi.fn().mockResolvedValue({ areas: [] });

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
    getTemples: getTemplesMock,
    getAreas: getAreasMock,
  };
});

beforeEach(() => {
  redirectMock.mockClear();
  getTemplesMock.mockReset();
});

describe("/temples page — SSR 境界", () => {
  it("page= が total_pages を超えると最終ページへ redirect する", async () => {
    getTemplesMock.mockResolvedValueOnce({
      temples: [],
      meta: { current_page: 4, total_pages: 4, total_count: 40 },
    });
    const { default: Page } = await import("@/app/temples/page");

    await expect(
      Page({ searchParams: Promise.resolve({ page: "10" }) }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/temples?page=4");
  });

  it("total_pages が 0 のときは redirect しない（ループ防止）", async () => {
    getTemplesMock.mockResolvedValueOnce({
      temples: [],
      meta: { current_page: 1, total_pages: 0, total_count: 0 },
    });
    const { default: Page } = await import("@/app/temples/page");

    await Page({ searchParams: Promise.resolve({ page: "5" }) });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("検索条件付きで範囲外の page= を指定しても q / area が保持される", async () => {
    getTemplesMock.mockResolvedValueOnce({
      temples: [],
      meta: { current_page: 2, total_pages: 2, total_count: 20 },
    });
    const { default: Page } = await import("@/app/temples/page");

    await expect(
      Page({
        searchParams: Promise.resolve({ page: "9", q: "清水", area: "1" }),
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const target = redirectMock.mock.calls[0][0] as string;
    const url = new URL(target, "http://localhost");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("q")).toBe("清水");
    expect(url.searchParams.get("area")).toBe("1");
  });
});
