import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserMenu from "@/components/auth/UserMenu";

const signOutMock = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

beforeEach(() => {
  signOutMock.mockReset();
});

describe("UserMenu", () => {
  it("user.name を表示名として表示する", () => {
    render(<UserMenu user={{ name: "中村さん", email: null, image: null }} />);

    expect(screen.getByText("中村さん")).toBeInTheDocument();
  });

  it("name が無い場合は「ゲスト」を表示する", () => {
    render(<UserMenu user={{ name: null, email: null, image: null }} />);

    expect(screen.getByText("ゲスト")).toBeInTheDocument();
  });

  it("マイページへのリンクを持つ", () => {
    render(<UserMenu user={{ name: "中村さん", email: null, image: null }} />);

    expect(screen.getByRole("link", { name: "マイページ" })).toHaveAttribute(
      "href",
      "/mypage",
    );
  });

  it("ログアウトボタンを押すと signOut がトップページへのリダイレクト指定で呼ばれる", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ name: "中村さん", email: null, image: null }} />);

    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
