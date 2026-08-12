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

  it("マイページリンクをクリックするとドロップダウンが閉じる（別ページへ遷移してもメニューが開いたままにならない）", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ name: "中村さん", email: null, image: null }} />);

    const details = screen
      .getByLabelText("ユーザーメニューを開く")
      .closest("details")!;
    details.open = true;

    await user.click(screen.getByRole("link", { name: "マイページ" }));

    expect(details.open).toBe(false);
  });

  it("ログアウトボタンをクリックするとドロップダウンが閉じる", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ name: "中村さん", email: null, image: null }} />);

    const details = screen
      .getByLabelText("ユーザーメニューを開く")
      .closest("details")!;
    details.open = true;

    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(details.open).toBe(false);
  });

  it("メニュー外をクリックすると閉じる", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <UserMenu user={{ name: "中村さん", email: null, image: null }} />
        <p>外側</p>
      </div>,
    );

    const details = screen
      .getByLabelText("ユーザーメニューを開く")
      .closest("details")!;
    details.open = true;

    await user.click(screen.getByText("外側"));

    expect(details.open).toBe(false);
  });
});
