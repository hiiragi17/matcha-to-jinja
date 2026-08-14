import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BottomTabBar from "@/components/layout/BottomTabBar";

const useSessionMock = vi.fn();
let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

beforeEach(() => {
  currentPathname = "/";
  useSessionMock.mockReset();
  useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
});

describe("BottomTabBar — モバイル用下部タブ", () => {
  it("主要なタブリンクを表示する", () => {
    render(<BottomTabBar />);

    expect(screen.getByRole("link", { name: /ホーム/ })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /抹茶/ })).toHaveAttribute(
      "href",
      "/greenteas",
    );
    expect(screen.getByRole("link", { name: /神社/ })).toHaveAttribute(
      "href",
      "/temples",
    );
    expect(screen.getByRole("link", { name: /現在地/ })).toHaveAttribute(
      "href",
      "/nearby",
    );
  });

  it("未ログイン時、マイタブはログインページへのリンクになる", () => {
    render(<BottomTabBar />);

    expect(screen.getByRole("link", { name: /マイ/ })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  it("ログイン時、マイタブはマイページへのリンクになる", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "テスト太郎", email: "t@example.com" } },
      status: "authenticated",
    });

    render(<BottomTabBar />);

    expect(screen.getByRole("link", { name: /マイ/ })).toHaveAttribute(
      "href",
      "/mypage",
    );
  });

  it("現在地のパスに応じてアクティブ表示になる", () => {
    currentPathname = "/greenteas/1";
    render(<BottomTabBar />);

    expect(screen.getByRole("link", { name: /抹茶/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /ホーム/ })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
