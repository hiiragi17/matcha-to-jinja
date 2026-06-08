import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LikedSpotsList from "@/components/common/LikedSpotsList";

const useSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

beforeEach(() => {
  useSessionMock.mockReset();
});

describe("LikedSpotsList — マイページの CSR ガード", () => {
  it("未ログインでは「お気に入り一覧の表示にはログインが必要」案内とログインリンクを表示する", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<LikedSpotsList kind="greentea" />);

    expect(
      screen.getByText(/お気に入り一覧の表示にはログインが必要/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /ログインへ/ });
    expect(link).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fmypage%2Fgreentea-likes",
    );
  });

  it("temple 種別では callbackUrl が /mypage/temple-likes になる", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<LikedSpotsList kind="temple" />);

    const link = screen.getByRole("link", { name: /ログインへ/ });
    expect(link).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fmypage%2Ftemple-likes",
    );
  });
});
