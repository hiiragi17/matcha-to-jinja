import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "@/components/layout/Header";

const useSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

beforeEach(() => {
  useSessionMock.mockReset();
});

describe("Header — 共通ヘッダー", () => {
  it("ロゴがトップへのリンクになっている", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<Header />);

    const logoLink = screen.getByRole("link", { name: /トップへ/ });
    expect(logoLink).toHaveAttribute("href", "/");
    expect(within(logoLink).getByRole("img")).toHaveAttribute(
      "alt",
      "抹茶と神社。",
    );
  });

  it("主要ナビゲーションリンクを表示する", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<Header />);

    // PC / モバイル両方にナビがあるため getAllByRole で確認する。
    expect(
      screen.getAllByRole("link", { name: "抹茶スイーツ" })[0],
    ).toHaveAttribute("href", "/greenteas");
    expect(
      screen.getAllByRole("link", { name: "神社仏閣" })[0],
    ).toHaveAttribute("href", "/temples");
    expect(
      screen.getAllByRole("link", { name: "お問い合わせ" })[0],
    ).toHaveAttribute(
      "href",
      "https://docs.google.com/forms/d/e/1FAIpQLSdYI7QDiZJ_WlBFuVsc6DCb-1s0JUwy_NGfLeqnWO_EP76pIQ/viewform?usp=dialog",
    );
  });

  it("未ログイン時はログインリンクを表示する", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<Header />);

    expect(screen.getAllByRole("link", { name: "ログイン" }).length).toBeGreaterThan(
      0,
    );
  });

  it("ログイン時はマイページ（お気に入り）への導線を表示する", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "テスト太郎", email: "t@example.com" } },
      status: "authenticated",
    });

    render(<Header />);

    const favoriteLinks = screen.getAllByRole("link", { name: /お気に入り/ });
    expect(favoriteLinks[0]).toHaveAttribute("href", "/mypage");
    expect(
      screen.queryByRole("link", { name: "ログイン" }),
    ).not.toBeInTheDocument();
  });
});
