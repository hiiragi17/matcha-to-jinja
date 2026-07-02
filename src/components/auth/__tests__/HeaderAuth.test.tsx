import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeaderAuth from "@/components/auth/HeaderAuth";

const useSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: vi.fn(),
}));

beforeEach(() => {
  useSessionMock.mockReset();
});

describe("HeaderAuth", () => {
  it("未ログイン時はログインリンクを表示する", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<HeaderAuth />);

    expect(
      screen.getByRole("link", { name: /ログイン/ }),
    ).toHaveAttribute("href", "/auth/login");
    expect(
      screen.getByRole("link", { name: /お気に入り/ }),
    ).toHaveAttribute("href", "/auth/login");
    expect(
      screen.queryByLabelText(/ユーザーメニューを開く/),
    ).not.toBeInTheDocument();
  });

  it("session はあるが user がない場合も未ログイン表示になる", () => {
    useSessionMock.mockReturnValue({
      data: { expires: "2099-01-01" },
      status: "authenticated",
    });
    render(<HeaderAuth />);

    expect(
      screen.getByRole("link", { name: /ログイン/ }),
    ).toBeInTheDocument();
  });

  it("ログイン済み時は UserMenu とマイページリンクを表示する", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "ゲストさん", email: null, image: null } },
      status: "authenticated",
    });
    render(<HeaderAuth />);

    expect(screen.getByRole("link", { name: /お気に入り/ })).toHaveAttribute(
      "href",
      "/mypage",
    );
    expect(
      screen.getByLabelText(/ユーザーメニューを開く/),
    ).toBeInTheDocument();
    expect(screen.getByText("ゲストさん")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^ログイン$/ })).not.toBeInTheDocument();
  });
});
